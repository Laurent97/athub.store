-- Check if there are any approved partners in the database
-- This will help diagnose why manufacturers page shows no stores

-- Count total partners
SELECT 
    'Total Partners' as metric,
    COUNT(*) as count
FROM partner_profiles;

-- Count approved partners
SELECT 
    'Approved Partners' as metric,
    COUNT(*) as count
FROM partner_profiles 
WHERE partner_status = 'approved';

-- Count active approved partners
SELECT 
    'Active & Approved Partners' as metric,
    COUNT(*) as count
FROM partner_profiles 
WHERE partner_status = 'approved' AND is_active = true;

-- Show sample of approved partners
SELECT 
    'Sample Approved Partners' as metric,
    id,
    store_name,
    store_slug,
    partner_status,
    is_active,
    created_at
FROM partner_profiles 
WHERE partner_status = 'approved' AND is_active = true
LIMIT 5;

-- Check RLS policies on partner_profiles
SELECT 
    'Current RLS Policies' as metric,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'partner_profiles'
ORDER BY policyname;
