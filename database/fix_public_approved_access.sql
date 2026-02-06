-- Fix public access to approved partners
-- Add missing policy for regular authenticated users to view approved partners

-- Drop the existing public policy that might not be working correctly
DROP POLICY IF EXISTS "Public can view approved partners" ON partner_profiles;

-- Create a better public policy that allows anyone (including regular users) to view approved partners
CREATE POLICY "Public can view approved partners" ON partner_profiles
    FOR SELECT USING (
        partner_status = 'approved' 
        AND is_active = true
    );

-- Also ensure general authenticated user access
CREATE POLICY "Authenticated users can view approved partners" ON partner_profiles
    FOR SELECT USING (
        auth.role() = 'authenticated'
        AND partner_status = 'approved' 
        AND is_active = true
    );

-- Grant necessary permissions
GRANT SELECT ON partner_profiles TO anon;
GRANT SELECT ON partner_profiles TO authenticated;

-- Verify the fix
SELECT 
    'Policy Verification' as result,
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'partner_profiles'
    AND policyname LIKE '%approved%'
ORDER BY policyname;
