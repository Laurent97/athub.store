-- Temporary fix: Disable RLS for password_reset_requests table
-- Run this in Supabase SQL Editor to fix the immediate issue

ALTER TABLE password_reset_requests DISABLE ROW LEVEL SECURITY;

-- Grant permissions to all users
GRANT ALL ON password_reset_requests TO authenticated;
GRANT SELECT, INSERT ON password_reset_requests TO anon;

-- Note: This is a temporary solution
-- For production, you should re-enable RLS with proper policies:
-- ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;
-- Then run the fix_password_reset_rls.sql script
