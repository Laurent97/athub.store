-- Check existing partner slugs and their IDs
-- This will help us understand the correct store URLs

SELECT 
    'EXISTING PARTNER STORES' as info,
    id,
    user_id,
    store_name,
    store_slug,
    partner_status,
    is_active,
    CONCAT('https://www.athub.store/store/', store_slug) as store_url
FROM partner_profiles 
WHERE partner_status = 'approved' 
    AND is_active = true
    AND store_slug IS NOT NULL
ORDER BY store_name;
