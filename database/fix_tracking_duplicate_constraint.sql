-- Fix duplicate tracking number constraint issue
-- This script removes the unique constraint on tracking_number to allow duplicates

-- Check if the constraint exists and drop it
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

-- Verify constraint was removed
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'order_tracking' 
    AND constraint_type = 'UNIQUE';
