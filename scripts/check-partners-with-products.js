import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPartnerProducts() {
  console.log('🔍 Checking which partners have products...\n');

  try {
    // Get all partners with their product counts
    const { data: partnersWithProducts, error } = await supabase
      .from('partner_profiles')
      .select(`
        id,
        store_name,
        store_slug,
        partner_products!inner(
          id,
          selling_price,
          is_active,
          product:products(
            id,
            title,
            sku,
            is_active
          )
        )
      `)
      .eq('partner_status', 'approved')
      .eq('partner_products.is_active', true);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('📊 Partners with active products:');
    partnersWithProducts?.forEach(partner => {
      const productCount = partner.partner_products?.length || 0;
      console.log(`\n🏪 ${partner.store_name} (${partner.store_slug})`);
      console.log(`   ID: ${partner.id}`);
      console.log(`   Products: ${productCount}`);
      
      partner.partner_products?.forEach(pp => {
        console.log(`     - ${pp.product?.title || 'Unknown'} ($${pp.selling_price})`);
      });
    });

    // Also show partners without products
    const { data: allPartners } = await supabase
      .from('partner_profiles')
      .select('id, store_name, store_slug')
      .eq('partner_status', 'approved');

    const partnersWithProductsIds = new Set(partnersWithProducts?.map(p => p.id));
    const partnersWithoutProducts = allPartners?.filter(p => !partnersWithProductsIds.has(p.id));

    console.log('\n❌ Partners without products:');
    partnersWithoutProducts?.forEach(partner => {
      console.log(`   - ${partner.store_name} (${partner.store_slug}) - ID: ${partner.id}`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkPartnerProducts();
