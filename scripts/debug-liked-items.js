import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function debugLikedItemsQuery() {
  console.log('🔍 Debugging Liked Items Query\n');

  try {
    const userId = '4b3628ab-bd6a-424e-b99a-857d6c9a7fbc';
    const productId = 'd437c33e-5391-469d-9b9d-1f99ab3325a7';

    console.log('📋 Test 1: Check if liked_items table exists...');
    const { data: tableData, error: tableError } = await supabase
      .from('liked_items')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Table access error:', tableError);
      return;
    }

    console.log('✅ Table structure:', tableData && tableData.length > 0 ? Object.keys(tableData[0]) : 'Table exists but no data');

    console.log('\n📋 Test 2: Test basic query...');
    const { data: basicData, error: basicError } = await supabase
      .from('liked_items')
      .select('*')
      .eq('user_id', userId)
      .limit(5);

    if (basicError) {
      console.error('❌ Basic query error:', basicError);
    } else {
      console.log('✅ Basic query works, found:', basicData?.length || 0, 'items');
    }

    console.log('\n📋 Test 3: Test the exact failing query...');
    // Try the exact query that's failing
    const { data: exactData, error: exactError } = await supabase
      .from('liked_items')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', productId)
      .eq('item_type', 'product');

    if (exactError) {
      console.error('❌ Exact query error:', exactError);
      console.error('Error details:', {
        message: exactError.message,
        code: exactError.code,
        details: exactError.details,
        hint: exactError.hint
      });
    } else {
      console.log('✅ Exact query works:', exactData);
    }

    console.log('\n📋 Test 4: Test with URL-safe approach...');
    // Try a more conservative query approach
    const { data: safeData, error: safeError } = await supabase
      .from('liked_items')
      .select('id, user_id, item_id, item_type, liked_at')
      .match({
        user_id: userId,
        item_id: productId,
        item_type: 'product'
      });

    if (safeError) {
      console.error('❌ Safe query error:', safeError);
    } else {
      console.log('✅ Safe query works:', safeData);
    }

    console.log('\n📋 Test 5: Test with RPC approach...');
    // Try using RPC if available
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_user_liked_items', {
          p_user_id: userId,
          p_item_id: productId,
          p_item_type: 'product'
        });

      if (rpcError) {
        console.log('ℹ️ RPC not available:', rpcError.message);
      } else {
        console.log('✅ RPC works:', rpcData);
      }
    } catch (rpcErr) {
      console.log('ℹ️ RPC function not found:', rpcErr.message);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugLikedItemsQuery();
