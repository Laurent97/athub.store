-- Fix referral code length issue that's breaking partner updates
-- The referral_code column is VARCHAR(9) but trigger generates longer codes

-- Step 1: Drop the problematic trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_referral_code ON partner_profiles;

-- Step 2: Drop the problematic function
DROP FUNCTION IF EXISTS auto_generate_referral_code();

-- Step 3: Increase the referral_code column size
ALTER TABLE partner_profiles 
ALTER COLUMN referral_code TYPE VARCHAR(20);

-- Step 4: Create a better referral code function
CREATE OR REPLACE FUNCTION auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate a 8-character referral code
    NEW.referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Recreate the trigger
CREATE TRIGGER trigger_auto_generate_referral_code
BEFORE INSERT OR UPDATE ON partner_profiles
FOR EACH ROW
WHEN (NEW.referral_code IS NULL OR NEW.referral_code = '')
EXECUTE FUNCTION auto_generate_referral_code();

-- Step 6: Test the fix
SELECT 
    'Referral Code Fix Applied' as result,
    'referral_code column increased to VARCHAR(20)' as action;

-- Show current referral codes
SELECT 
    'Sample Referral Codes' as result,
    id,
    store_name,
    referral_code,
    LENGTH(referral_code) as code_length
FROM partner_profiles 
WHERE referral_code IS NOT NULL
LIMIT 5;
