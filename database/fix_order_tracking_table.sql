-- Check and fix order_tracking table structure
-- This script ensures the order_tracking table has the correct structure and constraints

-- First, let's see the current structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'order_tracking' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any constraints or indexes
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'order_tracking'
  AND tc.table_schema = 'public';

-- Check for any existing data
SELECT 
  id,
  order_id,
  tracking_number,
  status,
  created_at
FROM order_tracking 
LIMIT 5;

-- Fix the table structure if needed
-- Make sure order_id is properly indexed for the upsert
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON order_tracking(order_id);

-- Ensure the table has the correct columns
DO $$
BEGIN
    -- Check if admin_id column exists, add if not
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_tracking' AND column_name = 'admin_id'
    ) THEN
        ALTER TABLE order_tracking ADD COLUMN admin_id UUID;
    END IF;

    -- Check if partner_id column exists, add if not
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_tracking' AND column_name = 'partner_id'
    ) THEN
        ALTER TABLE order_tracking ADD COLUMN partner_id UUID;
    END IF;

    -- Check if estimated_delivery column exists, add if not
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_tracking' AND column_name = 'estimated_delivery'
    ) THEN
        ALTER TABLE order_tracking ADD COLUMN estimated_delivery TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Check if actual_delivery column exists, add if not
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_tracking' AND column_name = 'actual_delivery'
    ) THEN
        ALTER TABLE order_tracking ADD COLUMN actual_delivery TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Check if shipping_method column exists, add if not
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_tracking' AND column_name = 'shipping_method'
    ) THEN
        ALTER TABLE order_tracking ADD COLUMN shipping_method VARCHAR(100);
    END IF;

    -- Check if carrier column exists, add if not
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_tracking' AND column_name = 'carrier'
    ) THEN
        ALTER TABLE order_tracking ADD COLUMN carrier VARCHAR(100);
    END IF;
END $$;

-- Make sure the order_id column can handle the data type
-- If order_id is currently UUID but we're storing order_number (text), we need to fix this
DO $$
BEGIN
    -- Check if order_id is UUID type but we're trying to store text
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_tracking' 
          AND column_name = 'order_id' 
          AND data_type = 'uuid'
    ) THEN
        -- We need to change the column type to text to store order_number
        ALTER TABLE order_tracking ALTER COLUMN order_id TYPE VARCHAR(255);
    END IF;
END $$;

-- Create a unique constraint on order_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'order_tracking' 
          AND constraint_type = 'UNIQUE'
          AND constraint_name = 'order_tracking_order_id_key'
    ) THEN
        ALTER TABLE order_tracking ADD CONSTRAINT order_tracking_order_id_key UNIQUE (order_id);
    END IF;
END $$;

-- Final verification
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'order_tracking' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
