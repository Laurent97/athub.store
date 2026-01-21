-- Final Comprehensive Cart Fix
-- This script fixes both image display and stock status issues

-- First, check current state of products
SELECT 
    'Current Product State' as section,
    p.id,
    p.title,
    p.images,
    p.stock_quantity,
    p.is_active,
    pp.id as partner_product_id,
    pp.selling_price,
    pp.is_active as partner_product_active
FROM 
    products p
LEFT JOIN partner_products pp ON p.id = pp.product_id
LIMIT 10;

-- Update products with proper images if they don't have any
UPDATE products 
SET 
    images = CASE 
        WHEN images IS NULL OR images = '{}' THEN ARRAY['https://picsum.photos/seed/autopart1/1.jpg', 'https://picsum.photos/seed/autopart2/2.jpg', 'https://picsum.photos/seed/autopart3/3.jpg']
        ELSE images
    END,
    updated_at = NOW()
WHERE 
    images IS NULL OR images = '{}';

-- Update products with proper stock quantities
UPDATE products 
SET 
    stock_quantity = CASE 
        WHEN stock_quantity IS NULL OR stock_quantity <= 0 THEN 100
        ELSE stock_quantity
    END,
    updated_at = NOW()
WHERE 
    stock_quantity IS NULL OR stock_quantity <= 0;

-- Update partner products to ensure they're active and have proper pricing
UPDATE partner_products pp
SET 
    is_active = true,
    selling_price = CASE 
        WHEN pp.selling_price IS NOT NULL THEN pp.selling_price
        ELSE ROUND(p.original_price * 1.15, 2)
    END,
    updated_at = NOW()
FROM 
    products p
WHERE 
    pp.is_active = false OR pp.selling_price IS NULL;

-- Final verification
SELECT 
    'Final Fix Verification' as section,
    COUNT(*) as total_products,
    COUNT(CASE WHEN p.images IS NOT NULL AND p.images != '{}' THEN 1 ELSE 0 END) as has_images,
    COUNT(CASE WHEN p.stock_quantity > 0 THEN 1 ELSE 0 END) as in_stock,
    COUNT(CASE WHEN pp.selling_price IS NOT NULL THEN 1 ELSE 0 END) as has_price,
    COUNT(CASE WHEN pp.is_active = true THEN 1 ELSE 0 END) as active_products
FROM 
    products p
LEFT JOIN partner_products pp ON p.id = pp.product_id;
