-- Check partner_profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'partner_profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check existing partner profiles
SELECT 
  id,
  store_name,
  user_id,
  created_at
FROM partner_profiles 
LIMIT 5;

-- Check users table for admin users
SELECT 
  id,
  email,
  user_type,
  created_at
FROM users 
WHERE user_type = 'admin'
LIMIT 5;
