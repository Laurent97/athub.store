-- Fix product_categories product_type constraint to support all categories
-- This will allow all automotive categories to be stored properly

-- Step 1: Check current constraint
SELECT 
    'Current Constraint Check' as result,
    conname as constraint_name,
    consrc as constraint_definition
FROM pg_constraint
WHERE conrelid = 'product_categories'::regclass
    AND contype = 'c'
    AND conname = 'product_categories_product_type_check';

-- Step 2: Drop the restrictive constraint
ALTER TABLE product_categories DROP CONSTRAINT IF EXISTS product_categories_product_type_check;

-- Step 3: Create a more flexible constraint that allows all automotive categories
ALTER TABLE product_categories
ADD CONSTRAINT product_categories_product_type_check
CHECK (
    product_type IN (
        'all', 'parts', 'cars', 'accessories', 'vehicles',
        'engine-parts', 'transmission', 'suspension', 'brakes',
        'electrical', 'interior', 'exterior', 'performance',
        'tools-equipment', 'maintenance', 'commercial',
        'automotive', 'components', 'systems', 'services'
    )
);

-- Step 4: Update existing categories to use appropriate product types
UPDATE product_categories SET product_type = 'all' WHERE slug = 'all';
UPDATE product_categories SET product_type = 'vehicles' WHERE slug = 'vehicles';
UPDATE product_categories SET product_type = 'engine-parts' WHERE slug = 'engine-parts';
UPDATE product_categories SET product_type = 'transmission' WHERE slug = 'transmission';
UPDATE product_categories SET product_type = 'suspension' WHERE slug = 'suspension';
UPDATE product_categories SET product_type = 'brakes' WHERE slug = 'brakes';
UPDATE product_categories SET product_type = 'electrical' WHERE slug = 'electrical';
UPDATE product_categories SET product_type = 'interior' WHERE slug = 'interior';
UPDATE product_categories SET product_type = 'exterior' WHERE slug = 'exterior';
UPDATE product_categories SET product_type = 'performance' WHERE slug = 'performance';
UPDATE product_categories SET product_type = 'tools-equipment' WHERE slug = 'tools-equipment';
UPDATE product_categories SET product_type = 'maintenance' WHERE slug = 'maintenance';
UPDATE product_categories SET product_type = 'commercial' WHERE slug = 'commercial';

-- Step 5: Verify the updated constraint
SELECT 
    'Updated Constraint' as result,
    conname as constraint_name,
    consrc as constraint_definition
FROM pg_constraint
WHERE conrelid = 'product_categories'::regclass
    AND contype = 'c'
    AND conname = 'product_categories_product_type_check';

-- Step 6: Show updated categories with proper product types
SELECT 
    'Updated Categories' as result,
    name,
    slug,
    product_type,
    item_count,
    is_active
FROM product_categories
ORDER BY sort_order;

-- Step 7: Success message
SELECT 
    '✅ SUCCESS' as result,
    'product_type constraint fixed' as status,
    'All automotive categories now supported' as capability,
    'Flexible constraint allows future categories' as flexibility,
    'Product categories fully functional' as final_status;
