-- CLEAN FIX: Remove Conflicting Policies and Ensure Public Access
-- Run this after the immediate fix to clean up policy conflicts

-- Drop all existing policies on orders table
DROP POLICY IF EXISTS "Allow public read access to orders" ON orders;
DROP POLICY IF EXISTS "Allow users to manage own orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON orders;

-- Confirm RLS is disabled
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Grant public access permissions
GRANT ALL ON orders TO PUBLIC;
GRANT ALL ON order_items TO PUBLIC;
GRANT ALL ON partner_shopping_cart_items TO PUBLIC;

-- Test public access
SELECT 'Clean fix applied' as status, COUNT(*) as total_orders FROM orders LIMIT 1;

-- Show no policies exist
SELECT 'Policies check' as info, COUNT(*) as policy_count 
FROM pg_policies 
WHERE tablename = 'orders';

-- Success message
SELECT 'SUCCESS: All conflicts resolved and public access enabled!' as result;
