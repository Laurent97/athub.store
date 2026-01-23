-- Debug queries for Realtime troubleshooting
-- Run these in Supabase SQL Editor

-- 1. Check if Realtime publication exists
SELECT 
    pubname,
    schemaname,
    tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- 2. Check table permissions
SELECT 
    schemaname,
    tablename,
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE tablename IN ('order_tracking', 'tracking_updates')
AND privilege_type = 'SELECT'
ORDER BY tablename, grantee;

-- 3. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('order_tracking', 'tracking_updates')
ORDER BY tablename, policyname;

-- 4. Test table access as different roles
-- Uncomment and run with appropriate user context
/*
SELECT COUNT(*) FROM order_tracking;
SELECT COUNT(*) FROM tracking_updates;
*/

-- 5. Check if tables have primary keys (required for Realtime)
SELECT 
    schemaname,
    tablename,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE tablename IN ('order_tracking', 'tracking_updates')
AND constraint_type = 'PRIMARY KEY';
