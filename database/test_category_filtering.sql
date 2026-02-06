-- Test category filtering to ensure it works properly
-- This will help verify the frontend-backend connection

-- Test 1: Simple category query
SELECT 
    'Direct Category Test' as test_type,
    category,
    COUNT(*) as count
FROM products
WHERE is_active = true AND category = 'suspension';

-- Test 2: Check if products table exists and has data
SELECT 
    'Table Status' as test_type,
    'products' as table_name,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_rows
FROM products;

-- Test 3: Check all categories that should work
SELECT 
    'Category Coverage Test' as test_type,
    category,
    COUNT(*) as count,
    MIN(created_at) as earliest_product,
    MAX(created_at) as latest_product
FROM products
WHERE is_active = true
GROUP BY category
ORDER BY count DESC;

-- Test 4: Verify suspension specifically
SELECT 
    'Suspension Deep Dive' as test_type,
    id,
    title,
    category,
    original_price,
    is_active,
    created_at
FROM products
WHERE is_active = true AND category = 'suspension'
ORDER BY created_at DESC
LIMIT 5;

-- Test 5: Check if there are any RLS issues
SELECT 
    'RLS Check' as test_type,
    relname as table_name,
    relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'products';
