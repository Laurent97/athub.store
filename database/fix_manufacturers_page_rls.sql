-- Fix RLS Policies for Manufacturers/Stores Page
-- This ensures public users can view approved partner profiles

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Public can view approved partners" ON partner_profiles;
DROP POLICY IF EXISTS "Partners can view own profile" ON partner_profiles;
DROP POLICY IF EXISTS "Admins can view all partner_profiles" ON partner_profiles;
DROP POLICY IF EXISTS "Admins can update all partner_profiles" ON partner_profiles;

-- Create clean policies for public access
-- Policy 1: Allow anonymous/public users to view approved partners
CREATE POLICY "Public can view approved partners" ON partner_profiles
    FOR SELECT USING (partner_status = 'approved' AND is_active = true);

-- Policy 2: Allow authenticated partners to view their own profile
CREATE POLICY "Partners can view own profile" ON partner_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Policy 3: Allow admins to view all partner profiles
CREATE POLICY "Admins can view all partner_profiles" ON partner_profiles
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Policy 4: Allow admins to update all partner profiles
CREATE POLICY "Admins can update all partner_profiles" ON partner_profiles
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Policy 5: Allow partners to update their own profile
CREATE POLICY "Partners can update own profile" ON partner_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT ON partner_profiles TO anon;
GRANT ALL ON partner_profiles TO authenticated;

-- Verify the policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    pg_get_exprdef(pg_policy.oid, pg_policy.qualid) AS policy_definition
FROM pg_policies 
JOIN pg_policy ON pg_policies.policyname = pg_policy.policyname
WHERE tablename = 'partner_profiles'
ORDER BY policyname;
