-- Fix Partner Product Pricing
-- This script ensures all partner products have proper selling_price values
-- and updates existing products to use selling_price instead of custom_price

-- First, check current state of partner products
SELECT 
    'Current Partner Products' as section,
    pp.id,
    pp.product_id,
    pp.selling_price,
    pp.custom_price,
    pp.original_price,
    p.title,
    p.make,
    p.model,
    pp.is_active
FROM partner_products pp
JOIN products p ON pp.product_id = p.id
LIMIT 10;

-- Update partner products to use selling_price consistently
-- Set selling_price to original_price + 15% profit margin for all active partner products
UPDATE partner_products 
SET 
    selling_price = ROUND(p.original_price * 1.15, 2),
    updated_at = NOW()
WHERE 
    is_active = true 
    AND selling_price IS NULL;

-- Update partner products that have custom_price but no selling_price
UPDATE partner_products 
SET 
    selling_price = custom_price,
    updated_at = NOW()
WHERE 
    custom_price IS NOT NULL 
    AND selling_price IS NULL;

-- Show results
SELECT 
    'Updated Partner Products' as section,
    COUNT(*) as updated_count,
    COUNT(CASE WHEN selling_price IS NOT NULL THEN 1 ELSE 0 END) as now_has_price,
    AVG(selling_price) as avg_price
FROM partner_products 
WHERE is_active = true;

-- Also ensure products table has proper original_price
UPDATE products 
SET 
    original_price = CASE 
        WHEN original_price IS NULL OR original_price = 0 THEN 100.00
        ELSE original_price
    END
WHERE 
    original_price IS NULL OR original_price = 0;

-- Final verification
SELECT 
    'Final Verification' as section,
    COUNT(*) as total_partner_products,
    COUNT(CASE WHEN selling_price > 0 THEN 1 ELSE 0 END) as products_with_price,
    COUNT(CASE WHEN pp.is_active = true THEN 1 ELSE 0 END) as active_products
FROM partner_products pp
JOIN products p ON pp.product_id = p.id;
