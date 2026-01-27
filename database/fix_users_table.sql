-- Fix users table constraint issue
-- This script handles the user_type check constraint problem

-- First, let's check what constraints exist on the users table
-- If the table already exists with different constraints, we need to handle it

-- Drop the existing check constraint if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;

-- Add the correct check constraint
ALTER TABLE users ADD CONSTRAINT users_user_type_check 
    CHECK (user_type IN ('user', 'partner', 'admin', 'pending'));

-- Also check if there are any existing rows with invalid user_type values
-- Update any invalid user_type values to 'user'
UPDATE users 
SET user_type = 'user' 
WHERE user_type NOT IN ('user', 'partner', 'admin', 'pending');

-- Do the same for profiles table if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_user_type_check 
    CHECK (user_type IN ('user', 'partner', 'admin', 'pending'));

UPDATE profiles 
SET user_type = 'user' 
WHERE user_type NOT IN ('user', 'partner', 'admin', 'pending');

-- Now try to insert the sample data again
INSERT INTO users (id, email, full_name, user_type) 
SELECT '550e8400-e29b-41d4-a716-446655440001', 'admin@example.com', 'Admin User', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440001');

INSERT INTO users (id, email, full_name, user_type) 
SELECT '550e8400-e29b-41d4-a716-446655440002', 'partner@example.com', 'Partner User', 'partner'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440002');

INSERT INTO users (id, email, full_name, user_type) 
SELECT '550e8400-e29b-41d4-a716-446655440003', 'user@example.com', 'Regular User', 'user'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440003');

-- Comment on the constraint
COMMENT ON CONSTRAINT users_user_type_check ON users IS 'Ensures user_type is one of: user, partner, admin, pending';
COMMENT ON CONSTRAINT profiles_user_type_check ON profiles IS 'Ensures user_type is one of: user, partner, admin, pending';
