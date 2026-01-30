-- Fix duplicate order_id constraint issue
-- This script removes the unique constraint on order_id to allow updates

-- Check if the constraint exists and drop it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'order_tracking' 
        AND constraint_name = 'order_tracking_order_id_key'
    ) THEN
        ALTER TABLE order_tracking DROP CONSTRAINT order_tracking_order_id_key;
        RAISE NOTICE 'Dropped constraint: order_tracking_order_id_key';
    END IF;
END $$;

-- Also drop tracking_number constraint if it still exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'order_tracking' 
        AND constraint_name = 'order_tracking_tracking_number_key'
    ) THEN
        ALTER TABLE order_tracking DROP CONSTRAINT order_tracking_tracking_number_key;
        RAISE NOTICE 'Dropped constraint: order_tracking_tracking_number_key';
    END IF;
END $$;

-- Verify constraints were removed
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'order_tracking' 
    AND constraint_type = 'UNIQUE';
