import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPartnerProductsFix() {
  console.log('🧪 Testing the partner products fix...\n');

  try {
    // Get Laurent store partner profile
    const { data: laurentPartner, error: partnerError } = await supabase
      .from('partner_profiles')
      .select('id, store_name, user_id')
      .eq('store_name', 'Laurent store')
      .single();

    if (partnerError) {
      console.error('❌ Error finding Laurent store:', partnerError);
      return;
    }

    console.log(`✅ Found partner: ${laurentPartner.store_name}`);
    console.log(`   Partner Profile ID: ${laurentPartner.id}`);
    console.log(`   User ID: ${laurentPartner.user_id}\n`);

    // Test the exact query from the fixed frontend code
    console.log('🔍 Testing the exact frontend query...');
    
    // First get the user_id for this partner profile (as done in the fixed code)
    const { data: partnerProfile, error: profileError } = await supabase
      .from('partner_profiles')
      .select('user_id')
      .eq('id', laurentPartner.id)
      .single();

    if (profileError) {
      console.error('❌ Error getting partner profile:', profileError);
      return;
    }

    if (!partnerProfile?.user_id) {
      console.error('❌ No user_id found for partner profile');
      return;
    }

    console.log(`✅ Found user_id: ${partnerProfile.user_id}`);

    // Now query partner products using the user_id (as done in the fixed code)
    const { data: partnerProducts, error: productsError } = await supabase
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
      .eq('partner_id', partnerProfile.user_id) // Use user_id instead of partner_profile_id
      .eq('is_active', true);

    if (productsError) {
      console.error('❌ Error fetching partner products:', productsError);
      return;
    }

    console.log(`✅ Found ${partnerProducts?.length || 0} products for Laurent store:`);
    partnerProducts?.forEach((pp, index) => {
      console.log(`   ${index + 1}. ${pp.product?.title || 'Unknown Product'}`);
      console.log(`      SKU: ${pp.product?.sku || 'N/A'}`);
      console.log(`      Selling Price: $${pp.selling_price}`);
      console.log(`      Original Price: $${pp.product?.original_price || 'N/A'}`);
      console.log(`      Partner Product ID: ${pp.id}`);
      console.log('');
    });

    // Test the old way (should return 0 results)
    console.log('🔍 Testing the OLD way (should return 0 results)...');
    const { data: oldWayResults, error: oldWayError } = await supabase
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
      .eq('partner_id', laurentPartner.id) // Using partner_profile_id (old way)
      .eq('is_active', true);

    if (oldWayError) {
      console.error('❌ Error with old way:', oldWayError);
    } else {
      console.log(`❌ Old way returned ${oldWayResults?.length || 0} results (should be 0)`);
    }

    console.log('\n🎉 Fix verification complete! The frontend should now work correctly.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testPartnerProductsFix();
