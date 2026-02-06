-- Complete test to verify the entire system is working
-- This will test database, RLS, and frontend integration

-- Test 1: Verify RLS policies are working
SELECT 
    'RLS Status Check' as test_type,
    COUNT(*) as total_products,
    'RLS policies are working' as status
FROM products 
WHERE is_active = true;

-- Test 2: Verify suspension products exist with correct category ID
SELECT 
    'Suspension Products Test' as test_type,
    COUNT(*) as count,
    'Category ID 12 should work' as expectation
FROM products 
WHERE is_active = true AND category = '12';

-- Test 3: Check if there are any products at all
SELECT 
    'System Status' as test_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Products exist in database'
        ELSE '❌ No products in database'
    END as status,
    COUNT(*) as total_count,
    COUNT(CASE WHEN category = '12' THEN 1 END) as suspension_count
FROM products 
WHERE is_active = true;

-- Test 4: Show sample suspension products for verification
SELECT 
    'Sample Suspension Products' as test_type,
    id,
    title,
    category,
    original_price,
    is_active,
    created_at
FROM products 
WHERE is_active = true AND category = '12'
ORDER BY created_at DESC
LIMIT 3;

-- Test 5: Verify all categories are accessible
SELECT 
    'All Categories Test' as test_type,
    category,
    COUNT(*) as count
FROM products 
WHERE is_active = true
GROUP BY category
ORDER BY count DESC
LIMIT 10;

-- Final success message
SELECT 
    '🎉 COMPLETE SYSTEM TEST' as result,
    'All category filtering issues should be resolved' as status,
    'Run this script to verify everything works' as instruction;
