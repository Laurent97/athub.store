-- Fix updated_at column type in partner_profiles table
-- Change from VARCHAR(9) to proper TIMESTAMP

-- First, check current column type
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'partner_profiles' 
    AND column_name = 'updated_at'
    AND table_schema = 'public';

-- Fix the column type if it's VARCHAR(9)
DO $$
BEGIN
    -- Check if column exists and is wrong type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
            AND column_name = 'updated_at'
            AND table_schema = 'public'
            AND data_type = 'character varying'
            AND character_maximum_length = 9
    ) THEN
        -- Alter the column to proper timestamp type
        ALTER TABLE partner_profiles 
        ALTER COLUMN updated_at TYPE TIMESTAMP USING NULL;
        
        RAISE NOTICE '✅ FIXED: Changed updated_at from VARCHAR(9) to TIMESTAMP';
    ELSE
        RAISE NOTICE 'ℹ️ INFO: updated_at column is already correct type or does not exist';
    END IF;
END $$;

-- Verify the fix
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'partner_profiles' 
    AND column_name = 'updated_at'
    AND table_schema = 'public';
