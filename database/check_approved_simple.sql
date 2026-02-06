-- Simple check for approved partners (no pg_policy table dependency)

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

-- Check if RLS is enabled
SELECT 
    'RLS Status' as metric,
    relrowsecurity as status
FROM pg_class 
WHERE relname = 'partner_profiles';
