-- Check if your admin user has the correct role
-- Run this in your Supabase SQL Editor

-- 1. Check current user and their role metadata
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users 
WHERE email = 'your-admin-email@example.com'; -- Replace with your admin email

-- 2. Check all users with admin role
SELECT 
    id,
    email,
    raw_user_meta_data->>'role' as user_role
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'admin';

-- 3. If no admin role exists, update your user
-- Uncomment and modify with your user ID
/*
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    raw_user_meta_data, 
    '{role}', 
    '"admin"'
)
WHERE email = 'your-admin-email@example.com';
*/

-- 4. Alternative: Create a function to check admin status
CREATE OR REPLACE FUNCTION is_admin_user() 
RETURNS BOOLEAN 
LANGUAGE sql 
SECURITY DEFINER
AS $$
  SELECT raw_user_meta_data->>'role' = 'admin' 
  FROM auth.users 
  WHERE id = auth.uid();
$$;
