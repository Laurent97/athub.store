-- Comprehensive fix for all product categories
-- This ensures all automotive categories work properly

-- Step 1: Drop and recreate category constraint with all automotive categories
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;

ALTER TABLE products 
ADD CONSTRAINT products_category_check 
CHECK (
    category IN (
        'car', 'cars', 'vehicle', 'vehicles', 'automotive',
        'part', 'parts', 'component', 'components', 'spare', 'spares', 'replacement',
        'accessory', 'accessories', 'gear', 'equipment', 'tools', 'electronics',
        'engine', 'transmission', 'suspension', 'brakes', 'electrical',
        'interior', 'exterior', 'performance', 'maintenance',
        'tire', 'tires', 'wheel', 'wheels', 'battery', 'oil', 'filter',
        'fluid', 'light', 'mirror', 'sensor', 'exhaust', 'cooling',
        'steering', 'alignment', 'body', 'paint', 'upholstery'
    )
);

-- Step 2: Add sample products for all categories if table is empty
INSERT INTO products (
    id, sku, title, description, category, make, model, year, 
    condition, specifications, original_price, sale_price, stock_quantity, 
    images, is_active, created_by, created_at, updated_at, featured
) 
SELECT 
    gen_random_uuid() as id,
    'SAMPLE-' || UPPER(substring(md5(random()::text), 1, 8)) as sku,
    title,
    'Sample product for ' || category as description,
    category,
    CASE 
        WHEN category = 'suspension' THEN 'Performance'
        WHEN category = 'engine' THEN 'PowerTech'
        WHEN category = 'brakes' THEN 'SafeStop'
        WHEN category = 'transmission' THEN 'GearMaster'
        WHEN category = 'electrical' THEN 'ElectroPro'
        WHEN category = 'interior' THEN 'ComfortRide'
        WHEN category = 'exterior' THEN 'StylePlus'
        WHEN category = 'performance' THEN 'SpeedPro'
        WHEN category = 'maintenance' THEN 'CarePro'
        WHEN category = 'tires' THEN 'GripMaster'
        WHEN category = 'tools' THEN 'ToolPro'
        ELSE 'AutoBrand'
    END as make,
    CASE 
        WHEN category = 'suspension' THEN 'Suspension Pro'
        WHEN category = 'engine' THEN 'Engine Pro'
        WHEN category = 'brakes' THEN 'Brake Pro'
        WHEN category = 'transmission' THEN 'Trans Pro'
        WHEN category = 'electrical' THEN 'Electro Pro'
        WHEN category = 'interior' THEN 'Interior Pro'
        WHEN category = 'exterior' THEN 'Exterior Pro'
        WHEN category = 'performance' THEN 'Performance Pro'
        WHEN category = 'maintenance' THEN 'Maintenance Pro'
        WHEN category = 'tires' THEN 'Tire Pro'
        WHEN category = 'tools' THEN 'Tool Pro'
        ELSE 'Auto Pro'
    END as model,
    2024 as year,
    'New' as condition,
    '{"warranty": "2 years", "features": ["High quality", "Fast shipping"]}'::jsonb as specifications,
    (random() * 500 + 100)::numeric(10,2) as original_price,
    (random() * 450 + 100)::numeric(10,2) as sale_price,
    FLOOR(random() * 50 + 10) as stock_quantity,
    '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop"]'::jsonb as images,
    true as is_active,
    gen_random_uuid() as created_by,
    NOW() as created_at,
    NOW() as updated_at,
    random() > 0.5 as featured
FROM (VALUES 
    ('suspension', 'Coilover Suspension Kit'),
    ('engine', 'V8 Performance Engine'),
    ('brakes', 'Premium Brake System'),
    ('transmission', 'Automatic Transmission'),
    ('electrical', 'LED Lighting Kit'),
    ('interior', 'Leather Seat Covers'),
    ('exterior', 'Carbon Fiber Hood'),
    ('performance', 'Turbo Charger Kit'),
    ('maintenance', 'Oil Change Kit'),
    ('tires', 'All-Season Tire Set'),
    ('tools', 'Mechanic Tool Set')
) AS sample_data(category, title)
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE is_active = true 
    LIMIT 1
);

-- Step 3: Verify the fix
SELECT 
    'Fix Verification' as result,
    category,
    COUNT(*) as count,
    CASE 
        WHEN category IN (
            'car', 'cars', 'vehicle', 'vehicles', 'automotive',
            'part', 'parts', 'component', 'components', 'spare', 'spares', 'replacement',
            'accessory', 'accessories', 'gear', 'equipment', 'tools', 'electronics',
            'engine', 'transmission', 'suspension', 'brakes', 'electrical',
            'interior', 'exterior', 'performance', 'maintenance',
            'tire', 'tires', 'wheel', 'wheels', 'battery', 'oil', 'filter',
            'fluid', 'light', 'mirror', 'sensor', 'exhaust', 'cooling',
            'steering', 'alignment', 'body', 'paint', 'upholstery'
        ) THEN '✅ Valid'
        ELSE '❌ Invalid'
    END as validation
FROM products
WHERE is_active = true
GROUP BY category
ORDER BY category;
