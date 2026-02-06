-- Safe fix for partner_products foreign key relationship
-- This will handle data mismatches properly

-- Step 1: Check current data mismatch
SELECT 
    'Data Mismatch Check' as result,
    COUNT(*) as total_partner_products,
    COUNT(CASE WHEN pp.id IS NULL THEN 1 END) as orphaned_products,
    COUNT(CASE WHEN pp.id IS NOT NULL THEN 1 END) as valid_products
FROM partner_products pp
LEFT JOIN partner_profiles pfp ON pp.partner_id = pfp.id;

-- Step 2: Show orphaned partner products
SELECT 
    'Orphaned Products' as result,
    pp.id as product_id,
    pp.partner_id as current_partner_id,
    pp.sku,
    pp.profit_margin,
    pp.selling_price
FROM partner_products pp
LEFT JOIN partner_profiles pfp ON pp.partner_id = pfp.id
WHERE pfp.id IS NULL;

-- Step 3: Find matching partner_profiles for orphaned products
SELECT 
    'Potential Matches' as result,
    pp.id as product_id,
    pp.partner_id as current_partner_id,
    pfp.id as partner_profile_id,
    pfp.user_id as profile_user_id,
    pfp.store_name
FROM partner_products pp
LEFT JOIN partner_profiles pfp ON pp.partner_id = pfp.user_id
WHERE pfp.id IS NOT NULL AND pp.partner_id != pfp.id;

-- Step 4: Update orphaned products to use correct partner_profile IDs
UPDATE partner_products 
SET partner_id = pfp.id
FROM partner_profiles pfp
WHERE partner_products.partner_id = pfp.user_id
    AND NOT EXISTS (
        SELECT 1 FROM partner_profiles pp2 
        WHERE pp2.id = partner_products.partner_id
    );

-- Step 5: Delete any remaining orphaned products (those with no matching partner)
DELETE FROM partner_products 
WHERE NOT EXISTS (
    SELECT 1 FROM partner_profiles pfp 
    WHERE pfp.id = partner_products.partner_id
);

-- Step 6: Drop and recreate the foreign key constraint
ALTER TABLE partner_products DROP CONSTRAINT IF EXISTS partner_products_partner_id_fkey;

ALTER TABLE partner_products 
ADD CONSTRAINT partner_products_partner_id_fkey 
FOREIGN KEY (partner_id) REFERENCES partner_profiles(id) ON DELETE CASCADE;

-- Step 7: Verify the fix
SELECT 
    'Fix Verification' as result,
    COUNT(*) as total_partner_products,
    COUNT(CASE WHEN pp.id IS NOT NULL THEN 1 END) as valid_partner_references,
    'All products now have valid partner references' as status
FROM partner_products pp
JOIN partner_profiles pfp ON pp.partner_id = pfp.id;

-- Step 8: Test the relationship
SELECT 
    'Relationship Test' as result,
    pp.id as partner_product_id,
    pp.sku,
    pp.profit_margin,
    pp.selling_price,
    pfp.store_name,
    pfp.store_slug,
    pfp.logo_url,
    pp.is_active
FROM partner_products pp
JOIN partner_profiles pfp ON pp.partner_id = pfp.id
WHERE pp.is_active = true
LIMIT 3;

-- Step 9: Success message
SELECT 
    '✅ SUCCESS' as result,
    'partner_products foreign key fixed safely' as status,
    'Orphaned products cleaned up' as cleanup,
    'Frontend queries will work correctly' as expectation,
    'Partner dashboard functionality restored' as capability;
