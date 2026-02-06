-- Approve ALL pending partners immediately
-- This will make all pending partners visible on manufacturers page

UPDATE partner_profiles 
SET 
    partner_status = 'approved',
    is_active = true,
    approved_at = NOW(),
    updated_at = NOW()
WHERE partner_status = 'pending';

-- Show results
SELECT 
    'Partners Approved' as result,
    COUNT(*) as count
FROM partner_profiles 
WHERE partner_status = 'approved' AND is_active = true;

-- Show newly approved partners
SELECT 
    'Newly Approved Partners' as result,
    id,
    store_name,
    partner_status,
    is_active,
    approved_at
FROM partner_profiles 
WHERE approved_at >= NOW() - INTERVAL '1 hour'
ORDER BY approved_at DESC;
