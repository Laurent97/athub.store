-- MINIMAL FIX: Just disable RLS and grant public access
-- Run this if other scripts don't work

-- Disable RLS on orders table only
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Grant public access
GRANT ALL ON orders TO PUBLIC;

-- Test it
SELECT 'Orders table RLS disabled' as status, COUNT(*) as count FROM orders LIMIT 1;

-- Success
SELECT 'PUBLIC ACCESS ENABLED' as result;
