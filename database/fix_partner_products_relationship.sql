-- Fix the partner_products table relationship issue
-- This script resolves the PGRST200 error about missing foreign key relationship

-- First, let's check what relationships currently exist
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'partner_products';

-- Check if partner_products table has the correct structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'partner_products' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if partner_profiles table exists and has the correct structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'partner_profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- If the foreign key doesn't exist, create it
-- This assumes partner_products has a partner_id column and partner_profiles has an id column
DO $$
BEGIN
    -- Check if the foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'partner_products_partner_id_fkey' 
        AND table_name = 'partner_products'
    ) THEN
        -- Add the foreign key constraint
        EXECUTE '
            ALTER TABLE partner_products 
            ADD CONSTRAINT partner_products_partner_id_fkey 
            FOREIGN KEY (partner_id) 
            REFERENCES partner_profiles(id) 
            ON DELETE CASCADE
        ';
        RAISE NOTICE 'Foreign key constraint added successfully';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- Verify the constraint was created
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'partner_products';
