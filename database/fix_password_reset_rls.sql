-- Fix RLS policies for password_reset_requests table
-- This allows users to create their own password reset requests

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Users can view own password reset requests" ON password_reset_requests;
DROP POLICY IF EXISTS "Admins can view all password reset requests" ON password_reset_requests;
DROP POLICY IF EXISTS "Admins can create password reset requests" ON password_reset_requests;
DROP POLICY IF EXISTS "Admins can update password reset requests" ON password_reset_requests;
DROP POLICY IF EXISTS "Users can update own password reset requests" ON password_reset_requests;

-- Create new policies that allow user self-service

-- Policy 1: Allow anyone to create password reset requests (for forgot password functionality)
CREATE POLICY "Allow password reset requests" ON password_reset_requests
    FOR INSERT WITH CHECK (true); -- Allow anyone to create requests

-- Policy 2: Users can view their own password reset requests
CREATE POLICY "Users can view own password reset requests" ON password_reset_requests
    FOR SELECT USING (
        auth.uid() = user_id OR -- User viewing their own
        EXISTS ( -- Admins can view all
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Policy 3: Users can update their own password reset requests (mark as used)
CREATE POLICY "Users can update own password reset requests" ON password_reset_requests
    FOR UPDATE USING (
        auth.uid() = user_id OR -- User updating their own
        EXISTS ( -- Admins can update all
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Policy 4: Admins can create password reset requests for any user
CREATE POLICY "Admins can create password reset requests" ON password_reset_requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON password_reset_requests TO authenticated;
GRANT SELECT, INSERT ON password_reset_requests TO anon; -- Allow anon to insert

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Password reset RLS policies updated successfully!';
    RAISE NOTICE 'Anyone can now create password reset requests';
    RAISE NOTICE 'Users can view and update their own requests';
    RAISE NOTICE 'Admins retain full access to manage all requests';
END $$;
