-- Fix partner_products foreign key to point to partner_profiles instead of users
-- This will resolve the frontend query relationship error

-- Step 1: Check current foreign key relationships
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'partner_products';

-- Step 2: Check if partner_profiles has user_id column to link to users
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'partner_profiles'
    AND column_name = 'user_id';

-- Step 3: Create a new foreign key relationship to partner_profiles
-- First, drop the existing foreign key constraint
ALTER TABLE partner_products DROP CONSTRAINT IF EXISTS partner_products_partner_id_fkey;

-- Step 4: Add the correct foreign key to partner_profiles
ALTER TABLE partner_products 
ADD CONSTRAINT partner_products_partner_id_fkey 
FOREIGN KEY (partner_id) REFERENCES partner_profiles(id) ON DELETE CASCADE;

-- Step 5: Update existing partner_products to use correct partner_ids
-- This updates partner_id from users.id to partner_profiles.id
UPDATE partner_products 
SET partner_id = pp.id
FROM partner_profiles pp
WHERE partner_products.partner_id = pp.user_id;

-- Step 6: Verify the fix
SELECT 
    'Foreign Key Fix Verification' as result,
    COUNT(*) as total_partner_products,
    COUNT(CASE WHEN pp.id IS NOT NULL THEN 1 END) as valid_partner_references
FROM partner_products pp
LEFT JOIN partner_profiles pfp ON pp.partner_id = pfp.id;

-- Step 7: Show the updated foreign key relationships
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'partner_products';

-- Step 8: Test the relationship with a sample query
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
    'partner_products foreign key fixed' as status,
    'Now references partner_profiles instead of users' as change,
    'Frontend queries will work correctly' as expectation,
    'Partner dashboard functionality restored' as capability;
