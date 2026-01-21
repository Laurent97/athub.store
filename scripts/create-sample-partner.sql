-- Create sample partner profile for testing
-- First, let's check if there's a user with partner type and use their ID
-- For now, we'll use a placeholder UUID that you should replace with an actual user ID

INSERT INTO public.partner_profiles (
    id,
    user_id,
    store_name,
    store_slug,
    logo_url,
    banner_url,
    description,
    contact_email,
    contact_phone,
    country,
    city,
    commission_rate,
    total_earnings,
    pending_balance,
    available_balance,
    store_visits,
    conversion_rate,
    total_orders,
    rating,
    is_active,
    partner_status,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440000'::UUID, -- Replace with actual user ID from your users table
    'Laurent Auto Parts',
    'laurent-store',
    'https://via.placeholder.com/150x150.png?text=Logo',
    'https://via.placeholder.com/800x300.png?text=Banner',
    'Premium auto parts and accessories store. We offer high-quality parts for all makes and models.',
    'contact@laurent-store.com',
    '+1-555-0123',
    'United States',
    'New York',
    15.00,
    12500.00,
    2500.00,
    10000.00,
    1250,
    12.5,
    45,
    4.5,
    true,
    'approved',
    NOW(),
    NOW()
) ON CONFLICT (store_slug) DO NOTHING;
