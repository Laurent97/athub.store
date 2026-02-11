-- Find existing partners and add products to them
-- This will identify real partners and add products

-- Step 1: Find all approved partners
SELECT 
    'EXISTING PARTNERS' as status,
    id,
    user_id,
    store_name,
    store_slug,
    partner_status,
    is_active
FROM partner_profiles 
WHERE partner_status = 'approved' 
    AND is_active = true
ORDER BY created_at DESC;

-- Step 2: Get the first approved partner ID
-- We'll use this partner to add products
DO $$
DECLARE
    selected_partner_id UUID;
BEGIN
    SELECT id INTO selected_partner_id 
    FROM partner_profiles 
    WHERE partner_status = 'approved' 
        AND is_active = true 
    LIMIT 1;
    
    IF selected_partner_id IS NOT NULL THEN
        -- Step 3: Add products for this partner
        INSERT INTO partner_products (partner_id, product_id, selling_price, profit_margin, is_active)
        SELECT 
            selected_partner_id,
            p.id as product_id,
            p.original_price * 1.25 as selling_price,  -- 25% markup
            25.0 as profit_margin,
            true as is_active
        FROM products p
        WHERE p.is_active = true 
            AND p.original_price > 0
            AND NOT EXISTS (
                SELECT 1 FROM partner_products pp 
                WHERE pp.partner_id = selected_partner_id 
                AND pp.product_id = p.id
            )
        LIMIT 10;  -- Add 10 products
        
        RAISE NOTICE 'Added 10 products to partner: %', selected_partner_id;
    ELSE
        RAISE NOTICE 'No approved partners found';
    END IF;
END $$;

-- Step 4: Verify the products were added
SELECT 
    'PARTNER PRODUCTS AFTER INSERT' as status,
    pp.partner_id,
    pp2.store_name as partner_name,
    COUNT(*) as total_products,
    COUNT(CASE WHEN pp.is_active = true THEN 1 END) as active_products
FROM partner_products pp
INNER JOIN partner_profiles pp2 ON pp.partner_id = pp2.id
GROUP BY pp.partner_id, pp2.store_name
ORDER BY pp.partner_id;
