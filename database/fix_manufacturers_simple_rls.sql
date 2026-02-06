-- Simple RLS Fix for Manufacturers Page
-- This creates basic policies without relying on pg_policy table

-- First, drop all existing policies on partner_profiles
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'partner_profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON partner_profiles', policy_record.policyname);
    END LOOP;
END $$;

-- Create simple policies for partner_profiles
-- Policy 1: Allow public to view approved partners
CREATE POLICY "Public can view approved partners" ON partner_profiles
    FOR SELECT USING (partner_status = 'approved' AND is_active = true);

-- Policy 2: Allow authenticated users to view their own profile
CREATE POLICY "Users can view own profile" ON partner_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Policy 3: Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON partner_profiles
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Policy 4: Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" ON partner_profiles
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Policy 5: Allow partners to update their own profile
CREATE POLICY "Partners can update own profile" ON partner_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON partner_profiles TO anon;
GRANT ALL ON partner_profiles TO authenticated;

-- Test query to verify it works
SELECT COUNT(*) as approved_count 
FROM partner_profiles 
WHERE partner_status = 'approved' AND is_active = true;
