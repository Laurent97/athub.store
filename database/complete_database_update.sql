-- COMPLETE DATABASE UPDATE SCRIPT
-- This script updates the database to support the comprehensive logistics tracking system

-- ====================================================================
-- 1. UPDATE ORDERS TABLE CONSTRAINT TO SUPPORT ALL STATUSES
-- ====================================================================

-- First, check the current constraint
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.orders'::regclass
  AND conname = 'orders_status_check';

-- Drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the comprehensive constraint with ALL logistics statuses
ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (
  status = ANY (
    array[
      -- Basic order statuses
      'pending'::text,
      'waiting_confirmation'::text,
      'confirmed'::text,
      'processing'::text,
      'shipped'::text,
      'in_transit'::text,
      'out_for_delivery'::text,
      'delivered'::text,
      'completed'::text,
      'cancelled'::text,
      
      -- Pre-shipment statuses
      'order_received'::text,
      'payment_authorized'::text,
      'order_verified'::text,
      'inventory_allocated'::text,
      'order_processing'::text,
      'picking_started'::text,
      'picking_completed'::text,
      'packing_started'::text,
      'packing_completed'::text,
      'ready_to_ship'::text,
      
      -- Shipping statuses
      'carrier_pickup_scheduled'::text,
      'picked_up'::text,
      'arrived_at_origin'::text,
      'departed_origin'::text,
      'arrived_at_sort'::text,
      'processed_at_sort'::text,
      'departed_sort'::text,
      'arrived_at_destination'::text,
      
      -- Delivery statuses
      'delivery_attempted'::text,
      
      -- Exception statuses
      'delayed'::text,
      'weather_delay'::text,
      'mechanical_delay'::text,
      'address_issue'::text,
      'customer_unavailable'::text,
      'security_delay'::text,
      'customs_hold'::text,
      'damaged'::text,
      'lost'::text
    ]
  )
);

-- Verify the new constraint was added
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.orders'::regclass
  AND conname = 'orders_status_check';

-- ====================================================================
-- 2. UPDATE ORDER_TRACKING TABLE WITH UNIQUE CONSTRAINT
-- ====================================================================

-- First, check if there are any duplicate order_id values
SELECT 
    order_id, 
    COUNT(*) as duplicate_count
FROM order_tracking 
WHERE order_id IS NOT NULL
GROUP BY order_id 
HAVING COUNT(*) > 1;

-- If there are duplicates, we need to handle them first
DO $$
BEGIN
    -- Check if there are any duplicates first
    IF EXISTS (
        SELECT 1 FROM (
            SELECT order_id, COUNT(*) as cnt
            FROM order_tracking 
            WHERE order_id IS NOT NULL
            GROUP BY order_id 
            HAVING COUNT(*) > 1
        ) duplicates
    ) THEN
        -- Delete duplicates, keeping the most recent one
        DELETE FROM order_tracking 
        WHERE id NOT IN (
            SELECT DISTINCT ON (order_id) id
            FROM order_tracking 
            WHERE order_id IS NOT NULL
            ORDER BY order_id, created_at DESC
        );
        
        RAISE NOTICE 'Duplicate order_id records removed';
    END IF;
END $$;

-- Add unique constraint to order_id column in order_tracking table
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'order_tracking' 
          AND constraint_name = 'order_tracking_order_id_unique'
          AND constraint_type = 'UNIQUE'
    ) THEN
        -- Add the unique constraint
        ALTER TABLE order_tracking 
        ADD CONSTRAINT order_tracking_order_id_unique UNIQUE (order_id);
        
        RAISE NOTICE 'Unique constraint added to order_id column';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on order_id column';
    END IF;
END $$;

-- Verify the constraint was added
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'order_tracking'
  AND tc.constraint_name = 'order_tracking_order_id_unique';

-- ====================================================================
-- 3. ENSURE TRACKING_UPDATES TABLE EXISTS AND HAS PROPER STRUCTURE
-- ====================================================================

