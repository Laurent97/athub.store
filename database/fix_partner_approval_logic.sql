-- Fix partner approval logic to properly handle is_active column
-- This ensures is_active is set correctly when partner_status changes

-- Step 1: Update all approved partners to be active
UPDATE partner_profiles 
SET 
    is_active = CASE 
        WHEN partner_status = 'approved' THEN true
        WHEN partner_status = 'suspended' THEN false
        ELSE is_active
    END,
    updated_at = NOW()
WHERE partner_status IN ('approved', 'suspended');

-- Step 2: Create a trigger to automatically sync is_active with partner_status
CREATE OR REPLACE FUNCTION sync_partner_active_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-sync is_active based on partner_status
    IF NEW.partner_status = 'approved' THEN
        NEW.is_active := true;
        NEW.approved_at := NOW();
    ELSIF NEW.partner_status = 'suspended' THEN
        NEW.is_active := false;
        NEW.inactivated_at := NOW();
    ELSIF NEW.partner_status = 'rejected' THEN
        NEW.is_active := false;
        NEW.inactivated_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger to auto-sync is_active
DROP TRIGGER IF EXISTS trigger_sync_partner_active_status ON partner_profiles;
CREATE TRIGGER trigger_sync_partner_active_status
BEFORE INSERT OR UPDATE ON partner_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_partner_active_status();

-- Step 4: Show results
SELECT 
    'Partner Approval Logic Fixed' as result,
    COUNT(*) as total_approved,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_partners
FROM partner_profiles 
WHERE partner_status = 'approved';

-- Show sample of approved partners with their is_active status
SELECT 
    'Approved Partners Status' as result,
    id,
    store_name,
    partner_status,
    is_active,
    approved_at
FROM partner_profiles 
WHERE partner_status = 'approved'
LIMIT 5;
