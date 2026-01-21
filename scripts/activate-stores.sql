-- Activate Partner Stores - Set is_active to true for approved stores
-- This fixes stores that exist but are marked as inactive

-- Update Laurent store to be active
UPDATE partner_profiles 
SET 
    is_active = true,
    updated_at = NOW()
WHERE store_slug = 'laurent-store' AND partner_status = 'approved';

-- Show the updated store
SELECT 
    'Activated Laurent store' as result,
    store_slug,
    store_name,
    is_active,
    partner_status,
    user_id
FROM partner_profiles 
WHERE store_slug = 'laurent-store';

-- Show all active approved stores
SELECT 
    'All active stores' as result,
    COUNT(*) as count,
    'partner_profiles' as table_name
FROM partner_profiles 
WHERE is_active = true AND partner_status = 'approved';
