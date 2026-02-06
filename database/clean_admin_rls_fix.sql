-- Clean Admin RLS Fix - Remove Conflicts and Ensure Proper Admin Access
-- This script removes ALL existing policies and creates clean, non-conflicting ones

-- USERS TABLE - Clean up all policies first
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "admin_update_user_profiles" ON users;
DROP POLICY IF EXISTS "admin_view_all_users" ON users;
DROP POLICY IF EXISTS "allow_user_registration" ON users;
DROP POLICY IF EXISTS "update_own_user_profile" ON users;
DROP POLICY IF EXISTS "view_own_user_profile" ON users;

-- PARTNER_PROFILES TABLE - Clean up all policies first
DROP POLICY IF EXISTS "Admins can view all partner_profiles" ON partner_profiles;
DROP POLICY IF EXISTS "Admins can update partner_profiles" ON partner_profiles;
DROP POLICY IF EXISTS "Partners can view own profile" ON partner_profiles;
DROP POLICY IF EXISTS "admin_delete_partner_profiles" ON partner_profiles;
DROP POLICY IF EXISTS "admin_update_partner_profiles" ON partner_profiles;
DROP POLICY IF EXISTS "admin_view_all_partners" ON partner_profiles;
DROP POLICY IF EXISTS "create_own_partner_profile" ON partner_profiles;
DROP POLICY IF EXISTS "update_own_partner_profile" ON partner_profiles;
DROP POLICY IF EXISTS "view_approved_partners" ON partner_profiles;
DROP POLICY IF EXISTS "view_own_partner_profile" ON partner_profiles;

-- ORDERS TABLE - Clean up all policies first
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
DROP POLICY IF EXISTS "Partners can update assigned orders" ON orders;
DROP POLICY IF EXISTS "Partners can view assigned orders" ON orders;
DROP POLICY IF EXISTS "Partners can view orders from their store" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- USERS TABLE - Create clean policies
-- Policy 1: Allow anonymous user registration
CREATE POLICY "Allow user registration" ON users
    FOR INSERT WITH CHECK (
        auth.role() = 'anon' OR
        (auth.role() = 'authenticated' AND id = auth.uid())
    );

-- Policy 2: Users can view and update their own profile
CREATE POLICY "Users can manage own profile" ON users
    FOR ALL USING (auth.uid() = id);

-- Policy 3: Admins can view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Policy 4: Admins can update all users
CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- PARTNER_PROFILES TABLE - Create clean policies
-- Policy 1: Partners can view their own profile
CREATE POLICY "Partners can view own profile" ON partner_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Policy 2: Partners can update their own profile
CREATE POLICY "Partners can update own profile" ON partner_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy 3: Public can view approved partners (for store pages)
CREATE POLICY "Public can view approved partners" ON partner_profiles
    FOR SELECT USING (partner_status = 'approved');

-- Policy 4: Admins can view all partner profiles
CREATE POLICY "Admins can view all partner profiles" ON partner_profiles
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Policy 5: Admins can update all partner profiles
CREATE POLICY "Admins can update all partner profiles" ON partner_profiles
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Policy 6: Admins can delete partner profiles
CREATE POLICY "Admins can delete partner profiles" ON partner_profiles
    FOR DELETE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- ORDERS TABLE - Create clean policies
-- Policy 1: Customers can view their own orders
CREATE POLICY "Customers can view own orders" ON orders
    FOR SELECT USING (auth.uid() = customer_id);

-- Policy 2: Customers can create orders
CREATE POLICY "Customers can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Policy 3: Customers can update their own orders
CREATE POLICY "Customers can update own orders" ON orders
    FOR UPDATE USING (auth.uid() = customer_id);

-- Policy 4: Partners can view orders from their store
CREATE POLICY "Partners can view store orders" ON orders
    FOR SELECT USING (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.partner_profiles 
            WHERE partner_profiles.user_id = auth.uid() 
            AND partner_profiles.id = orders.partner_id
        )
    );

-- Policy 5: Partners can update assigned orders
CREATE POLICY "Partners can update assigned orders" ON orders
    FOR UPDATE USING (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.partner_profiles 
            WHERE partner_profiles.user_id = auth.uid() 
            AND partner_profiles.id = orders.partner_id
        )
    );

-- Policy 6: Admins can view all orders
CREATE POLICY "Admins can view all orders" ON orders
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Policy 7: Admins can update all orders
CREATE POLICY "Admins can update all orders" ON orders
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Policy 8: Admins can delete all orders
CREATE POLICY "Admins can delete all orders" ON orders
    FOR DELETE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON partner_profiles TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT SELECT, INSERT ON users TO anon;
GRANT SELECT ON partner_profiles TO anon;

-- Verify clean policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('users', 'partner_profiles', 'orders')
ORDER BY tablename, policyname;
