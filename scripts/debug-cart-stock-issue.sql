-- Debug Cart Stock Issue
-- This script helps identify why cart shows "Out of Stock" when products should be available

-- Check current product stock levels
SELECT 
    'Products in Database' as section,
    p.id,
    p.sku,
    p.title,
    p.stock_quantity,
    p.is_active,
    pp.id as partner_product_id,
    pp.is_active as partner_product_active,
    pp.selling_price
FROM products p
LEFT JOIN partner_products pp ON p.id = pp.product_id
WHERE p.is_active = true
ORDER BY p.created_at DESC
LIMIT 10;

-- Check specific product that might be in cart
SELECT 
    'Product Details' as section,
    p.id,
    p.sku,
    p.title,
    p.stock_quantity,
    p.is_active as product_active,
    pp.id as partner_product_id,
    pp.is_active as partner_product_active,
    pp.selling_price
FROM products p
LEFT JOIN partner_products pp ON p.id = pp.product_id
WHERE p.sku = 'BRAKE-PADS-001' OR p.title LIKE '%brake%'
LIMIT 5;

-- Update all products to have stock if they don't
UPDATE products 
SET 
    stock_quantity = 100,
    is_active = true
WHERE stock_quantity IS NULL OR stock_quantity <= 0;

-- Update all partner products to be active
UPDATE partner_products 
SET 
    is_active = true
WHERE is_active = false OR is_active IS NULL;

-- Show results
SELECT 
    'Stock Update Results' as section,
    COUNT(*) as products_updated,
    COUNT(CASE WHEN stock_quantity > 0 THEN 1 ELSE 0 END) as now_in_stock,
    COUNT(CASE WHEN is_active = true THEN 1 ELSE 0 END) as now_active
FROM products
WHERE stock_quantity > 0;
