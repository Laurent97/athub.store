-- Final Partner Fix - Create Separate Users for Each Store
-- This creates unique user accounts for each partner store to avoid constraint violations

-- Create user accounts for each partner store
INSERT INTO public.users (
    id,
    email,
    full_name,
    user_type,
    created_at,
    updated_at
) VALUES 
-- Premium Auto Parts User
(
    gen_random_uuid(),
    'admin@premium-auto-parts.com',
    'Premium Auto Parts Admin',
    'partner',
    NOW(),
    NOW()
),
-- German Motors User
(
    gen_random_uuid(),
    'admin@german-motors.com',
    'German Motors Admin',
    'partner',
    NOW(),
    NOW()
),
-- Tokyo Car Imports User
(
    gen_random_uuid(),
    'admin@tokyo-car-imports.com',
    'Tokyo Car Imports Admin',
    'partner',
    NOW(),
    NOW()
),
-- Accessory World User
(
    gen_random_uuid(),
    'admin@accessory-world.com',
    'Accessory World Admin',
    'partner',
    NOW(),
    NOW()
);

-- Update partner_profiles with the new user IDs
UPDATE partner_profiles 
SET user_id = CASE store_slug
    WHEN 'premium-auto-parts' THEN (SELECT id FROM users WHERE email = 'admin@premium-auto-parts.com')
    WHEN 'german-motors' THEN (SELECT id FROM users WHERE email = 'admin@german-motors.com')
    WHEN 'tokyo-car-imports' THEN (SELECT id FROM users WHERE email = 'admin@tokyo-car-imports.com')
    WHEN 'accessory-world' THEN (SELECT id FROM users WHERE email = 'admin@accessory-world.com')
    ELSE user_id
END
WHERE store_slug IN ('premium-auto-parts', 'german-motors', 'tokyo-car-imports', 'accessory-world');

-- Show the final results
SELECT 
    'Final partner profiles' as result,
    store_slug,
    user_id,
    store_name,
    is_active,
    partner_status
FROM partner_profiles 
WHERE store_slug IN ('premium-auto-parts', 'german-motors', 'tokyo-car-imports', 'accessory-world');

-- Verify no more NULL user_ids
SELECT 
    'Final verification' as check,
    COUNT(*) as count,
    'partner_profiles' as table_name
FROM partner_profiles 
WHERE user_id IS NULL;
