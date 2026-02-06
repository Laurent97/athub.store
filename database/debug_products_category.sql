-- Debug products by category to identify filtering issues
-- This will help us understand why suspension category shows no products

-- Check total products in database
SELECT 
    'Total Products' as metric,
    COUNT(*) as count
FROM products
WHERE is_active = true;

-- Check products by category
SELECT 
    'Products by Category' as metric,
    category,
    COUNT(*) as count
FROM products
WHERE is_active = true
GROUP BY category
ORDER BY count DESC;

-- Check specifically for suspension products
SELECT 
    'Suspension Products' as metric,
    COUNT(*) as count
FROM products
WHERE is_active = true AND category = 'suspension';

-- Show sample suspension products if they exist
SELECT 
    'Sample Suspension Products' as metric,
    id,
    title,
    category,
    original_price,
    is_active,
    created_at
FROM products
WHERE is_active = true AND category = 'suspension'
LIMIT 5;

-- Check if category constraint is blocking suspension products
SELECT 
    'Category Constraint Check' as metric,
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
FROM products
WHERE category = 'suspension'
LIMIT 1;
