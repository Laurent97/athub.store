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
    // Get all partners first
    const { data: allPartners, error: partnersError } = await supabase
      .from('partner_profiles')
      .select('id, store_name, store_slug')
      .eq('partner_status', 'approved');

    if (partnersError) {
      console.error('❌ Error fetching partners:', partnersError);
      return;
    }

    console.log(`📊 Found ${allPartners?.length || 0} approved partners\n`);

    // Check products for each partner
    for (const partner of allPartners || []) {
      const { data: partnerProducts, error: productsError } = await supabase
        .from('partner_products')
        .select(`
          id,
          selling_price,
          is_active,
          product:products(
            id,
            title,
            sku,
            is_active
          )
        `)
        .eq('partner_id', partner.id)
        .eq('is_active', true);

      if (productsError) {
        console.error(`❌ Error fetching products for ${partner.store_name}:`, productsError);
        continue;
      }

      const productCount = partnerProducts?.length || 0;
      
      if (productCount > 0) {
        console.log(`✅ ${partner.store_name} (${partner.store_slug}) - ${productCount} products:`);
        partnerProducts?.forEach(pp => {
          console.log(`   - ${pp.product?.title || 'Unknown'} ($${pp.selling_price})`);
        });
      } else {
        console.log(`❌ ${partner.store_name} (${partner.store_slug}) - NO PRODUCTS`);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkPartnerProducts();
