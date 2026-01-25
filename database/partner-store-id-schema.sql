-- Add Store ID system to existing partner_profiles table
-- This script adds the missing store_id field and related functionality

-- Add store_id column to partner_profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'store_id'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN store_id VARCHAR(20) UNIQUE;
        RAISE NOTICE 'Added store_id column to partner_profiles';
    ELSE
        RAISE NOTICE 'store_id column already exists in partner_profiles';
    END IF;
END $$;

-- Create store_id index for performance
CREATE INDEX IF NOT EXISTS idx_partner_profiles_store_id ON partner_profiles(store_id);

-- Function to generate unique store ID
CREATE OR REPLACE FUNCTION generate_store_id()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT := 'AUTO';
    timestamp_part TEXT;
    random_part TEXT;
    checksum_part TEXT;
    store_id TEXT;
    attempts INTEGER := 0;
    max_attempts INTEGER := 10;
BEGIN
    LOOP
        -- Generate timestamp part (last 8 digits of current timestamp)
        timestamp_part := TO_CHAR(EXTRACT(EPOCH FROM NOW()) * 1000::BIGINT, 'FM99999999');
        
        -- Generate random 4-digit number
        random_part := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        -- Calculate checksum
        checksum_part := MOD(
            (ASCII(prefix) + ASCII(SUBSTRING(timestamp_part, 1, 4)) + 
             ASCII(SUBSTRING(timestamp_part, 5, 4)) + ASCII(random_part)), 
            10
        )::TEXT;
        
        store_id := prefix || timestamp_part || random_part || checksum_part;
        
        -- Check if store_id already exists
        IF NOT EXISTS (SELECT 1 FROM partner_profiles WHERE store_id = store_id) THEN
            EXIT;
        END IF;
        
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique store_id after % attempts', max_attempts;
        END IF;
    END LOOP;
    
    RETURN store_id;
END;
$$ LANGUAGE plpgsql;

-- Function to validate store ID format
CREATE OR REPLACE FUNCTION validate_store_id(store_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check format: AUTO + 8 digits + 4 digits + 1 checksum (total 15 chars)
    IF store_id IS NULL OR LENGTH(store_id) != 15 THEN
        RETURN FALSE;
    END IF;
    
    -- Check if starts with AUTO
    IF LEFT(store_id, 4) != 'AUTO' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if all characters after prefix are digits
    IF SUBSTRING(store_id, 5) ~ '[^0-9]' THEN
        RETURN FALSE;
    END IF;
    
    -- Validate checksum
    DECLARE
        prefix TEXT := LEFT(store_id, 4);
        timestamp_part TEXT := SUBSTRING(store_id, 5, 8);
        random_part TEXT := SUBSTRING(store_id, 13, 4);
        checksum_part TEXT := RIGHT(store_id, 1);
        calculated_checksum TEXT;
    BEGIN
        calculated_checksum := MOD(
            (ASCII(prefix) + ASCII(SUBSTRING(timestamp_part, 1, 4)) + 
             ASCII(SUBSTRING(timestamp_part, 5, 4)) + ASCII(random_part)), 
            10
        )::TEXT;
        
        RETURN checksum_part = calculated_checksum;
    END;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate store_id for new partners
CREATE OR REPLACE FUNCTION auto_generate_store_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate store_id if it's not provided
    IF NEW.store_id IS NULL OR NEW.store_id = '' THEN
        NEW.store_id := generate_store_id();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_auto_generate_store_id ON partner_profiles;
CREATE TRIGGER trigger_auto_generate_store_id
    BEFORE INSERT ON partner_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_store_id();

-- Update existing partners without store_id
UPDATE partner_profiles 
SET store_id = generate_store_id() 
WHERE store_id IS NULL OR store_id = '';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_store_id TO authenticated;
GRANT EXECUTE ON FUNCTION generate_store_id TO service_role;
GRANT EXECUTE ON FUNCTION validate_store_id TO authenticated;
GRANT EXECUTE ON FUNCTION validate_store_id TO service_role;

DO $$
BEGIN
    RAISE NOTICE 'Store ID system setup completed successfully!';
END $$;
