-- Create separate user accounts for each partner store
-- This fixes the duplicate user_id constraint issue

-- Create user accounts for partner stores that need them
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

-- Show the created users
SELECT 
    'Created partner users' as result,
    id,
    email,
    full_name,
    user_type
FROM users 
WHERE email IN (
    'contact@premium-auto-parts.com',
    'contact@german-motors.com', 
    'contact@tokyo-car-imports.com',
    'contact@accessory-world.com'
);
