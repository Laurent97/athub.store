-- Debug query to check partner products for laurent-store
-- This will help us understand why images are not showing

-- First, get the store info
SELECT 
    store_slug,
    user_id,
    store_name
    'Laurent Store' as debug_info
FROM partner_profiles 
WHERE store_slug = 'laurent-store';

-- Then check if there are any partner products
SELECT 
    pp.id as partner_product_id,
    pp.product_id,
    pp.selling_price,
    pp.is_active,
    p.id as product_id,
    p.make,
    p.model,
    p.title,
    p.images,
    p.created_at
FROM partner_products pp
LEFT JOIN products p ON pp.product_id = p.id
WHERE pp.partner_id = (SELECT user_id FROM partner_profiles WHERE store_slug = 'laurent-store')
AND pp.is_active = true
AND p.is_active = true;

-- Show the results
SELECT 
    'Partner Products Found' as result,
    COUNT(*) as partner_product_count,
    COUNT(p.id) as product_count
FROM partner_products pp
LEFT JOIN products p ON pp.product_id = p.id
WHERE pp.partner_id = (SELECT user_id FROM partner_profiles WHERE store_slug = 'laurent-store')
AND pp.is_active = true
AND p.is_active = true;
