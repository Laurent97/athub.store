// Setup script for enabling Supabase Realtime
// Run with: node scripts/setup-realtime.js

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function enableRealtime() {
  try {
    console.log('🔄 Enabling Realtime for tracking tables...');

    // Enable realtime for order_tracking table
    const { error: orderTrackingError } = await supabase
      .from('order_tracking')
      .on('*', () => {})
      .subscribe();

    if (orderTrackingError) {
      console.error('❌ Error enabling realtime for order_tracking:', orderTrackingError);
    } else {
      console.log('✅ Realtime enabled for order_tracking');
    }

    // Enable realtime for tracking_updates table
    const { error: trackingUpdatesError } = await supabase
      .from('tracking_updates')
      .on('*', () => {})
      .subscribe();

    if (trackingUpdatesError) {
      console.error('❌ Error enabling realtime for tracking_updates:', trackingUpdatesError);
    } else {
      console.log('✅ Realtime enabled for tracking_updates');
    }

    console.log('🎉 Realtime setup complete!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

enableRealtime();
