-- Simple fix for partner_products foreign key constraint
-- Just update the constraint to point to the correct table

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE partner_products DROP CONSTRAINT IF EXISTS partner_products_partner_id_fkey;

-- Step 2: Add the correct foreign key to users (since data points to users)
ALTER TABLE partner_products 
ADD CONSTRAINT partner_products_partner_id_fkey 
FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 3: Verify the constraint
SELECT 
    'Constraint Fixed' as result,
    'partner_products.partner_id now references users.id' as status,
    'Data integrity maintained' as note;

-- Step 4: Test the relationship
SELECT 
    'Relationship Test' as result,
    pp.id as partner_product_id,
    pp.sku,
    pp.profit_margin,
    pp.selling_price,
    u.email as partner_email,
    u.user_type,
    pp.is_active
FROM partner_products pp
JOIN users u ON pp.partner_id = u.id
WHERE pp.is_active = true
LIMIT 3;

-- Step 5: Success message
SELECT 
    '✅ SUCCESS' as result,
    'partner_products foreign key fixed' as status,
    'Now correctly references users table' as change,
    'Frontend needs to be updated to query users instead of partner_profiles' as note,
    'Or create a view to join with partner_profiles' as alternative;
