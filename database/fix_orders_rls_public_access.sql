-- FIX ORDERS RLS FOR PUBLIC ACCESS
-- This script enables public access to orders table for external sharing

-- First, check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY tablename, policyname;

-- Drop existing restrictive policies (if they exist)
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON orders;

-- Create new policies that allow public access for viewing
-- Policy 1: Allow public read access (for external sharing)
CREATE POLICY "Allow public read access to orders" ON orders
    FOR SELECT USING (true);

-- Policy 2: Allow authenticated users to manage their own orders
CREATE POLICY "Allow users to manage own orders" ON orders
    FOR ALL USING (
        auth.uid() = customer_id
    );

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Test the policies
-- Test 1: Public access test (should work now)
SELECT 'Public access test' as test_name, COUNT(*) as count
FROM orders
LIMIT 1;

-- Test 2: Authenticated user access test
SELECT 'Authenticated access test' as test_name, COUNT(*) as count
FROM orders
WHERE customer_id = '00000000-0000-0000-0000-000000000000'::uuid
LIMIT 1;

-- Grant necessary permissions
GRANT SELECT ON orders TO anon;
GRANT SELECT ON orders TO authenticated;
GRANT ALL ON orders TO authenticated;

-- Test final access
SELECT 'Final access test' as test_name, COUNT(*) as count
FROM orders
LIMIT 5;

-- Show final policy status
SELECT 'Final RLS policies for orders' as info, schemaname, tablename, policyname, permissive, roles
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;
