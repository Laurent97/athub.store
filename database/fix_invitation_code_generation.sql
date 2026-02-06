-- Fix invitation code generation after partner approval
-- This will properly generate invitation codes without VARCHAR(9) errors

-- Step 1: Check current invitation code column size
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'partner_profiles' 
    AND column_name = 'invitation_code'
    AND table_schema = 'public';

-- Step 2: Increase invitation_code column size if needed
ALTER TABLE partner_profiles 
ALTER COLUMN invitation_code TYPE VARCHAR(20);

-- Step 3: Create a better invitation code function
CREATE OR REPLACE FUNCTION auto_generate_invitation_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code TEXT;
    attempts INTEGER := 0;
    max_attempts INTEGER := 10;
BEGIN
    -- Generate a unique 8-character invitation code
    WHILE attempts < max_attempts LOOP
        new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NEW.id::TEXT), 1, 8));
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM partner_profiles WHERE invitation_code = new_code AND id != NEW.id) THEN
            NEW.invitation_code := new_code;
            RETURN NEW;
        END IF;
        
        attempts := attempts + 1;
    END LOOP;
    
    -- Fallback to timestamp-based code if random fails
    NEW.invitation_code := UPPER(SUBSTRING(MD5(NEW.id::TEXT || NOW()::TEXT), 1, 8));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Re-enable the invitation code trigger with proper conditions
DROP TRIGGER IF EXISTS trigger_auto_generate_invitation_code ON partner_profiles;
CREATE TRIGGER trigger_auto_generate_invitation_code
BEFORE INSERT OR UPDATE ON partner_profiles
FOR EACH ROW
WHEN (
    (NEW.invitation_code IS NULL OR NEW.invitation_code = '') 
    AND NEW.partner_status = 'approved'
)
EXECUTE FUNCTION auto_generate_invitation_code();

-- Step 5: Generate invitation codes for existing approved partners
UPDATE partner_profiles 
SET 
    invitation_code = UPPER(SUBSTRING(MD5(id::TEXT || NOW()::TEXT), 1, 8)),
    updated_at = NOW()
WHERE 
    partner_status = 'approved' 
    AND (invitation_code IS NULL OR invitation_code = '');

-- Step 6: Show results
SELECT 
    'Invitation Code Generation Fixed' as result,
    COUNT(*) as approved_partners_with_codes
FROM partner_profiles 
WHERE 
    partner_status = 'approved' 
    AND invitation_code IS NOT NULL;

-- Show sample of approved partners with their invitation codes
SELECT 
    'Sample Approved Partners with Codes' as result,
    id,
    store_name,
    partner_status,
    invitation_code,
    LENGTH(invitation_code) as code_length
FROM partner_profiles 
WHERE 
    partner_status = 'approved' 
    AND invitation_code IS NOT NULL
LIMIT 5;
