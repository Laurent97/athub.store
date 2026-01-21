import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugPartnerProducts() {
  console.log('🔍 Debugging Partner Products Issue...\n');

  try {
    // 1. Check partner profiles
    console.log('📋 Checking Partner Profiles...');
    const { data: partners, error: partnersError } = await supabase
      .from('partner_profiles')
      .select('id, store_name, store_slug, partner_status')
      .eq('partner_status', 'approved');

    if (partnersError) {
      console.error('❌ Error fetching partners:', partnersError);
    } else {
      console.log(`✅ Found ${partners?.length || 0} approved partners:`);
      partners?.forEach(p => {
        console.log(`   - ${p.store_name} (${p.store_slug}) - ID: ${p.id}`);
      });
    }

    // 2. Check products
    console.log('\n📦 Checking Products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, sku, is_active')
      .eq('is_active', true)
      .limit(5);

    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
    } else {
      console.log(`✅ Found ${products?.length || 0} active products (showing first 5):`);
      products?.forEach(p => {
        console.log(`   - ${p.title} (${p.sku}) - ID: ${p.id}`);
      });
    }

    // 3. Check partner products
    console.log('\n🤝 Checking Partner Products...');
    const { data: partnerProducts, error: partnerProductsError } = await supabase
      .from('partner_products')
      .select(`
        *,
        product:products (
          id,
          title,
          sku,
          original_price,
          images,
          make,
          model,
          category,
          stock_quantity
        )
      `)
      .eq('is_active', true)
      .limit(10);

    if (partnerProductsError) {
      console.error('❌ Error fetching partner products:', partnerProductsError);
    } else {
      console.log(`✅ Found ${partnerProducts?.length || 0} active partner products (showing first 10):`);
      partnerProducts?.forEach(pp => {
        console.log(`   - Partner: ${pp.partner_id}`);
        console.log(`     Product: ${pp.product?.title || 'Unknown'} (${pp.product?.sku || 'No SKU'})`);
        console.log(`     Price: $${pp.selling_price}`);
        console.log(`     Product ID: ${pp.product_id}`);
        console.log('');
      });
    }

    // 4. Test the exact query from the code for a specific partner
    if (partners && partners.length > 0) {
      const testPartner = partners[0];
      console.log(`\n🧪 Testing exact query for partner: ${testPartner.store_name}...`);
      
      const { data: testProducts, error: testError } = await supabase
        .from('partner_products')
        .select(`
          *,
          product:products (
            id,
            title,
            sku,
            original_price,
            images,
            make,
            model,
            category,
            stock_quantity
          )
        `)
        .eq('partner_id', testPartner.id)
        .eq('is_active', true);

      if (testError) {
        console.error('❌ Error with exact query:', testError);
      } else {
        console.log(`✅ Found ${testProducts?.length || 0} products for ${testPartner.store_name}:`);
        testProducts?.forEach(tp => {
          console.log(`   - ${tp.product?.title || 'Unknown Product'} - $${tp.selling_price}`);
        });
      }
    }

    // 5. Check if there are any RLS issues by trying to access as anon
    console.log('\n🔐 Checking RLS permissions...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('partner_products')
      .select('count')
      .eq('is_active', true);

    if (rlsError) {
      console.error('❌ RLS Error:', rlsError);
    } else {
      console.log('✅ RLS permissions seem OK');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugPartnerProducts();
