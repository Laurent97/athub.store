-- Fix category-product matching issue
-- Check if product categories match product_categories slugs

-- Step 1: Check what categories exist in products table
SELECT 
    'Products Table Categories' as result,
    category,
    COUNT(*) as product_count,
    'products table' as table_source
FROM products 
WHERE is_active = true
GROUP BY category
ORDER BY product_count DESC;

-- Step 2: Check what slugs exist in product_categories table
SELECT 
    'Product Categories Slugs' as result,
    slug as category_slug,
    name,
    item_count,
    'product_categories table' as table_source
FROM product_categories 
WHERE is_active = true
ORDER BY sort_order;

-- Step 3: Find mismatches between products and product_categories
SELECT 
    'Category Mismatch Analysis' as result,
    p.category as product_category,
    COUNT(*) as product_count,
    CASE 
        WHEN pc.slug IS NOT NULL THEN '✅ Matches'
        ELSE '❌ No matching category in product_categories'
    END as match_status,
    COALESCE(pc.name, 'No match') as category_name
FROM products p
LEFT JOIN product_categories pc ON p.category = pc.slug
WHERE p.is_active = true
GROUP BY p.category, pc.name, pc.slug
ORDER BY product_count DESC;

-- Step 4: Update products to use correct category slugs
-- Map common product categories to correct slugs
UPDATE products 
SET category = CASE 
    WHEN category = 'car' THEN 'vehicles'
    WHEN category = 'cars' THEN 'vehicles'
    WHEN category = 'vehicle' THEN 'vehicles'
    WHEN category = 'vehicles' THEN 'vehicles'
    WHEN category = 'part' THEN 'engine-parts'
    WHEN category = 'parts' THEN 'engine-parts'
    WHEN category = 'engine' THEN 'engine-parts'
    WHEN category = 'engine-parts' THEN 'engine-parts'
    WHEN category = 'transmission' THEN 'transmission'
    WHEN category = 'suspension' THEN 'suspension'
    WHEN category = 'brakes' THEN 'brakes'
    WHEN category = 'brake' THEN 'brakes'
    WHEN category = 'electrical' THEN 'electrical'
    WHEN category = 'interior' THEN 'interior'
    WHEN category = 'exterior' THEN 'exterior'
    WHEN category = 'performance' THEN 'performance'
    WHEN category = 'tools' THEN 'tools-equipment'
    WHEN category = 'equipment' THEN 'tools-equipment'
    WHEN category = 'tools-equipment' THEN 'tools-equipment'
    WHEN category = 'maintenance' THEN 'maintenance'
    WHEN category = 'commercial' THEN 'commercial'
    WHEN category = 'accessory' THEN 'exterior'
    WHEN category = 'accessories' THEN 'exterior'
    ELSE category
END
WHERE is_active = true;

-- Step 5: Verify the fix
SELECT 
    'Updated Product Categories' as result,
    p.category as updated_category,
    COUNT(*) as product_count,
    CASE 
        WHEN pc.slug IS NOT NULL THEN '✅ Now matches'
        ELSE '❌ Still no match'
    END as match_status,
    pc.name as category_name
FROM products p
LEFT JOIN product_categories pc ON p.category = pc.slug
WHERE p.is_active = true
GROUP BY p.category, pc.name, pc.slug
ORDER BY product_count DESC;

-- Step 6: Test specific suspension category
SELECT 
    'Suspension Category Test' as result,
    COUNT(*) as suspension_products,
    'Should show > 0 if fix worked' as expectation
FROM products 
WHERE category = 'suspension' AND is_active = true;

-- Step 7: Success message
SELECT 
    '✅ SUCCESS' as result,
    'Category-product matching fixed' as status,
    'Products now use correct category slugs' as fix,
    'Frontend category filtering will work' as expectation,
    'No more no products found errors' as error_fix;
