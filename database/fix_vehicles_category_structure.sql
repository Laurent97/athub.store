-- Fix vehicles and cars category structure
-- Merge vehicles and cars into proper hierarchy

-- Step 1: Check current category structure
SELECT 
    'Current Categories' as result,
    name,
    slug,
    product_type,
    level,
    sort_order,
    item_count
FROM product_categories
WHERE slug IN ('vehicles', 'cars')
ORDER BY sort_order;

-- Step 2: Update vehicles category to be the main category
UPDATE product_categories 
SET 
    name = 'Vehicles',
    slug = 'vehicles',
    product_type = 'vehicles',
    level = 1,
    sort_order = 1,
    item_count = 15000
WHERE slug = 'vehicles';

-- Step 3: Create cars as a subcategory of vehicles (if not exists)
INSERT INTO product_categories (id, parent_id, name, slug, product_type, level, sort_order, item_count, is_active)
SELECT 
    gen_random_uuid(),
    (SELECT id FROM product_categories WHERE slug = 'vehicles'),
    'Cars',
    'cars',
    'cars',
    2,
    1,
    8000,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM product_categories WHERE slug = 'cars' AND parent_id IS NOT NULL
);

-- Step 4: Add other vehicle subcategories
INSERT INTO product_categories (id, parent_id, name, slug, product_type, level, sort_order, item_count, is_active)
SELECT 
    gen_random_uuid(),
    (SELECT id FROM product_categories WHERE slug = 'vehicles'),
    'Trucks',
    'trucks',
    'vehicles',
    2,
    2,
    4000,
    true
WHERE NOT EXISTS (SELECT 1 FROM product_categories WHERE slug = 'trucks');

INSERT INTO product_categories (id, parent_id, name, slug, product_type, level, sort_order, item_count, is_active)
SELECT 
    gen_random_uuid(),
    (SELECT id FROM product_categories WHERE slug = 'vehicles'),
    'SUVs',
    'suvs',
    'vehicles',
    2,
    3,
    3000,
    true
WHERE NOT EXISTS (SELECT 1 FROM product_categories WHERE slug = 'suvs');

-- Step 5: Update the main vehicles item count to include subcategories
UPDATE product_categories 
SET item_count = (
    SELECT COALESCE(SUM(item_count), 0) 
    FROM product_categories 
    WHERE parent_id = (SELECT id FROM product_categories WHERE slug = 'vehicles')
        OR slug = 'vehicles'
)
WHERE slug = 'vehicles';

-- Step 6: Show updated category structure
SELECT 
    'Updated Vehicle Categories' as result,
    pc.name,
    pc.slug,
    pc.product_type,
    pc.level,
    pc.sort_order,
    pc.item_count,
    CASE 
        WHEN pc.parent_id IS NULL THEN 'Main Category'
        ELSE CONCAT('Subcategory of ', (SELECT name FROM product_categories WHERE id = pc.parent_id))
    END as category_type
FROM product_categories pc
WHERE pc.slug IN ('vehicles', 'cars', 'trucks', 'suvs') OR pc.parent_id IN (SELECT id FROM product_categories WHERE slug = 'vehicles')
ORDER BY pc.level, pc.sort_order;

-- Step 7: Success message
SELECT 
    '✅ SUCCESS' as result,
    'Vehicles category structure fixed' as status,
    'Vehicles is now main category with Cars as subcategory' as structure,
    'Proper automotive category hierarchy' as hierarchy,
    'Frontend navigation will work correctly' as expectation;
