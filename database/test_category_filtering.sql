-- Test category filtering directly in database
-- This will help diagnose why Products page shows all products instead of filtered categories

-- Step 1: Test specific category queries
SELECT 
    '=== ENGINE PARTS CATEGORY TEST ===' as test,
    COUNT(*) as engine_parts_count,
    'Should show products with category = engine-parts' as expectation
FROM products 
WHERE is_active = true AND category = 'engine-parts';

SELECT 
    '=== SUSPENSION CATEGORY TEST ===' as test,
    COUNT(*) as suspension_count,
    'Should show products with category = suspension' as expectation
FROM products 
WHERE is_active = true AND category = 'suspension';

SELECT 
    '=== BRAKES CATEGORY TEST ===' as test,
    COUNT(*) as brakes_count,
    'Should show products with category = brakes' as expectation
FROM products 
WHERE is_active = true AND category = 'brakes';

SELECT 
    '=== VEHICLES CATEGORY TEST ===' as test,
    COUNT(*) as vehicles_count,
    'Should show products with category = vehicles' as expectation
FROM products 
WHERE is_active = true AND category = 'vehicles';

-- Step 2: Test what categories actually exist
SELECT 
    '=== ALL PRODUCT CATEGORIES ===' as analysis,
    category,
    COUNT(*) as product_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM products WHERE is_active = true), 2) as percentage
FROM products 
WHERE is_active = true
GROUP BY category
ORDER BY product_count DESC;

-- Step 3: Test if there are any case sensitivity issues
SELECT 
    '=== CASE SENSITIVITY TEST ===' as test,
    COUNT(*) as exact_match,
    'Exact match with engine-parts' as test_type
FROM products 
WHERE is_active = true AND category = 'engine-parts'
UNION ALL
SELECT 
    '=== CASE SENSITIVITY TEST ===' as test,
    COUNT(*) as case_insensitive,
    'Case insensitive match with engine-parts' as test_type
FROM products 
WHERE is_active = true AND category ILIKE 'engine-parts';

-- Step 4: Test pagination with category filter
SELECT 
    '=== PAGINATION TEST (Page 1, Limit 20) ===' as test,
    COUNT(*) OVER() as page_1_results,
    'Simulates productService.getProducts with category filter' as simulation
FROM products 
WHERE is_active = true AND category = 'suspension'
ORDER BY created_at DESC
LIMIT 20;

-- Step 5: Success message with recommendations
SELECT 
    '=== CATEGORY FILTERING TEST COMPLETE ===' as result,
    'Check results above to identify filtering issues' as next_step,
    'If counts are 0, category mapping may be wrong' as issue_1,
    'If counts are >0, frontend filtering may be broken' as issue_2,
    'If case insensitive works, use ILIKE in queries' as fix_1,
    'If exact match works, check frontend logic' as fix_2;

-- Test 5: Check if there are any RLS issues
SELECT 
    'RLS Check' as test_type,
    relname as table_name,
    relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'products';
