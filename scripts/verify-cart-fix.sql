-- Verify Cart Fix Status
-- This script checks if the cart fixes have been applied correctly

-- Check current cart items in database
SELECT 
    'Current Cart Items Check' as section,
    p.id,
    p.title,
    p.images,
    p.stock_quantity,
    p.is_active,
    pp.id as partner_product_id,
    pp.selling_price,
    pp.is_active as partner_product_active,
    pp.partner_id,
    pr.store_name,
    pp.is_active as partner_active
FROM 
    products p
LEFT JOIN partner_products pp ON p.id = pp.product_id
LEFT JOIN partner_profiles pr ON pp.partner_id = pr.user_id
WHERE 
    pp.is_active = true 
    AND p.is_active = true
LIMIT 5;

-- Check if products have proper images
SELECT 
    'Image Status Check' as section,
    COUNT(*) as total_products,
    COUNT(CASE WHEN p.images IS NOT NULL AND p.images != '{}' THEN 1 ELSE 0 END) as has_images,
    COUNT(CASE WHEN p.stock_quantity > 0 THEN 1 ELSE 0 END) as in_stock,
    COUNT(CASE WHEN pp.selling_price IS NOT NULL THEN 1 ELSE 0 END) as has_price
FROM 
    products p
LEFT JOIN partner_products pp ON p.id = pp.product_id
WHERE 
    pp.is_active = true 
    AND p.is_active = true;
