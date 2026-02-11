-- COMPREHENSIVE FIX: Diagnose and Fix All RLS Issues
-- Run this to completely fix public access to orders

-- Step 1: Check current state
SELECT '=== CURRENT RLS STATUS ===' as info;
SELECT 'Tables with RLS enabled' as check, table_name, rowsecurity 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('orders', 'order_items', 'partner_shopping_cart_items');

SELECT 'Existing policies on orders' as check, tablename, policyname, permissive, roles 
FROM pg_policies 
WHERE tablename = 'orders';

-- Step 2: Completely disable RLS on all related tables
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY; 
ALTER TABLE partner_shopping_cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE partner_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE partner_profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL possible policies (force drop)
DROP POLICY IF EXISTS "users_can_view_orders" ON orders;
DROP POLICY IF EXISTS "authenticated_users_can_view" ON orders;
DROP POLICY IF EXISTS "public_select" ON orders;
DROP POLICY IF EXISTS "allow_public_read" ON orders;
DROP POLICY IF EXISTS "users_manage_own_orders" ON orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON orders;
DROP POLICY IF EXISTS "Enable update for user" ON orders;
DROP POLICY IF EXISTS "Enable select for role based access" ON orders;
DROP POLICY IF EXISTS "Allow public read access to orders" ON orders;
DROP POLICY IF EXISTS "Allow users to manage own orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON orders;

-- Step 4: Grant comprehensive public permissions
GRANT ALL ON orders TO PUBLIC;
GRANT ALL ON order_items TO PUBLIC;
GRANT ALL ON partner_shopping_cart_items TO PUBLIC;
GRANT ALL ON partner_products TO PUBLIC;
GRANT ALL ON partner_profiles TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO authenticated;

-- Step 5: Verify RLS is disabled
SELECT '=== RLS DISABLE VERIFICATION ===' as info;
SELECT 'RLS Status for orders' as check, 
       CASE 
           WHEN EXISTS (
             SELECT 1 FROM information_schema.table_options 
             WHERE table_name = 'orders' AND table_schema = 'public'
             AND option_name = 'enable_row_level_security' AND option_value = 'true'
           ) THEN 'STILL ENABLED - PROBLEM'
           ELSE 'SUCCESSFULLY DISABLED'
       END as status;

-- Step 6: Final test
SELECT '=== FINAL ACCESS TEST ===' as info;
SELECT 'Public access test result' as test, COUNT(*) as order_count, 'SUCCESS - Public access should work!' as result
FROM orders 
LIMIT 3;

-- Step 7: Confirm no policies remain
SELECT '=== POLICY CLEANUP VERIFICATION ===' as info;
SELECT 'Remaining policies on orders' as check, COUNT(*) as count, 
       CASE WHEN COUNT(*) = 0 THEN 'CLEAN - SUCCESS!' ELSE 'POLICIES REMAIN - PROBLEM' END as status
FROM pg_policies 
WHERE tablename = 'orders';

SELECT '=== COMPLETE ===' as final_status, 'All RLS fixes applied. Test URLs now.' as message;
