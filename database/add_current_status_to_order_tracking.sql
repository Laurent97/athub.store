-- Add missing current_status column to order_tracking table
-- This column is needed for the logistics tracking functionality

-- Add current_status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_tracking' AND column_name = 'current_status'
    ) THEN
        ALTER TABLE order_tracking ADD COLUMN current_status VARCHAR(50);
    END IF;
END $$;

-- Add updated_at column if it doesn't exist (for tracking when status was last updated)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_tracking' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE order_tracking ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Verify the columns were added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'order_tracking' 
    AND column_name IN ('current_status', 'updated_at')
ORDER BY column_name;
