-- RLS VISIBILITY TEST
-- This checks if unauthenticated users can see the stores (the RLS policy issue)

-- Test 1: Direct query (no RLS applied)
SELECT COUNT(*) as "Total approved active stores"
FROM partner_profiles
WHERE is_active = true AND partner_status = 'approved';

-- Test 2: Check if RLS policies exist and what they do
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'partner_profiles'
ORDER BY tablename, policyname;

-- Test 3: Check partner_products RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'partner_products'
ORDER BY tablename, policyname;

-- FIX: If RLS is still blocking, temporarily disable for testing
-- UNCOMMENT to test without RLS:
/*
ALTER TABLE partner_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE partner_products DISABLE ROW LEVEL SECURITY;
*/

-- FIX: Re-enable RLS after confirming it works
-- UNCOMMENT after testing:
/*
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_products ENABLE ROW LEVEL SECURITY;
*/
