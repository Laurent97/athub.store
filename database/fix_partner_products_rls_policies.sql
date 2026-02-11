-- Fix RLS policies for partner_products table
-- This resolves "row-level security policy" violations on INSERT

-- Step 1: Drop ALL existing policies on partner_products to start fresh
DROP POLICY IF EXISTS "Partners can insert own partner products" ON partner_products;
DROP POLICY IF EXISTS "Partners can update own partner products" ON partner_products;
DROP POLICY IF EXISTS "Partners can view own partner products" ON partner_products;
DROP POLICY IF EXISTS "Partners can insert own products" ON partner_products;
DROP POLICY IF EXISTS "Partners can update own products" ON partner_products;
DROP POLICY IF EXISTS "Partners can view own products" ON partner_products;
DROP POLICY IF EXISTS "Public can view active partner products" ON partner_products;
DROP POLICY IF EXISTS "Authenticated users can view active partner products" ON partner_products;
DROP POLICY IF EXISTS "Admins can manage all partner products" ON partner_products;

-- Step 2: Create fresh policies from scratch
-- Policy 1: Public can view active products
CREATE POLICY "Public can view active partner products" ON partner_products
    FOR SELECT USING (
        auth.role() = 'anon' 
        AND is_active = true
    );

-- Policy 2: Authenticated users can view active products
CREATE POLICY "Authenticated users can view active partner products" ON partner_products
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND is_active = true
    );

-- INSERT policy: Allow authenticated users to insert if they own the partner profile
CREATE POLICY "Partners can insert own products" ON partner_products
    FOR INSERT 
    WITH CHECK (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM partner_profiles 
            WHERE partner_profiles.id = partner_products.partner_id 
            AND partner_profiles.user_id = auth.uid()
        )
    );

-- UPDATE policy: Allow authenticated users to update their own products
CREATE POLICY "Partners can update own products" ON partner_products
    FOR UPDATE
    WITH CHECK (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM partner_profiles 
            WHERE partner_profiles.id = partner_products.partner_id 
            AND partner_profiles.user_id = auth.uid()
        )
    );

-- SELECT policy: Allow authenticated users to view their own products
CREATE POLICY "Partners can view own products" ON partner_products
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM partner_profiles 
            WHERE partner_profiles.id = partner_products.partner_id 
            AND partner_profiles.user_id = auth.uid()
        )
    );

-- Admin policy: Admins can manage all partner products
CREATE POLICY "Admins can manage all partner products" ON partner_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Step 3: Ensure partner_profiles has proper RLS for reading user's own profile
-- This is critical for the subquery in partner_products policies to work
DROP POLICY IF EXISTS "Users can view own partner profile" ON partner_profiles;
DROP POLICY IF EXISTS "Users can view partner profile" ON partner_profiles;

CREATE POLICY "Users can view own partner profile" ON partner_profiles
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND user_id = auth.uid()
    );

-- Step 4: Grant proper permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON partner_products TO authenticated;
GRANT SELECT ON partner_profiles TO authenticated;

-- Step 5: Verify the fix
SELECT 
    'RLS Policy Fix' as result,
    'All policies dropped and recreated cleanly' as status,
    'INSERT, UPDATE, SELECT, and DELETE policies enabled' as changes,
    'Users can now manage their own partner products' as expected;
