-- Fix Admin RLS Policies for Dashboard Access
-- This script ensures admin users can access all necessary tables for the dashboard

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all partner_profiles" ON partner_profiles;
DROP POLICY IF EXISTS "Admins can update partner_profiles" ON partner_profiles;
DROP POLICY IF EXISTS "Partners can view own profile" ON partner_profiles;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;

-- Enable RLS on all tables if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for USERS table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

CREATE POLICY "Admins can update users" ON users
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Create comprehensive policies for PARTNER_PROFILES table
CREATE POLICY "Partners can view own profile" ON partner_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all partner_profiles" ON partner_profiles
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

CREATE POLICY "Admins can update partner_profiles" ON partner_profiles
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Create comprehensive policies for ORDERS table
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Admins can view all orders" ON orders
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

CREATE POLICY "Admins can update orders" ON orders
    FOR UPDATE USING (
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

-- Verify policies were created correctly
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

-- Test admin access (replace with actual admin user ID)
-- SELECT 'Testing admin access...' as status;
-- SELECT COUNT(*) as user_count FROM users;
-- SELECT COUNT(*) as partner_count FROM partner_profiles;
-- SELECT COUNT(*) as order_count FROM orders;
