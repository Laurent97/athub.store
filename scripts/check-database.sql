-- Database Diagnostic Script
-- Run this to check current database state and identify issues

-- Check if tables exist
SELECT 
    'partner_profiles' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'partner_profiles'
    ) as exists
UNION ALL
SELECT 
    'partner_products' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'partner_products'
    ) as exists
UNION ALL
SELECT 
    'products' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'products'
    ) as exists
UNION ALL
SELECT 
    'users' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
    ) as exists;

-- Check if partner_profiles has data
SELECT 
    'partner_profiles_data' as check_name,
    COUNT(*) as record_count,
    'partner_profiles' as table_name
FROM partner_profiles
UNION ALL
SELECT 
    'partner_profiles_active' as check_name,
    COUNT(*) as record_count,
    'partner_profiles' as table_name
FROM partner_profiles 
WHERE is_active = true AND partner_status = 'approved';

-- Check users table for partner users
SELECT 
    'partner_users' as check_name,
    COUNT(*) as record_count,
    'users' as table_name
FROM users 
WHERE user_type = 'partner';

-- Show sample data from partner_profiles if it exists
-- Note: Remove this block if you don't want to see sample data
SELECT 
    'Sample partner_profiles data:' as info,
    id,
    user_id,
    store_name,
    store_slug,
    is_active,
    partner_status,
    created_at
FROM partner_profiles 
LIMIT 5;
