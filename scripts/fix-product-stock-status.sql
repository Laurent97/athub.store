-- Fix Product Stock Status - Update all partner products to be available
-- This fixes the "Out of Stock" issue in store pages

-- Update all partner products to be active
UPDATE partner_products 
SET 
    is_active = true,
    updated_at = NOW()
WHERE is_active = false OR is_active IS NULL;

-- Show the results
SELECT 
    'Products Updated' as result,
    COUNT(*) as updated_count,
    COUNT(CASE WHEN is_active = true OR is_active IS NULL THEN 1 ELSE 0 END) as now_active_count,
    COUNT(CASE WHEN is_active = false THEN 1 ELSE 0 END) as still_inactive_count
FROM partner_products;

-- Verify specific store (Laurent Store)
SELECT 
    'Laurent Store Products' as result,
    COUNT(*) as total_products,
    COUNT(CASE WHEN is_active = true OR is_active IS NULL THEN 1 ELSE 0 END) as active_products,
    COUNT(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive_products
FROM partner_products pp
WHERE pp.partner_id = (SELECT user_id FROM partner_profiles WHERE store_slug = 'laurent-store');
