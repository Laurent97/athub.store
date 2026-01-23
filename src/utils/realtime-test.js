// Copy and paste this into your browser console to test Realtime

// Test Realtime connection
async function testRealtime() {
  console.log('🧪 Testing Realtime connection...');
  
  // Get the supabase client from your app
  const { supabase } = await import('./src/lib/supabase/client.js');
  
  // Listen to order_tracking changes
  const channel = supabase
    .channel('tracking-test')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_tracking'
      },
      (payload) => {
        console.log('📦 Realtime update received:', payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tracking_updates'
      },
      (payload) => {
        console.log('🔄 Tracking update received:', payload);
      }
    )
    .subscribe((status) => {
      console.log('📡 Connection status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime is working! Try making a tracking update...');
      }
    });
  
  // Return cleanup function
  return () => supabase.removeChannel(channel);
}

// Run the test
const cleanup = testRealtime();

// To stop listening: cleanup();
