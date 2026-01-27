-- Comprehensive fix for users table constraint issue
-- This script handles existing data that violates constraints

-- Step 1: First, let's see what data exists and identify problematic rows
-- You can run this query first to see what's wrong:
-- SELECT id, email, user_type FROM users WHERE user_type IS NULL OR user_type NOT IN ('user', 'partner', 'admin', 'pending');

-- Step 2: Create a backup of existing data (optional but recommended)
-- CREATE TABLE users_backup AS SELECT * FROM users;

-- Step 3: Fix existing data by updating invalid user_type values
-- Handle NULL values first
UPDATE users 
SET user_type = 'user' 
WHERE user_type IS NULL;

-- Handle any other invalid values
UPDATE users 
SET user_type = 'user' 
WHERE user_type NOT IN ('user', 'partner', 'admin', 'pending');

-- Do the same for profiles table if it exists
UPDATE profiles 
SET user_type = 'user' 
WHERE user_type IS NULL;

UPDATE profiles 
SET user_type = 'user' 
WHERE user_type NOT IN ('user', 'partner', 'admin', 'pending');

-- Step 4: Now we can safely drop and recreate the constraint
-- Drop the existing check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;

-- Add the correct check constraint
ALTER TABLE users ADD CONSTRAINT users_user_type_check 
    CHECK (user_type IN ('user', 'partner', 'admin', 'pending'));

-- Do the same for profiles table
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_user_type_check 
    CHECK (user_type IN ('user', 'partner', 'admin', 'pending'));

-- Step 5: Verify the fix
-- You can run this to check if all data is now valid:
-- SELECT id, email, user_type FROM users WHERE user_type IS NULL OR user_type NOT IN ('user', 'partner', 'admin', 'pending');

-- Step 6: Insert sample data if needed
INSERT INTO users (id, email, full_name, user_type) 
SELECT '550e8400-e29b-41d4-a716-446655440001', 'admin@example.com', 'Admin User', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440001');

INSERT INTO users (id, email, full_name, user_type) 
SELECT '550e8400-e29b-41d4-a716-446655440002', 'partner@example.com', 'Partner User', 'partner'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440002');

INSERT INTO users (id, email, full_name, user_type) 
SELECT '550e8400-e29b-41d4-a716-446655440003', 'user@example.com', 'Regular User', 'user'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440003');

-- Step 7: Add comments
COMMENT ON CONSTRAINT users_user_type_check ON users IS 'Ensures user_type is one of: user, partner, admin, pending';
COMMENT ON CONSTRAINT profiles_user_type_check ON profiles IS 'Ensures user_type is one of: user, partner, admin, pending';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Users table constraint has been fixed successfully!';
    RAISE NOTICE 'Sample data has been inserted if it didn''t exist already.';
END $$;
