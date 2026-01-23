// Debug authentication and permissions
// Copy and paste this into your browser console

async function debugAuthAndPermissions() {
  console.log('🔍 Debugging authentication and permissions...');
  
  try {
    // Import supabase client
    const { supabase } = await import('./src/lib/supabase/client.js');
    
    // 1. Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 Current user:', user);
    console.log('❌ User error:', userError);
    
    if (!user) {
      console.error('❌ No authenticated user found');
      return;
    }
    
    // 2. Check user metadata
    console.log('📋 User metadata:', user.user_metadata);
    console.log('📋 Raw user metadata:', user.raw_user_meta_data);
    
    // 3. Test basic table access
    console.log('🔎 Testing order_tracking table access...');
    const { data: trackingData, error: trackingError } = await supabase
      .from('order_tracking')
      .select('count')
      .limit(1);
    
    console.log('📊 Tracking data:', trackingData);
    console.log('❌ Tracking error:', trackingError);
    
    // 4. Test insert permissions (this might fail with 403)
    console.log('🧪 Testing insert permissions...');
    const { data: insertData, error: insertError } = await supabase
      .from('order_tracking')
      .insert({
        order_id: 'TEST-123',
        tracking_number: 'TEST-TRACKING',
        status: 'shipped',
        admin_id: user.id
      })
      .select()
      .single();
    
    console.log('📝 Insert data:', insertData);
    console.log('❌ Insert error:', insertError);
    
    // 5. Clean up test data
    if (insertData) {
      await supabase
        .from('order_tracking')
        .delete()
        .eq('id', insertData.id);
      console.log('🧹 Test data cleaned up');
    }
    
  } catch (error) {
    console.error('💥 Debug script error:', error);
  }
}

// Run the debug function
debugAuthAndPermissions();
