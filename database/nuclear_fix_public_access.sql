-- NUCLEAR OPTION: Complete Database Reset for Public Access
-- This completely removes ALL RLS and grants unrestricted access

-- Step 1: Remove ALL RLS from ALL existing tables
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE partner_shopping_cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE partner_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE partner_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_tax_payments DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop EVERY possible policy on orders
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'orders'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON orders', policy_record.policyname);
    END LOOP;
END $$;

-- Step 3: Drop policies on related tables too
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname, tablename
        FROM pg_policies 
        WHERE tablename IN ('order_items', 'partner_shopping_cart_items', 'partner_products', 'partner_profiles')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, policy_record.tablename);
    END LOOP;
END $$;

-- Step 4: Grant UNRESTRICTED access
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;

-- Step 5: Grant sequence access
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;

-- Step 6: Force refresh permissions
NOTIFY pgrst, 'reload schema';

-- Step 7: Verify complete removal
SELECT '=== NUCLEAR FIX APPLIED ===' as status;
SELECT 'Policies remaining on orders' as check, COUNT(*) as count FROM pg_policies WHERE tablename = 'orders';
SELECT 'RLS status on orders' as check, 
       CASE 
           WHEN EXISTS (
             SELECT 1 FROM pg_tables 
             WHERE schemaname = 'public' 
             AND tablename = 'orders'
             AND rowsecurity = true
           ) THEN 'STILL ENABLED'
           ELSE 'COMPLETELY DISABLED'
       END as rls_status;

-- Step 8: Test public access
SELECT 'Public access test' as test, COUNT(*) as accessible_orders FROM orders LIMIT 3;

SELECT 'NUCLEAR FIX COMPLETE - PUBLIC ACCESS ENABLED!' as result;
