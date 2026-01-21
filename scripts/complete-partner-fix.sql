-- Complete Partner Store Fix - Create Users and Update Profiles
-- This resolves the duplicate user_id constraint by creating separate users

-- Step 1: Create user accounts for each partner store
INSERT INTO public.users (
    id,
    email,
    full_name,
    user_type,
    created_at,
    updated_at
) VALUES 
-- Premium Auto Parts
(
    gen_random_uuid(),
    'contact@premium-auto-parts.com',
    'Premium Auto Parts Admin',
    'partner',
    NOW(),
    NOW()
),
-- German Motors  
(
    gen_random_uuid(),
    'contact@german-motors.com',
    'German Motors Admin',
    'partner',
    NOW(),
    NOW()
),
-- Tokyo Car Imports
(
    gen_random_uuid(),
    'contact@tokyo-car-imports.com',
    'Tokyo Car Imports Admin',
    'partner',
    NOW(),
    NOW()
),
-- Accessory World
(
    gen_random_uuid(),
    'contact@accessory-world.com',
    'Accessory World Admin',
    'partner',
    NOW(),
    NOW()
);

-- Step 2: Update partner_profiles with the new user IDs
UPDATE partner_profiles 
SET user_id = CASE store_slug
    WHEN 'premium-auto-parts' THEN (SELECT id FROM users WHERE email = 'contact@premium-auto-parts.com')
    WHEN 'german-motors' THEN (SELECT id FROM users WHERE email = 'contact@german-motors.com')
    WHEN 'tokyo-car-imports' THEN (SELECT id FROM users WHERE email = 'contact@tokyo-car-imports.com')
    WHEN 'accessory-world' THEN (SELECT id FROM users WHERE email = 'contact@accessory-world.com')
    ELSE user_id
END
WHERE store_slug IN ('premium-auto-parts', 'german-motors', 'tokyo-car-imports', 'accessory-world') AND user_id IS NULL;

-- Step 3: Show the results
SELECT 
    'Fixed partner profiles' as result,
    store_slug,
    user_id,
    store_name,
    is_active,
    partner_status
FROM partner_profiles 
WHERE store_slug IN ('premium-auto-parts', 'german-motors', 'tokyo-car-imports', 'accessory-world');

-- Step 4: Verify no more NULL user_ids
SELECT 
    'Remaining NULL user_ids' as check,
    COUNT(*) as count,
    'partner_profiles' as table_name
FROM partner_profiles 
WHERE user_id IS NULL;
