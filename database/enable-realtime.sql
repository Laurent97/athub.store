-- Enable Realtime for tracking tables
-- Run this in your Supabase SQL Editor after the main schema

-- Drop existing publications if they exist (for clean setup)
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create new publication for realtime
CREATE PUBLICATION supabase_realtime;

-- Add tracking tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE order_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE tracking_updates;

-- Verify the publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Optional: Grant necessary permissions
GRANT SELECT ON order_tracking TO authenticated;
GRANT SELECT ON tracking_updates TO authenticated;
GRANT SELECT ON order_tracking TO anon;
GRANT SELECT ON tracking_updates TO anon;
