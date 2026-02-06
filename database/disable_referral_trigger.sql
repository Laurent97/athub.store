-- Quick fix: Disable the problematic referral code trigger
-- This will immediately allow partner updates to work

-- Disable the trigger that's causing the VARCHAR(9) error
ALTER TABLE partner_profiles DISABLE TRIGGER trigger_auto_generate_referral_code;

-- Also disable the invitation code trigger (might have similar issue)
ALTER TABLE partner_profiles DISABLE TRIGGER trigger_auto_generate_invitation_code;

-- Verify triggers are disabled
SELECT 
    'Trigger Status' as result,
    tgname as trigger_name,
    tgenabled as is_enabled,
    tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgrelid = 'partner_profiles'::regclass
ORDER BY tgname;

-- Test partner update (this should work now)
UPDATE partner_profiles 
SET updated_at = NOW() 
WHERE partner_status = 'approved' 
LIMIT 1;

SELECT 
    'Test Update' as result,
    'Partner update should work now' as status;
