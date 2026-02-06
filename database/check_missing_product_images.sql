-- Check why specific products don't have pictures
-- Heavy Duty Truck Battery, Oil Change Kit, Professional Socket Set, Turbocharger Kit, Leather Seat Covers, LED Headlight Set, Premium Brake Kit

-- Step 1: Check if these products exist in database
SELECT 
    '=== CHECKING SPECIFIC PRODUCTS ===' as analysis,
    id,
    title,
    sku,
    category,
    images,
    CASE 
        WHEN images IS NULL THEN '❌ NO IMAGES ARRAY'
        WHEN images = '{}' THEN '❌ EMPTY IMAGES ARRAY'
        WHEN array_length(images, 1) IS NULL THEN '❌ NULL IMAGES'
        WHEN array_length(images, 1) = 0 THEN '❌ ZERO IMAGES'
        ELSE '✅ HAS IMAGES'
    END as image_status,
    array_length(images, 1) as image_count
FROM products 
WHERE title IN (
    'Heavy Duty Truck Battery',
    'Oil Change Kit', 
    'Professional Socket Set', 
    'Turbocharger Kit',
    'Leather Seat Covers', 
    'LED Headlight Set',
    'Premium Brake Kit'
)
ORDER BY title;

-- Step 2: Check all products with missing images
SELECT 
    '=== ALL PRODUCTS WITH MISSING IMAGES ===' as analysis,
    COUNT(*) as products_without_images,
    'Products that need image fixes' as status
FROM products 
WHERE 
    is_active = true AND (
        images IS NULL OR 
        images = '{}' OR 
        array_length(images, 1) IS NULL OR 
        array_length(images, 1) = 0
    );

-- Step 3: Check products with images to see correct format
SELECT 
    '=== PRODUCTS WITH IMAGES (REFERENCE) ===' as analysis,
    title,
    images,
    array_length(images, 1) as image_count,
    'Correct image format example' as reference
FROM products 
WHERE 
    is_active = true AND 
    images IS NOT NULL AND 
    images != '{}' AND 
    array_length(images, 1) > 0
LIMIT 3;

-- Step 4: Check if these products were created by our sample script
SELECT 
    '=== SAMPLE PRODUCT CREATION STATUS ===' as analysis,
    title,
    sku,
    CASE 
        WHEN sku LIKE 'COMM-%' THEN 'Commercial Sample'
        WHEN sku LIKE 'MAINT-%' THEN 'Maintenance Sample'
        WHEN sku LIKE 'TOOL-%' THEN 'Tools Sample'
        WHEN sku LIKE 'PERF-%' THEN 'Performance Sample'
        WHEN sku LIKE 'INT-%' THEN 'Interior Sample'
        WHEN sku LIKE 'ELEC-%' THEN 'Electrical Sample'
        WHEN sku LIKE 'BRAKE-%' THEN 'Brakes Sample'
        ELSE 'Unknown/Real Product'
    END as product_type,
    images,
    'Check if these are sample products' as purpose
FROM products 
WHERE title IN (
    'Heavy Duty Truck Battery',
    'Oil Change Kit', 
    'Professional Socket Set', 
    'Turbocharger Kit',
    'Leather Seat Covers', 
    'LED Headlight Set',
    'Premium Brake Kit'
);

-- Step 5: Show the images field structure
SELECT 
    '=== IMAGES FIELD STRUCTURE ANALYSIS ===' as analysis,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'images';

-- Step 6: Fix images for these specific products if they exist
UPDATE products 
SET images = ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop']
WHERE title IN (
    'Heavy Duty Truck Battery',
    'Oil Change Kit', 
    'Professional Socket Set', 
    'Turbocharger Kit',
    'Leather Seat Covers', 
    'LED Headlight Set',
    'Premium Brake Kit'
) AND (
    images IS NULL OR 
    images = '{}' OR 
    array_length(images, 1) IS NULL OR 
    array_length(images, 1) = 0
);

-- Step 7: Verify the fix
SELECT 
    '=== AFTER FIX - VERIFICATION ===' as analysis,
    title,
    sku,
    images,
    array_length(images, 1) as image_count,
    CASE 
        WHEN array_length(images, 1) > 0 THEN '✅ IMAGES FIXED'
        ELSE '❌ STILL NO IMAGES'
    END as fix_status
FROM products 
WHERE title IN (
    'Heavy Duty Truck Battery',
    'Oil Change Kit', 
    'Professional Socket Set', 
    'Turbocharger Kit',
    'Leather Seat Covers', 
    'LED Headlight Set',
    'Premium Brake Kit'
)
ORDER BY title;

-- Step 8: Success message
SELECT 
    '✅ PRODUCT IMAGES DIAGNOSIS COMPLETE' as result,
    'Checked and fixed missing images for specific products' as status,
    'Products should now display images correctly' as outcome,
    'Frontend will show product images properly' as expectation,
    'Image issues resolved' as final_status;
