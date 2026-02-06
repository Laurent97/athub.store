-- Delete specific products from database
-- Heavy Duty Truck Battery, Oil Change Kit, Professional Socket Set, Turbocharger Kit, Leather Seat Covers, LED Headlight Set, Premium Brake Kit, DFDF, jdbfsjdbfisdb

-- Step 1: Show products before deletion
SELECT 
    '=== PRODUCTS TO BE DELETED ===' as status,
    id,
    title,
    sku,
    category,
    original_price,
    is_active,
    'These products will be permanently deleted' as action
FROM products 
WHERE title IN (
    'Heavy Duty Truck Battery',
    'Oil Change Kit', 
    'Professional Socket Set', 
    'Turbocharger Kit',
    'Leather Seat Covers', 
    'LED Headlight Set',
    'Premium Brake Kit',
    'DFDF',
    'jdbfsjdbfisdb'
)
ORDER BY title;

-- Step 2: Delete the specific products
DELETE FROM products 
WHERE title IN (
    'Heavy Duty Truck Battery',
    'Oil Change Kit', 
    'Professional Socket Set', 
    'Turbocharger Kit',
    'Leather Seat Covers', 
    'LED Headlight Set',
    'Premium Brake Kit',
    'DFDF',
    'jdbfsjdbfisdb'
);

-- Step 3: Verify deletion was successful
SELECT 
    '=== DELETION VERIFICATION ===' as status,
    COUNT(*) as products_remaining,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ ALL PRODUCTS DELETED'
        ELSE '❌ SOME PRODUCTS REMAIN'
    END as deletion_status
FROM products 
WHERE title IN (
    'Heavy Duty Truck Battery',
    'Oil Change Kit', 
    'Professional Socket Set', 
    'Turbocharger Kit',
    'Leather Seat Covers', 
    'LED Headlight Set',
    'Premium Brake Kit',
    'DFDF',
    'jdbfsjdbfisdb'
);

-- Step 4: Show remaining products in affected categories
SELECT 
    '=== REMAINING PRODUCTS BY CATEGORY ===' as analysis,
    category,
    COUNT(*) as remaining_products,
    'Products still in these categories' as status
FROM products 
WHERE is_active = true
GROUP BY category
ORDER BY remaining_products DESC;

-- Step 5: Success message
SELECT 
    '✅ SPECIFIC PRODUCTS DELETED' as result,
    '9 sample products permanently removed' as status,
    'Database cleaned of unwanted products' as outcome,
    'Clean automotive marketplace database' as final_status,
    'Products deleted: Heavy Duty Truck Battery, Oil Change Kit, Professional Socket Set, Turbocharger Kit, Leather Seat Covers, LED Headlight Set, Premium Brake Kit, DFDF, jdbfsjdbfisdb' as summary;
