// Test utility to verify Realtime is working
// Run this in your browser console or as a temporary component

import { supabase } from '../lib/supabase/client';
import { TrackingService } from '../lib/supabase/tracking-service';

export async function testRealtimeConnection() {
  console.log('🧪 Testing Supabase Realtime connection...');

  try {
    // Test 1: Basic connection
    const channel = supabase.channel('test-connection');
    
    channel
      .on('system', {}, (payload) => {
        console.log('✅ System event received:', payload);
      })
      .subscribe((status) => {
        console.log('📡 Connection status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connection successful!');
          supabase.removeChannel(channel);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime connection failed');
        }
      });

    // Test 2: Tracking table subscription
    console.log('🔄 Testing tracking table subscription...');
    
    const trackingChannel = TrackingService.subscribeToTracking(
      'test-tracking-id',
      (payload) => {
        console.log('📦 Tracking update received:', payload);
      }
    );

    // Clean up after 10 seconds
    setTimeout(() => {
      TrackingService.unsubscribeFromTracking(trackingChannel);
      console.log('🧹 Test completed');
    }, 10000);

  } catch (error) {
    console.error('❌ Realtime test failed:', error);
  }
}

// Usage in browser console:
// import('./src/utils/test-realtime.js').then(module => module.testRealtimeConnection());
