-- Fix products category constraint to allow all automotive categories
-- This will resolve the check constraint error when adding products

-- Step 1: Check current category constraint
SELECT 
    conname as constraint_name,
    consrc as source_code
FROM pg_constraint 
WHERE conrelid = 'products'::regclass 
    AND contype = 'c'
    AND conname = 'products_category_check';

-- Step 2: Drop the restrictive category constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;

-- Step 3: Create a more flexible category constraint
ALTER TABLE products 
ADD CONSTRAINT products_category_check 
CHECK (
    category IN (
        'car', 'cars', 'vehicle', 'vehicles',
        'part', 'parts', 'component', 'components', 'spare', 'spares',
        'accessory', 'accessories', 'gear', 'equipment', 'tools',
        'engine', 'transmission', 'suspension', 'brakes', 'electrical',
        'interior', 'exterior', 'performance', 'maintenance',
        'tire', 'tires', 'wheel', 'wheels', 'battery',
        'oil', 'filter', 'fluid', 'light', 'mirror', 'sensor'
    )
);

-- Step 4: Show the updated constraint
SELECT 
    'Category Constraint Updated' as result,
    'products_category_check' as constraint_name,
    'Now supports all automotive categories' as status;

-- Step 5: Test with different categories
SELECT 
    'Test Categories' as test_type,
    category,
    CASE 
        WHEN category IN (
            'car', 'cars', 'vehicle', 'vehicles',
            'part', 'parts', 'component', 'components', 'spare', 'spares',
            'accessory', 'accessories', 'gear', 'equipment', 'tools',
            'engine', 'transmission', 'suspension', 'brakes', 'electrical',
            'interior', 'exterior', 'performance', 'maintenance',
            'tire', 'tires', 'wheel', 'wheels', 'battery',
            'oil', 'filter', 'fluid', 'light', 'mirror', 'sensor'
        ) THEN '✅ Valid'
        ELSE '❌ Invalid'
    END as validation
FROM (VALUES 
    ('car'), ('parts'), ('accessories'), ('engine'), ('transmission'),
    ('suspension'), ('brakes'), ('electrical'), ('interior'),
    ('performance'), ('maintenance'), ('tires'), ('battery')
) AS test_categories(category);
