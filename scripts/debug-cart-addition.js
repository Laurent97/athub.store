import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function debugCartAddition() {
  console.log('🔍 Debugging Cart Addition Issue\n');

  try {
    const productId = 'd437c33e-5391-469d-9b9d-1f99ab3325a7';
    
    // Test 1: Get product data exactly as CartContext would
    console.log('📋 Test 1: Get product data...');
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) {
      console.error('❌ Product not found');
      return;
    }

    console.log('✅ Product Data:', {
      id: product.id,
      title: product.title,
      original_price: product.original_price,
      stock_quantity: product.stock_quantity
    });

    // Test 2: Simulate EXACT CartContext addItem logic
    console.log('\n📋 Test 2: Simulate CartContext addItem...');
    
    // This is the exact logic from CartContext.tsx
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

    console.log('✅ Created partner product:', {
      id: partnerProduct.id,
      selling_price: partnerProduct.selling_price,
      hasSellingPrice: !!partnerProduct.selling_price
    });

    // Test 3: Simulate the exact price calculation
    console.log('\n📋 Test 3: Test price calculation...');
    
    // This is the EXACT logic from CartContext.tsx line 96
    const price = partnerProduct?.selling_price || product.original_price || 0;
    
    console.log('Price Calculation Debug:', {
      partnerProductSellingPrice: partnerProduct?.selling_price,
      productOriginalPrice: product.original_price,
      calculatedPrice: price,
      isPriceValid: price > 0,
      willFailValidation: !price || price <= 0
    });

    if (!price || price <= 0) {
      console.error('❌ This will cause the exact error you are seeing!');
      console.error('   Product ID:', product.id);
      console.error('   Calculated Price:', price);
      console.error('   Partner Product:', partnerProduct);
      return;
    }

    console.log('✅ Price calculation would work correctly!');

    // Test 4: Check if there are any issues with product.original_price
    console.log('\n📋 Test 4: Check product.original_price type and value...');
    console.log('   Type:', typeof product.original_price);
    console.log('   Value:', product.original_price);
    console.log('   Is null:', product.original_price === null);
    console.log('   Is undefined:', product.original_price === undefined);
    console.log('   Is 0:', product.original_price === 0);

    // Test 5: Try to find any products with null/0 prices
    console.log('\n📋 Test 5: Check for products with price issues...');
    const { data: problemProducts } = await supabase
      .from('products')
      .select('id, title, original_price')
      .or('original_price.is.null,true', 'original_price.eq.0');

    if (problemProducts && problemProducts.length > 0) {
      console.log('❌ Found products with price issues:');
      problemProducts.forEach((p, index) => {
        console.log(`   Product ${index + 1}: ${p.title} - Price: ${p.original_price}`);
      });
    } else {
      console.log('✅ No products found with null/0 prices');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugCartAddition();
