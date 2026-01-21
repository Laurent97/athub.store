import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugPartnerProducts() {
  console.log('🔍 Debugging partner products discrepancy...\n');

  try {
    // Get all partner products with their partner info
    const { data: partnerProducts, error } = await supabase
      .from('partner_products')
      .select(`
        id,
        partner_id,
        product_id,
        selling_price,
        is_active,
        product:products(
          id,
          title,
          sku
        )
      `)
      .eq('is_active', true);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log(`📊 Found ${partnerProducts?.length || 0} partner products:\n`);

    // Get all partner profiles for comparison
    const { data: allPartners } = await supabase
      .from('partner_profiles')
      .select('id, store_name, store_slug')
      .eq('partner_status', 'approved');

    const partnerMap = new Map(allPartners?.map(p => [p.id, p.store_name]));

    partnerProducts?.forEach(pp => {
      const partnerName = partnerMap.get(pp.partner_id) || 'UNKNOWN PARTNER';
      console.log(`🤝 Partner Product:`);
      console.log(`   Partner ID: ${pp.partner_id}`);
      console.log(`   Partner Name: ${partnerName}`);
      console.log(`   Product: ${pp.product?.title || 'Unknown'}`);
      console.log(`   Price: $${pp.selling_price}`);
      console.log('');
    });

    // Show all partner IDs for comparison
    console.log('\n📋 All Approved Partner IDs:');
    allPartners?.forEach(p => {
      console.log(`   ${p.id} - ${p.store_name}`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugPartnerProducts();
