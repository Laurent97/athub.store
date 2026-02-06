-- Fix pagination and product count issues
-- Diagnose why products page shows only 20 products when there are 150+

-- Step 1: Check total active products
SELECT 
    '=== TOTAL ACTIVE PRODUCTS ===' as analysis,
    COUNT(*) as total_active_products,
    'Should be 150+ if user uploaded that many' as expectation
FROM products 
WHERE is_active = true;

-- Step 2: Check if productService.getProducts is working correctly
SELECT 
    '=== SIMULATED PAGINATION QUERY ===' as analysis,
    COUNT(*) as page_1_products,
    'This simulates productService.getProducts(page=1, limit=20)' as query_type
FROM products 
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 20;

-- Step 3: Check page 2 (if it exists)
SELECT 
    '=== PAGE 2 SIMULATION ===' as analysis,
    COUNT(*) as page_2_products,
    'This simulates productService.getProducts(page=2, limit=20)' as query_type
FROM products 
WHERE is_active = true
ORDER BY created_at DESC
OFFSET 20
LIMIT 20;

-- Step 4: Check if there are any RLS issues affecting counts
SELECT 
    '=== RLS POLICY IMPACT ===' as analysis,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    'RLS policies may limit what frontend can see' as impact
FROM pg_policies 
WHERE tablename = 'products';

-- Step 5: Check product creation dates to see if they're recent
SELECT 
    '=== PRODUCT CREATION DATES ===' as analysis,
    COUNT(*) as total_count,
    MIN(created_at) as oldest_product,
    MAX(created_at) as newest_product,
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/86400) as avg_age_days
FROM products 
WHERE is_active = true;

-- Step 6: Check for any data quality issues
SELECT 
    '=== DATA QUALITY CHECK ===' as analysis,
    COUNT(*) as products_with_nulls,
    'Products with missing required fields' as issue_type
FROM products 
WHERE is_active = true 
AND (title IS NULL OR title = '' OR category IS NULL OR category = '');

-- Step 7: Test specific category counts
SELECT 
    '=== CATEGORY BREAKDOWN ===' as analysis,
    category,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM products WHERE is_active = true), 2) as percentage
FROM products 
WHERE is_active = true
GROUP BY category
ORDER BY count DESC;

-- Step 8: Success message with recommendations
SELECT 
    '=== DIAGNOSIS COMPLETE ===' as result,
    'Check results above to identify pagination issues' as next_step,
    'Common fixes: Increase limit, fix RLS, check is_active flags' as recommendations,
    'Frontend may need pagination adjustment' as frontend_tip,
    'Database may need product count verification' as database_tip;
