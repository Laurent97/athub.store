import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabaseStructure() {
  console.log('🔍 Checking database structure...\n');

  try {
    // Check partner_profiles table structure
    console.log('📋 Checking partner_profiles table...');
    const { data: partners, error: partnersError } = await supabase
      .from('partner_profiles')
      .select('id, user_id, store_name')
      .eq('partner_status', 'approved')
      .limit(3);

    if (partnersError) {
      console.error('❌ Error with partner_profiles:', partnersError);
    } else {
      console.log('✅ partner_profiles sample data:');
      partners?.forEach(p => {
        console.log(`   ID: ${p.id}, User ID: ${p.user_id}, Store: ${p.store_name}`);
      });
    }

    // Check users table for these user_ids
    if (partners && partners.length > 0) {
      console.log('\n👤 Checking users table...');
      const userIds = partners.map(p => p.user_id).filter(Boolean);
      
      for (const userId of userIds) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, email, user_type')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error(`❌ User ${userId} not found:`, userError.message);
        } else {
          console.log(`✅ User found: ${user.email} (${user.user_type})`);
        }
      }
    }

    // Check existing partner_products structure
    console.log('\n🤝 Checking existing partner_products...');
    const { data: existingProducts, error: existingError } = await supabase
      .from('partner_products')
      .select('partner_id, product_id, selling_price')
      .eq('is_active', true)
      .limit(3);

    if (existingError) {
      console.error('❌ Error with partner_products:', existingError);
    } else {
      console.log('✅ Existing partner_products:');
      existingProducts?.forEach(pp => {
        console.log(`   Partner ID: ${pp.partner_id}, Product ID: ${pp.product_id}, Price: $${pp.selling_price}`);
      });
    }

    // Let's try to understand the foreign key constraint
    console.log('\n🔗 Testing partner_products insertion with user_id instead of partner_profile_id...');
    
    if (partners && partners.length > 0) {
      const testPartner = partners[0];
      console.log(`Testing with partner: ${testPartner.store_name}`);
      console.log(`Partner profile ID: ${testPartner.id}`);
      console.log(`User ID: ${testPartner.user_id}`);

      // Try with user_id
      const { data: testWithUserId, error: errorWithUserId } = await supabase
        .from('partner_products')
        .insert({
          partner_id: testPartner.user_id, // Using user_id instead of partner_profile_id
          product_id: '8d821102-703f-467f-9a53-c15f56fdf1bd', // Known product ID
          selling_price: 100.00,
          is_active: true
        })
        .select()
        .single();

      if (errorWithUserId) {
        console.log('❌ Failed with user_id:', errorWithUserId.message);
      } else {
        console.log('✅ Success with user_id! Partner product created.');
        console.log(`   Created partner product ID: ${testWithUserId.id}`);
        
        // Clean up the test record
        await supabase
          .from('partner_products')
          .delete()
          .eq('id', testWithUserId.id);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkDatabaseStructure();
