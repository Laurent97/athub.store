-- Check the actual structure of partner_profiles table
-- This will help us fix the category column error

-- Step 1: Show all columns in partner_profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'partner_profiles'
ORDER BY ordinal_position;

-- Step 2: Check if there's a category-related column
SELECT 
    'Category Column Check' as result,
    COUNT(*) as category_related_columns,
    STRING_AGG(column_name, ', ' ORDER BY column_name) as found_columns
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'partner_profiles'
    AND (
        column_name LIKE '%category%' 
        OR column_name LIKE '%store%'
        OR column_name LIKE '%business%'
        OR column_name LIKE '%type%'
    );

-- Step 3: Show sample data from partner_profiles
SELECT 
    'Sample Partner Data' as result,
    id,
    store_name,
    store_tagline,
    business_type,
    store_category,
    partner_status,
    is_active,
    created_at
FROM partner_profiles 
WHERE partner_status = 'approved' 
    AND is_active = true
LIMIT 3;

-- Step 4: Check if store_category exists
SELECT 
    'Store Category Column' as result,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'partner_profiles'
            AND column_name = 'store_category'
        ) THEN '✅ store_category exists'
        ELSE '❌ store_category missing'
    END as status;
