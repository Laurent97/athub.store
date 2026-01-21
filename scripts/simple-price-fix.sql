-- Simple Fix for Partner Product Pricing
-- This script fixes the immediate issue with selling_price field

-- Update all NULL selling_price values to use original_price + 15% margin
UPDATE partner_products
SET 
    selling_price = ROUND(p.original_price * 1.15, 2),
    updated_at = NOW()
FROM 
    products p
WHERE 
    partner_products.is_active = true 
    AND partner_products.selling_price IS NULL;

-- Show verification results
SELECT 
    'Price Fix Results' as section,
    COUNT(*) as total_products,
    COUNT(CASE WHEN selling_price IS NOT NULL THEN 1 ELSE 0 END) as now_has_price,
    AVG(selling_price) as avg_price
FROM partner_products 
WHERE is_active = true;
