-- Debug the partner profiles query to see what's happening
-- This will help identify why approved partners aren't showing

-- Test the exact query the hook is using
SELECT 
    'Debug Query' as step,
    id,
    store_name,
    store_slug,
    partner_status,
    is_active,
    created_at,
    user_id
FROM partner_profiles 
WHERE 
    partner_status = 'approved' 
    AND is_active = true
    AND store_name IS NOT NULL
    AND store_slug IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Check if RLS is actually enabled
SELECT 
    'RLS Enabled' as status,
    relrowsecurity as rls_status
FROM pg_class 
WHERE relname = 'partner_profiles';

-- Check all policies on partner_profiles
SELECT 
    'Current Policies' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'partner_profiles'
ORDER BY policyname;
