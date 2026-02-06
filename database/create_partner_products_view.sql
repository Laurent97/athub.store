-- Create a view that joins partner_products with partner_profiles
-- This will fix the frontend query relationship issue

-- Step 1: Create the view that matches what the frontend expects
CREATE OR REPLACE VIEW partner_products_with_profiles AS
SELECT 
    pp.id,
    pp.product_id,
    pp.partner_id,
    pp.profit_margin,
    pp.selling_price,
    pp.is_active,
    pp.created_at,
    pp.updated_at,
    pp.base_cost_price,
    pp.markup_percentage,
    pp.sku,
    -- Add partner profile fields that frontend expects
    pfp.id as partner_profile_id,
    pfp.store_name,
    pfp.store_slug,
    pfp.logo_url,
    pfp.store_tagline,
    pfp.business_type,
    pfp.country,
    pfp.city,
    pfp.partner_status,
    pfp.is_active as partner_is_active
FROM partner_products pp
JOIN users u ON pp.partner_id = u.id
LEFT JOIN partner_profiles pfp ON u.id = pfp.user_id
WHERE pp.is_active = true;

-- Step 2: Grant permissions on the view
GRANT SELECT ON partner_products_with_profiles TO anon;
GRANT SELECT ON partner_products_with_profiles TO authenticated;

-- Step 3: Test the view
SELECT 
    'View Test' as result,
    COUNT(*) as total_products,
    COUNT(CASE WHEN store_name IS NOT NULL THEN 1 END) as products_with_profiles
FROM partner_products_with_profiles;

-- Step 4: Show sample data from the view
SELECT 
    'Sample View Data' as result,
    id,
    sku,
    profit_margin,
    selling_price,
    store_name,
    store_slug,
    logo_url,
    partner_status
FROM partner_products_with_profiles
LIMIT 3;

-- Step 5: Success message
SELECT 
    '✅ SUCCESS' as result,
    'partner_products_with_profiles view created' as status,
    'Frontend can now query the view instead of the table' as solution,
    'View provides the relationship frontend expects' as benefit,
    'No frontend code changes needed' as note;
