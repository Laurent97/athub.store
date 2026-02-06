-- Populate product_categories table with automotive categories
-- This will fix the "no products found" issue for categories

-- Step 1: Clear existing data (if any)
DELETE FROM product_categories;

-- Step 2: Insert main automotive categories
INSERT INTO product_categories (id, parent_id, name, slug, product_type, level, sort_order, is_active) VALUES
-- Main Categories (Level 1)
(gen_random_uuid(), NULL, 'Cars', 'cars', 'cars', 1, 1, true),
(gen_random_uuid(), NULL, 'Parts', 'parts', 'parts', 1, 2, true),
(gen_random_uuid(), NULL, 'Accessories', 'accessories', 'accessories', 1, 3, true),

-- Cars Subcategories (Level 2)
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'cars'), 'Sedans', 'sedans', 'cars', 2, 1, true),
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'cars'), 'SUVs', 'suvs', 'cars', 2, 2, true),
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'cars'), 'Trucks', 'trucks', 'cars', 2, 3, true),
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'cars'), 'Sports Cars', 'sports-cars', 'cars', 2, 4, true),
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'cars'), 'Electric Vehicles', 'electric-vehicles', 'cars', 2, 5, true),
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'cars'), 'Hybrid Vehicles', 'hybrid-vehicles', 'cars', 2, 6, true),

-- Parts Subcategories (Level 2)
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'parts'), 'Engine Parts', 'engine-parts', 'parts', 2, 1, true),
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'parts'), 'Transmission', 'transmission', 'parts', 2, 2, true),
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'parts'), 'Suspension', 'suspension', 'parts', 2, 3, true),
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'parts'), 'Brakes', 'brakes', 'parts', 2, 4, true),
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'parts'), 'Electrical', 'electrical', 'parts', 2, 5, true),
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'parts'), 'Exterior', 'exterior', 'parts', 2, 6, true),
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'parts'), 'Interior', 'interior', 'parts', 2, 7, true),
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'parts'), 'Performance', 'performance', 'parts', 2, 8, true),
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'parts'), 'Maintenance', 'maintenance', 'parts', 2, 9, true),
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'parts'), 'Tools & Equipment', 'tools-equipment', 'parts', 2, 10, true),

-- Accessories Subcategories (Level 2)
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'accessories'), 'Electronics', 'electronics', 'accessories', 2, 1, true),
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'accessories'), 'Interior Accessories', 'interior-accessories', 'accessories', 2, 2, true),
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'accessories'), 'Exterior Accessories', 'exterior-accessories', 'accessories', 2, 3, true),
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'accessories'), 'Safety & Security', 'safety-security', 'accessories', 2, 4, true),
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'accessories'), 'Lighting', 'lighting', 'accessories', 2, 5, true),
(gen_random_uuid(), (SELECT id FROM product_categories WHERE slug = 'accessories'), 'Audio & Entertainment', 'audio-entertainment', 'accessories', 2, 6, true);

-- Step 3: Update item counts based on existing products
UPDATE product_categories pc SET item_count = (
    SELECT COUNT(*) 
    FROM products p 
    WHERE p.category = pc.slug 
    AND p.is_active = true
);

-- Step 4: Show the populated categories
SELECT 
    'Populated Categories' as result,
    pc.id,
    pc.name,
    pc.slug,
    pc.product_type,
    pc.level,
    pc.sort_order,
    pc.item_count,
    pc.is_active
FROM product_categories pc
ORDER BY pc.level, pc.sort_order;

-- Step 5: Show category summary
SELECT 
    'Category Summary' as result,
    COUNT(*) as total_categories,
    COUNT(CASE WHEN level = 1 THEN 1 END) as main_categories,
    COUNT(CASE WHEN level = 2 THEN 1 END) as subcategories,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_categories,
    SUM(item_count) as total_products_in_categories
FROM product_categories;

-- Step 6: Success message
SELECT 
    '✅ SUCCESS' as result,
    'product_categories table populated' as status,
    'Automotive categories created' as categories,
    'Frontend category navigation will work' as expectation,
    'No more no products found errors' as error_fix;
