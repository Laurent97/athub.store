-- Quick fix: Add partner products for the specific partner
-- This will add products for partner ID: a1e608c9-ac6d-4b72-b18e-86662d2a2d8f

-- Step 1: First, let's verify this partner exists
SELECT 
    'CHECKING PARTNER' as status,
    id,
    user_id,
    store_name,
    store_slug,
    partner_status,
    is_active
FROM partner_profiles 
WHERE id = 'a1e608c9-ac6d-4b72-b18e-86662d2a2d8f';

-- Step 2: Check if we have any products to add
SELECT 
    'AVAILABLE PRODUCTS' as status,
    COUNT(*) as total_products,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_products
FROM products 
WHERE is_active = true 
    AND original_price > 0
LIMIT 10;

-- Step 3: Add specific products for this partner
INSERT INTO partner_products (partner_id, product_id, selling_price, profit_margin, is_active)
SELECT 
    'a1e608c9-ac6d-4b72-b18e-86662d2a2d8f' as partner_id,
    p.id as product_id,
    p.original_price * 1.25 as selling_price,  -- 25% markup
    25.0 as profit_margin,
    true as is_active
FROM products p
WHERE p.is_active = true 
    AND p.original_price > 0
    AND NOT EXISTS (
        SELECT 1 FROM partner_products pp 
        WHERE pp.partner_id = 'a1e608c9-ac6d-4b72-b18e-86662d2a2d8f' 
        AND pp.product_id = p.id
    )
LIMIT 10;  -- Add 10 products to this partner

-- Step 4: Verify the products were added
SELECT 
    'PARTNER PRODUCTS ADDED' as status,
    COUNT(*) as total_partner_products,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
    COUNT(DISTINCT product_id) as unique_products
FROM partner_products 
WHERE partner_id = 'a1e608c9-ac6d-4b72-b18e-86662d2a2d8f';

-- Step 5: Show the added products with details
SELECT 
    'ADDED PRODUCTS DETAILS' as status,
    pp.id,
    pp.partner_id,
    pp.product_id,
    pp.selling_price,
    pp.profit_margin,
    pp.is_active,
    p.title as product_title,
    p.sku as product_sku,
    p.category as product_category,
    p.original_price as product_original_price,
    ROUND(pp.selling_price - p.original_price, 2) as markup_amount
FROM partner_products pp
INNER JOIN products p ON pp.product_id = p.id
WHERE pp.partner_id = 'a1e608c9-ac6d-4b72-b18e-86662d2a2d8f'
    AND pp.is_active = true
ORDER BY pp.created_at DESC;
