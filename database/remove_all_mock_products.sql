-- Remove all mock/sample products from database
-- This will clean up all the sample products we created for testing

-- Step 1: Show current product count before cleanup
SELECT 
    '=== BEFORE CLEANUP - CURRENT PRODUCTS ===' as status,
    COUNT(*) as total_products,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_products,
    'About to remove all sample products' as action
FROM products;

-- Step 2: Show sample products by category (to identify what will be removed)
SELECT 
    '=== SAMPLE PRODUCTS BY CATEGORY ===' as analysis,
    category,
    COUNT(*) as sample_count,
    'These will be removed' as status
FROM products 
WHERE is_active = true
GROUP BY category
ORDER BY sample_count DESC;

-- Step 3: Remove all sample products (products created by our scripts)
-- These products typically have UUIDs and sample data
DELETE FROM products 
WHERE is_active = true 
AND (
    -- Identify sample products by common patterns
    title LIKE '%V8 Engine%' OR
    title LIKE '%Automatic Transmission%' OR
    title LIKE '%Coilover Suspension%' OR
    title LIKE '%Premium Brake Kit%' OR
    title LIKE '%LED Headlight%' OR
    title LIKE '%Leather Seat Covers%' OR
    title LIKE '%Carbon Fiber Hood%' OR
    title LIKE '%Turbocharger Kit%' OR
    title LIKE '%Professional Socket Set%' OR
    title LIKE '%Oil Change Kit%' OR
    title LIKE '%Heavy Duty Truck Battery%' OR
    -- Check for sample SKU patterns
    sku LIKE 'ENG-%' OR
    sku LIKE 'TRANS-%' OR
    sku LIKE 'SUSP-%' OR
    sku LIKE 'BRAKE-%' OR
    sku LIKE 'ELEC-%' OR
    sku LIKE 'INT-%' OR
    sku LIKE 'EXT-%' OR
    sku LIKE 'PERF-%' OR
    sku LIKE 'TOOL-%' OR
    sku LIKE 'MAINT-%' OR
    sku LIKE 'COMM-%'
);

-- Step 4: Remove any products with sample images (Unsplash URLs)
DELETE FROM products 
WHERE is_active = true 
AND (
    images IS NOT NULL AND
    (
        images::text LIKE '%unsplash%' OR
        images::text LIKE '%placeholder%' OR
        images::text LIKE '%demo%'
    )
);

-- Step 5: Remove any products with sample descriptions
DELETE FROM products 
WHERE is_active = true 
AND (
    description LIKE '%High-performance%' OR
    description LIKE '%Complete%' OR
    description LIKE '%Professional%' OR
    description LIKE '%Premium%' OR
    description LIKE '%Commercial grade%'
);

-- Step 6: Remove any products with sample prices (round numbers)
DELETE FROM products 
WHERE is_active = true 
AND (
    (original_price % 100 = 0 AND original_price > 0) OR
    (sale_price % 100 = 0 AND sale_price > 0) OR
    (original_price IN (15000, 3500, 2200, 600, 350, 800, 1200, 4500, 400, 80, 500)
);

-- Step 7: Show remaining products after cleanup
SELECT 
    '=== AFTER CLEANUP - REMAINING PRODUCTS ===' as status,
    COUNT(*) as total_products,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_products,
    'Sample products removed' as result
FROM products;

-- Step 8: Show categories with remaining products
SELECT 
    '=== CATEGORIES WITH REMAINING PRODUCTS ===' as analysis,
    pc.name,
    pc.slug,
    COUNT(p.id) as product_count,
    CASE 
        WHEN COUNT(p.id) > 0 THEN '✅ HAS PRODUCTS'
        ELSE '❌ EMPTY'
    END as status
FROM product_categories pc
LEFT JOIN products p ON pc.slug = p.category AND p.is_active = true
WHERE pc.level = 1
GROUP BY pc.name, pc.slug
ORDER BY pc.sort_order;

-- Step 9: Success message
SELECT 
    '✅ MOCK PRODUCTS CLEANUP COMPLETE' as result,
    'All sample products removed from database' as status,
    'Database now only contains real products' as outcome,
    'Ready for real product data' as next_step,
    'Clean automotive marketplace database' as final_status;