-- Create tracking_updates table if it doesn't exist
CREATE TABLE IF NOT EXISTS tracking_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tracking_id UUID NOT NULL REFERENCES order_tracking(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    description TEXT,
    location TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tracking_updates_tracking_id ON tracking_updates(tracking_id);
CREATE INDEX IF NOT EXISTS idx_tracking_updates_timestamp ON tracking_updates(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_updates_status ON tracking_updates(status);

-- ====================================================================
-- 4. UPDATE ORDER_TRACKING TABLE TO INCLUDE CURRENT_STATUS
-- ====================================================================

-- Add current_status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_tracking' 
          AND column_name = 'current_status'
    ) THEN
        ALTER TABLE order_tracking 
        ADD COLUMN current_status TEXT;
        
        RAISE NOTICE 'Added current_status column to order_tracking';
    END IF;
END $$;

-- ====================================================================
-- 5. VERIFY TABLE STRUCTURES
-- ====================================================================

-- Check orders table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('status', 'shipping_status', 'tracking_number', 'carrier')
ORDER BY column_name;

-- Check order_tracking table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'order_tracking' 
ORDER BY column_name;

-- Check tracking_updates table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tracking_updates' 
ORDER BY column_name;

-- ====================================================================
-- 6. SAMPLE DATA VERIFICATION
-- ====================================================================

-- Check current status distribution in orders table
SELECT 
  status,
  COUNT(*) as count,
  CASE 
    WHEN status IN ('pending', 'waiting_confirmation', 'confirmed', 'processing') THEN 'Pre-Shipment'
    WHEN status IN ('shipped', 'in_transit', 'out_for_delivery') THEN 'In Transit'
    WHEN status IN ('delivered', 'completed') THEN 'Completed'
    WHEN status = 'cancelled' THEN 'Cancelled'
    WHEN status IN ('delayed', 'weather_delay', 'mechanical_delay', 'security_delay', 'customs_hold', 'damaged', 'lost') THEN 'Exception'
    ELSE 'Other'
  END as category
FROM orders 
GROUP BY status, 
  CASE 
    WHEN status IN ('pending', 'waiting_confirmation', 'confirmed', 'processing') THEN 'Pre-Shipment'
    WHEN status IN ('shipped', 'in_transit', 'out_for_delivery') THEN 'In Transit'
    WHEN status IN ('delivered', 'completed') THEN 'Completed'
    WHEN status = 'cancelled' THEN 'Cancelled'
    WHEN status IN ('delayed', 'weather_delay', 'mechanical_delay', 'security_delay', 'customs_hold', 'damaged', 'lost') THEN 'Exception'
    ELSE 'Other'
  END
ORDER BY category, status;

-- Check order_tracking records
SELECT 
  COUNT(*) as total_tracking_records,
  COUNT(DISTINCT order_id) as unique_orders,
  COUNT(CASE WHEN current_status IS NOT NULL THEN 1 END) as records_with_current_status
FROM order_tracking;

-- Check tracking_updates records
SELECT 
  COUNT(*) as total_updates,
  COUNT(DISTINCT tracking_id) as unique_tracking_records
FROM tracking_updates;

-- ====================================================================
-- 7. CLEANUP FUNCTIONS
-- ====================================================================

-- Function to clean up old tracking updates (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_tracking_updates()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM tracking_updates 
    WHERE timestamp < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- COMPLETION MESSAGE
-- ====================================================================

DO $$
BEGIN
    RAISE NOTICE '===================================================================';
    RAISE NOTICE 'DATABASE UPDATE COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '===================================================================';
    RAISE NOTICE '✅ Orders table constraint updated with 30+ statuses';
    RAISE NOTICE '✅ Order tracking unique constraint added';
    RAISE NOTICE '✅ Tracking updates table verified';
    RAISE NOTICE '✅ Current status column added to order_tracking';
    RAISE NOTICE '✅ Indexes created for better performance';
    RAISE NOTICE '✅ Cleanup function created';
    RAISE NOTICE '===================================================================';
    RAISE NOTICE 'The logistics tracking system is now ready!';
    RAISE NOTICE '===================================================================';
END $$;
