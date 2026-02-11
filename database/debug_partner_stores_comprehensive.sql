-- Comprehensive debug for partner store products
-- This will help us understand exactly what's happening

-- Step 1: Check all partner profiles with their slugs
SELECT 
    'ALL PARTNER PROFILES' as debug_step,
    id,
    user_id,
    store_name,
    store_slug,
    partner_status,
    is_active,
    created_at
FROM partner_profiles 
ORDER BY created_at DESC;

-- Step 2: Check all partner products
SELECT 
    'ALL PARTNER PRODUCTS' as debug_step,
    pp.id,
    pp.partner_id,
    pp.product_id,
    pp.selling_price,
    pp.is_active,
    pp.created_at,
    p.title as product_title,
    p.sku as product_sku,
    p.category as product_category,
    pp2.store_name as partner_store_name,
    pp2.store_slug as partner_store_slug
FROM partner_products pp
INNER JOIN products p ON pp.product_id = p.id
INNER JOIN partner_profiles pp2 ON pp.partner_id = pp2.id
ORDER BY pp.created_at DESC
LIMIT 20;

-- Step 3: Test the RPC function with each partner ID
SELECT 
    'TESTING RPC FUNCTION' as debug_step,
    pp.id as partner_id,
    pp.store_name,
    pp.store_slug,
    rpc_result.product_count,
    rpc_result.error_message
FROM partner_profiles pp
LEFT JOIN (
    SELECT 
        partner_id,
        COUNT(*) as product_count,
        NULL as error_message
    FROM get_partner_products(pp.id)
    GROUP BY partner_id
) rpc_result ON pp.id = rpc_result.partner_id
WHERE pp.partner_status = 'approved' 
    AND pp.is_active = true
ORDER BY pp.store_name;

-- Step 4: Check specific common store slugs
SELECT 
    'SLUG CHECK' as debug_step,
    store_slug,
    COUNT(*) as partners_with_slug
FROM partner_profiles 
WHERE store_slug IN ('laurent-store', 'ev-cars-hub', 'gmotors', 'autorwa')
    AND partner_status = 'approved' 
    AND is_active = true
GROUP BY store_slug;
