-- Fix NULL user_id values in partner_profiles table
-- This script updates NULL user_ids to use the first available partner user

-- First, let's see which partner profiles have NULL user_ids
SELECT 
    'Profiles with NULL user_id' as issue,
    COUNT(*) as count,
    'partner_profiles' as table_name
FROM partner_profiles 
WHERE user_id IS NULL;

-- Update NULL user_ids to use the first available partner user
-- This assumes you have at least one partner user in your users table
UPDATE partner_profiles 
SET user_id = (
    SELECT id 
    FROM users 
    WHERE user_type = 'partner' 
    LIMIT 1
)
WHERE user_id IS NULL AND store_slug IN ('premium-auto-parts', 'german-motors', 'tokyo-car-imports', 'accessory-world');

-- Show the fixed records
SELECT 
    'Fixed partner_profiles' as result,
    COUNT(*) as fixed_count,
    'partner_profiles' as table_name
FROM partner_profiles 
WHERE user_id IS NOT NULL AND store_slug IN ('premium-auto-parts', 'german-motors', 'tokyo-car-imports', 'accessory-world');

-- Verify the fix
SELECT 
    'Remaining NULL user_ids' as check,
    COUNT(*) as count,
    'partner_profiles' as table_name
FROM partner_profiles 
WHERE user_id IS NULL;
