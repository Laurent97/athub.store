import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createSamplePartnerProducts() {
  console.log('🔧 Creating sample partner products for existing partners...\n');

  try {
    // Get existing products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, original_price')
      .eq('is_active', true);

    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }

    // Get approved partners
    const { data: partners, error: partnersError } = await supabase
      .from('partner_profiles')
      .select('id, store_name')
      .eq('partner_status', 'approved');

    if (partnersError) {
      console.error('❌ Error fetching partners:', partnersError);
      return;
    }

    if (!products || products.length === 0) {
      console.log('❌ No products found. Cannot create partner products.');
      return;
    }

    if (!partners || partners.length === 0) {
      console.log('❌ No partners found. Cannot create partner products.');
      return;
    }

    console.log(`📦 Found ${products.length} products`);
    console.log(`🏪 Found ${partners.length} partners\n`);

    // Create partner products for each partner
    const createdProducts = [];

    for (const partner of partners) {
      // Assign 1-2 products to each partner with different pricing
      const numProductsToAssign = Math.floor(Math.random() * 2) + 1; // 1 or 2 products
      
      for (let i = 0; i < numProductsToAssign && i < products.length; i++) {
        const product = products[i];
        
        // Calculate selling price (original price +/- 20%)
        const variance = 0.8 + Math.random() * 0.4; // 80% to 120% of original price
        const sellingPrice = Math.round(product.original_price * variance * 100) / 100;

        const { data: newPartnerProduct, error: insertError } = await supabase
          .from('partner_products')
          .insert({
            partner_id: partner.id,
            product_id: product.id,
            selling_price: sellingPrice,
            is_active: true
          })
          .select()
          .single();

        if (insertError) {
          console.error(`❌ Error creating partner product for ${partner.store_name}:`, insertError);
        } else {
          console.log(`✅ Created partner product:`);
          console.log(`   Partner: ${partner.store_name}`);
          console.log(`   Product: ${product.title}`);
          console.log(`   Original Price: $${product.original_price}`);
          console.log(`   Selling Price: $${sellingPrice}`);
          console.log(`   Partner Product ID: ${newPartnerProduct.id}`);
          console.log('');
          
          createdProducts.push(newPartnerProduct);
        }
      }
    }

    console.log(`\n🎉 Successfully created ${createdProducts.length} partner products!`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createSamplePartnerProducts();
