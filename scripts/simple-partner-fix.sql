-- Simple Partner Fix - Update NULL user_ids with existing partner user
-- This avoids foreign key issues by using existing valid user

-- First, identify the existing partner user (mimi-store works)
SELECT 'Existing working partner user' as info, id, email, full_name
FROM users 
WHERE email = 'contact@mimi-store.com' OR user_type = 'partner' LIMIT 1;

-- Update NULL user_ids to use the existing partner user temporarily
-- This allows all stores to work while you create proper user accounts later
UPDATE partner_profiles 
SET user_id = (
    SELECT id 
    FROM users 
    WHERE user_type = 'partner' 
    LIMIT 1
)
WHERE user_id IS NULL AND store_slug IN ('premium-auto-parts', 'german-motors', 'tokyo-car-imports', 'accessory-world');

-- Show the updated profiles
SELECT 
    'Updated partner profiles' as result,
    store_slug,
    user_id,
    store_name,
    is_active,
    partner_status
FROM partner_profiles 
WHERE store_slug IN ('premium-auto-parts', 'german-motors', 'tokyo-car-imports', 'accessory-world');

-- Verify no more NULL user_ids
SELECT 
    'Remaining NULL user_ids' as check,
    COUNT(*) as count,
    'partner_profiles' as table_name
FROM partner_profiles 
WHERE user_id IS NULL;
