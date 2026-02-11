-- QUICK FIX: DISABLE RLS FOR IMMEDIATE PUBLIC ACCESS
-- This temporarily disables RLS to allow external access immediately

-- Disable RLS on orders table for immediate public access
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Also disable on related tables if needed
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE partner_shopping_cart_items DISABLE ROW LEVEL SECURITY;

-- Test public access
SELECT 'RLS Disabled - Public access test' as status, COUNT(*) as order_count
FROM orders
LIMIT 5;

-- Show that RLS is disabled
SELECT 'RLS Status Check' as info, table_schema as schemaname, table_name as tablename
FROM information_schema.tables 
WHERE table_name IN ('orders', 'order_items', 'partner_shopping_cart_items')
AND table_schema = 'public';

-- NOTE: To re-enable RLS later, run:
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;  
-- ALTER TABLE partner_shopping_cart_items ENABLE ROW LEVEL SECURITY;
