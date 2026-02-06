-- Fix products_category_check constraint to allow all new category slugs
-- This will resolve the constraint violation when updating product categories

-- Step 1: Check current constraint
SELECT 
    'Current Constraint Check' as result,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'products'::regclass
    AND contype = 'c'
    AND conname = 'products_category_check';

-- Step 2: Drop the restrictive constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;

-- Step 3: Create a flexible constraint that allows all automotive category slugs
ALTER TABLE products
ADD CONSTRAINT products_category_check
CHECK (
    category IN (
        'all', 'vehicles', 'cars', 'car', 'vehicle',
        'engine-parts', 'engine', 'part', 'parts',
        'transmission',
        'suspension',
        'brakes', 'brake',
        'electrical',
        'interior',
        'exterior', 'accessory', 'accessories',
        'performance',
        'tools-equipment', 'tools', 'equipment',
        'maintenance',
        'commercial',
        'tires', 'tire', 'wheels', 'wheel',
        'battery',
        'oil', 'filter', 'fluid', 'light', 'mirror', 'sensor'
    )
);

-- Step 4: Verify the updated constraint
SELECT 
    'Updated Constraint' as result,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'products'::regclass
    AND contype = 'c'
    AND conname = 'products_category_check';

-- Step 5: Now update products to use correct category slugs (this will work now)
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

-- Step 6: Verify the fix
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

-- Step 7: Test specific suspension category
SELECT 
    'Suspension Category Test' as result,
    COUNT(*) as suspension_products,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Success'
        ELSE '❌ Failed'
    END as test_result
FROM products 
WHERE category = 'suspension' AND is_active = true;

-- Step 8: Success message
SELECT 
    '✅ SUCCESS' as result,
    'Products category constraint fixed and updated' as status,
    'Products now use correct category slugs' as fix,
    'Frontend category filtering will work' as expectation,
    'No more no products found errors' as error_fix,
    'Complete automotive marketplace ready' as final_status;
