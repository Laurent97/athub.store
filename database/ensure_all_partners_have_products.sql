-- Quick fix: Add products to all existing partners
-- This ensures every approved partner has products

-- Add products to any partner that doesn't have them yet
INSERT INTO partner_products (partner_id, product_id, selling_price, profit_margin, is_active)
SELECT 
    pp.id as partner_id,
    p.id as product_id,
    p.original_price * 1.3 as selling_price,  -- 30% markup
    30.0 as profit_margin,
    true as is_active
FROM partner_profiles pp
CROSS JOIN products p ON p.is_active = true AND p.original_price > 0
WHERE pp.partner_status = 'approved' 
    AND pp.is_active = true
    AND NOT EXISTS (
        SELECT 1 FROM partner_products existing_pp 
        WHERE existing_pp.partner_id = pp.id 
        LIMIT 1
    )
    AND p.id NOT IN (
        SELECT product_id FROM partner_products 
        WHERE partner_id = pp.id
    )
LIMIT 5;  -- Add 5 products per partner

-- Verify the results
SELECT 
    'FINAL VERIFICATION' as status,
    pp.id as partner_id,
    pp.store_name,
    pp.store_slug,
    COUNT(pp_new.id) as products_added,
    COUNT(pp_new.id) FILTER (WHERE pp_new.is_active = true) as active_products
FROM partner_profiles pp
LEFT JOIN partner_products pp_new ON pp.id = pp_new.partner_id
WHERE pp.partner_status = 'approved' 
    AND pp.is_active = true
GROUP BY pp.id, pp.store_name, pp.store_slug
ORDER BY pp.store_name;
