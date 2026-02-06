-- Auto-approve new partner applications
-- This script automatically approves pending partners that meet criteria

-- Update pending partners to approved status
UPDATE partner_profiles 
SET 
    partner_status = 'approved',
    is_active = true,
    approved_at = NOW(),
    updated_at = NOW()
WHERE 
    partner_status = 'pending' 
    AND is_active = false
    AND created_at >= NOW() - INTERVAL '7 days';  -- Only auto-approve partners older than 7 days

-- Show results
SELECT 
    'Auto-approved Partners' as result,
    COUNT(*) as count
FROM partner_profiles 
WHERE 
    partner_status = 'approved' 
    AND is_active = true;

-- Show recently approved partners
SELECT 
    id,
    store_name,
    store_slug,
    partner_status,
    is_active,
    approved_at,
    created_at
FROM partner_profiles 
WHERE partner_status = 'approved' 
    AND is_active = true
    AND approved_at >= NOW() - INTERVAL '1 day'
ORDER BY approved_at DESC
LIMIT 5;
