-- Diagnostic script to check partner products data
-- This will help us understand why stores show no products

-- Step 1: Check if partner_profiles table has data
SELECT 
    'PARTNER PROFILES' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN partner_status = 'approved' AND is_active = true THEN 1 END) as approved_active,
    COUNT(CASE WHEN store_slug IS NOT NULL THEN 1 END) as with_slug
FROM partner_profiles;

-- Step 2: Check if products table has data
SELECT 
    'PRODUCTS' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
    COUNT(CASE WHEN original_price > 0 THEN 1 END) as with_price
FROM products;

-- Step 3: Check if partner_products table has data
SELECT 
    'PARTNER PRODUCTS' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
    COUNT(DISTINCT partner_id) as unique_partners,
    COUNT(DISTINCT product_id) as unique_products
FROM partner_products;

-- Step 4: Show sample partner profiles
SELECT 
    'SAMPLE PARTNER PROFILES' as info,
    id,
    user_id,
    store_name,
    store_slug,
    partner_status,
    is_active
FROM partner_profiles
WHERE partner_status = 'approved' 
    AND is_active = true
LIMIT 3;

-- Step 5: Show sample partner products with details
SELECT 
    'SAMPLE PARTNER PRODUCTS' as info,
    pp.id,
    pp.partner_id,
    pp.product_id,
    pp.selling_price,
    pp.is_active,
    pp.created_at,
    p.title as product_title,
    p.sku as product_sku,
    p.category as product_category,
    pp2.store_name as partner_store_name
FROM partner_products pp
INNER JOIN products p ON pp.product_id = p.id
INNER JOIN partner_profiles pp2 ON pp.partner_id = pp2.id
WHERE pp.is_active = true 
    AND p.is_active = true
ORDER BY pp.created_at DESC
LIMIT 5;

-- Step 6: Test the RPC function directly
SELECT 
    'RPC FUNCTION TEST' as info,
    *
FROM get_partner_products(
    (SELECT id FROM partner_profiles WHERE partner_status = 'approved' AND is_active = true LIMIT 1)
);

-- Step 7: Check for any RLS policy issues
SELECT 
    'RLS POLICIES ON PARTNER_PRODUCTS' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'partner_products';
