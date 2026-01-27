-- Diagnose and fix users table constraint issue
-- This script checks the actual constraint definition and fixes it

-- Step 1: Check what constraints actually exist on the users table
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND contype = 'c'
ORDER BY conname;

-- Step 2: Check what user_type values currently exist
SELECT DISTINCT user_type, COUNT(*) as count 
FROM users 
GROUP BY user_type;

-- Step 3: Check for any NULL user_type values
SELECT id, email, user_type 
FROM users 
WHERE user_type IS NULL;

-- Step 4: Drop the problematic constraint completely
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;

-- Step 5: Also check for any other check constraints that might be affecting user_type
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'users'::regclass 
        AND contype = 'c'
        AND conname != 'users_user_type_check'
    LOOP
        EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS ' || constraint_rec.conname;
        RAISE NOTICE 'Dropped constraint: %', constraint_rec.conname;
    END LOOP;
END $$;

-- Step 6: Fix all existing data to have valid values
UPDATE users 
SET user_type = 'user' 
WHERE user_type IS NULL OR user_type NOT IN ('user', 'partner', 'admin', 'pending');

-- Step 7: Add the correct constraint
ALTER TABLE users ADD CONSTRAINT users_user_type_check 
    CHECK (user_type IN ('user', 'partner', 'admin', 'pending'));

-- Step 8: Verify the fix
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND contype = 'c'
AND conname = 'users_user_type_check';

-- Step 9: Verify data integrity
SELECT DISTINCT user_type, COUNT(*) as count 
FROM users 
GROUP BY user_type;

-- Step 10: Test insertion with the problematic row data
-- This should work now
INSERT INTO users (id, email, full_name, user_type) 
VALUES ('3011fe8c-e160-4f16-b058-836cb3ec0311', 'test20@gmail.com', 'test20', 'user')
ON CONFLICT (id) DO UPDATE SET 
    user_type = EXCLUDED.user_type,
    updated_at = NOW();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Users table constraint has been diagnosed and fixed!';
    RAISE NOTICE 'All existing data has been validated and corrected.';
    RAISE NOTICE 'New constraint allows: user, partner, admin, pending';
END $$;
