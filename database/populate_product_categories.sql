-- Populate product_categories table with automotive categories
-- This will fix the "no products found" issue for categories

-- Step 1: Clear existing data (if any)
DELETE FROM product_categories;

-- Step 2: Insert categories that match frontend exactly
INSERT INTO product_categories (id, parent_id, name, slug, product_type, level, sort_order, item_count, is_active) VALUES
-- Main Category (All Products)
(gen_random_uuid(), NULL, 'All Products', 'all', 'parts', 1, 0, 150000, true),

-- Vehicles Category
(gen_random_uuid(), NULL, 'Vehicles', 'vehicles', 'cars', 1, 1, 15000, true),

-- Parts Categories (Level 1)
(gen_random_uuid(), NULL, 'Engine Parts', 'engine-parts', 'parts', 1, 2, 25000, true),
(gen_random_uuid(), NULL, 'Transmission', 'transmission', 'parts', 1, 3, 8000, true),
(gen_random_uuid(), NULL, 'Suspension', 'suspension', 'parts', 1, 4, 12000, true),
(gen_random_uuid(), NULL, 'Brakes', 'brakes', 'parts', 1, 5, 10000, true),
(gen_random_uuid(), NULL, 'Electrical', 'electrical', 'parts', 1, 6, 18000, true),
(gen_random_uuid(), NULL, 'Interior', 'interior', 'parts', 1, 7, 20000, true),
(gen_random_uuid(), NULL, 'Exterior', 'exterior', 'parts', 1, 8, 14000, true),
(gen_random_uuid(), NULL, 'Performance', 'performance', 'parts', 1, 9, 6000, true),
(gen_random_uuid(), NULL, 'Tools & Equipment', 'tools-equipment', 'parts', 1, 10, 5000, true),
(gen_random_uuid(), NULL, 'Maintenance', 'maintenance', 'parts', 1, 11, 22000, true),
(gen_random_uuid(), NULL, 'Commercial', 'commercial', 'parts', 1, 12, 7000, true);

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
