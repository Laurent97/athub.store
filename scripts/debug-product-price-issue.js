import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function debugProductPriceIssue() {
  console.log('🔍 Debugging Product Price Issue\n');

  try {
    const productId = 'd437c33e-5391-469d-9b9d-1f99ab3325a7'; // The problematic product ID

    // Test 1: Check the actual product data
    console.log('📋 Test 1: Checking product data...');
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('❌ Error fetching product:', productError);
      return;
    }

    console.log('✅ Product Data:', {
      id: product.id,
      title: product.title,
      original_price: product.original_price,
      price: product.price, // Check if this field exists
      stock_quantity: product.stock_quantity,
      hasOriginalPrice: !!product.original_price,
      originalPriceType: typeof product.original_price,
      originalPriceValue: product.original_price
    });

    // Test 2: Check if there are any partner products for this product
    console.log('\n📋 Test 2: Checking partner products...');
    const { data: partnerProducts, error: partnerError } = await supabase
      .from('partner_products')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true);

    if (partnerError) {
      console.error('❌ Error fetching partner products:', partnerError);
    } else {
      console.log(`✅ Found ${partnerProducts?.length || 0} partner products:`);
      partnerProducts?.forEach((pp, index) => {
        console.log(`   Partner Product ${index + 1}:`, {
          id: pp.id,
          partner_id: pp.partner_id,
          selling_price: pp.selling_price,
          hasValidPrice: !!pp.selling_price && pp.selling_price > 0
        });
      });
    }

    // Test 3: Simulate the current cart addition logic
    console.log('\n📋 Test 3: Simulating cart addition...');
    
    // Current ProductDetail logic
    const partnerProduct = {
      id: `temp-${product.id}`,
      partner_id: 'temp-partner',
      product_id: product.id,
      selling_price: product.original_price || 0,
      profit_margin: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      partner_store_name: 'Direct Purchase'
    };

    const price = partnerProduct?.selling_price || product.original_price || 0;
    
    console.log('Cart Addition Simulation:', {
      productOriginalPrice: product.original_price,
      partnerProductSellingPrice: partnerProduct?.selling_price,
      calculatedPrice: price,
      isValid: price > 0,
      willPassValidation: !(!price || price <= 0)
    });

    if (!price || price <= 0) {
      console.error('❌ This will still cause the error!');
      console.log('Problem Analysis:');
      console.log('- product.original_price is:', product.original_price);
      console.log('- partnerProduct.selling_price is:', partnerProduct?.selling_price);
      console.log('- Final calculated price is:', price);
    } else {
      console.log('✅ This should work correctly!');
    }

    // Test 4: Check what field we should actually use
    console.log('\n📋 Test 4: Checking product schema...');
    const { data: schemaInfo } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (schemaInfo && schemaInfo.length > 0) {
      console.log('✅ Available product fields:', Object.keys(schemaInfo[0]));
      console.log('✅ Price fields found:', {
        hasOriginalPrice: 'original_price' in schemaInfo[0],
        hasPrice: 'price' in schemaInfo[0],
        originalPriceValue: schemaInfo[0].original_price,
        priceValue: schemaInfo[0].price
      });
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugProductPriceIssue();
