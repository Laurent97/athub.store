-- Diagnose homepage and products page issues
-- Check why homepage shows no vehicles and products page shows only 20 products

-- Step 1: Check total product count
SELECT 
    '=== TOTAL PRODUCTS ===' as analysis,
    COUNT(*) as total_products,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_products
FROM products;

-- Step 2: Check products by category
SELECT 
    '=== PRODUCTS BY CATEGORY ===' as analysis,
    category,
    COUNT(*) as product_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
    MIN(created_at) as first_added,
    MAX(created_at) as latest_added
FROM products 
GROUP BY category
ORDER BY product_count DESC;

-- Step 3: Check vehicle-specific products
SELECT 
    '=== VEHICLE PRODUCTS ===' as analysis,
    category,
    COUNT(*) as vehicle_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_vehicles,
    STRING_AGG(title, ', ' ORDER BY created_at DESC LIMIT 5) as sample_titles
FROM products 
WHERE category IN ('vehicles', 'cars', 'car', 'vehicle') AND is_active = true
GROUP BY category;

-- Step 4: Check recent products (for homepage)
SELECT 
    '=== RECENT PRODUCTS FOR HOMEPAGE ===' as analysis,
    COUNT(*) as recent_count,
    'Last 30 days' as time_period,
    MIN(created_at) as earliest_recent,
    MAX(created_at) as latest_recent
FROM products 
WHERE is_active = true 
AND created_at >= NOW() - INTERVAL '30 days';

-- Step 5: Check featured products (for homepage)
SELECT 
    '=== FEATURED PRODUCTS ===' as analysis,
    COUNT(*) as featured_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_featured
FROM products 
WHERE featured = true;

-- Step 6: Check if there are any products that should show on homepage
SELECT 
    '=== HOMEPAGE ELIGIBLE PRODUCTS ===' as analysis,
    COUNT(*) as homepage_eligible,
    COUNT(CASE WHEN category IN ('vehicles', 'cars', 'car', 'vehicle') THEN 1 END) as vehicles_for_homepage,
    COUNT(CASE WHEN featured = true THEN 1 END) as featured_for_homepage
FROM products 
WHERE is_active = true;

-- Step 7: Test pagination query (like products page)
SELECT 
    '=== PAGINATION TEST ===' as analysis,
    COUNT(*) as total_available,
    'Should be 150+ if you have that many products' as expectation
FROM products 
WHERE is_active = true;

-- Step 8: Check first 20 products (what products page shows)
SELECT 
    '=== FIRST 20 PRODUCTS ===' as analysis,
    id,
    title,
    category,
    is_active,
    featured,
    created_at,
    'This is what products page shows' as note
FROM products 
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 20;

-- Step 9: Check if there are any RLS issues
SELECT 
    '=== RLS POLICY CHECK ===' as analysis,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'products';

-- Step 10: Success message with recommendations
SELECT 
    '=== DIAGNOSIS COMPLETE ===' as result,
    'Check the results above to identify the issue' as next_step,
    'Common issues: RLS policies, is_active flag, category filtering' as common_problems,
    'Homepage may need specific query for vehicles' as homepage_tip,
    'Products page may have pagination limit' as pagination_tip;
