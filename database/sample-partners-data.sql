-- Sample Partner Data for Manufacturers Page
-- This script creates sample partner profiles to populate the manufacturers page

-- Insert sample partner profiles
INSERT INTO partner_profiles (
    id,
    user_id,
    store_name,
    store_slug,
    store_tagline,
    store_description,
    business_type,
    store_category,
    year_established,
    store_logo,
    store_banner,
    brand_color,
    accent_color,
    contact_email,
    contact_phone,
    website,
    country,
    city,
    timezone,
    business_hours,
    commission_rate,
    total_earnings,
    total_orders,
    rating,
    store_visits,
    is_active,
    partner_status,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    gen_random_uuid(),
    'AutoParts Pro',
    'autoparts-pro',
    'Premium Auto Parts Since 2010',
    'We specialize in high-quality OEM and aftermarket auto parts for all major vehicle brands. Our extensive inventory includes engine components, brake systems, suspension parts, and more.',
    'business',
    'premium_auto',
    2010,
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
    '#2563eb',
    '#10b981',
    'info@autopartspro.com',
    '+1-555-0123',
    'https://autopartspro.com',
    'US',
    'Detroit',
    'America/Detroit',
    '{"monday": {"open": "08:00", "close": "18:00"}, "tuesday": {"open": "08:00", "close": "18:00"}, "wednesday": {"open": "08:00", "close": "18:00"}, "thursday": {"open": "08:00", "close": "18:00"}, "friday": {"open": "08:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "15:00"}, "sunday": {"open": "", "close": ""}}',
    15,
    125000,
    450,
    4.8,
    12500,
    true,
    'approved',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    gen_random_uuid(),
    'Speed Performance',
    'speed-performance',
    'High-Performance Parts for Enthusiasts',
    'Your destination for high-performance automotive parts and accessories. We carry everything from turbochargers to exhaust systems for the serious car enthusiast.',
    'corporation',
    'performance',
    2015,
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
    '#dc2626',
    '#f59e0b',
    'sales@speedperformance.com',
    '+1-555-0124',
    'https://speedperformance.com',
    'US',
    'Los Angeles',
    'America/Los_Angeles',
    '{"monday": {"open": "09:00", "close": "19:00"}, "tuesday": {"open": "09:00", "close": "19:00"}, "wednesday": {"open": "09:00", "close": "19:00"}, "thursday": {"open": "09:00", "close": "19:00"}, "friday": {"open": "09:00", "close": "19:00"}, "saturday": {"open": "10:00", "close": "17:00"}, "sunday": {"open": "", "close": ""}}',
    18,
    89000,
    320,
    4.6,
    8900,
    true,
    'approved',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    gen_random_uuid(),
    'CarCare Essentials',
    'carcare-essentials',
    'Premium Car Care Products',
    'We provide premium car care products including waxes, polishes, interior cleaners, and detailing supplies. Keep your vehicle looking its best with our professional-grade products.',
    'llc',
    'care',
    2018,
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
    '#059669',
    '#0891b2',
    'hello@carcareessentials.com',
    '+1-555-0125',
    'https://carcareessentials.com',
    'CA',
    'Toronto',
    'America/Toronto',
    '{"monday": {"open": "08:30", "close": "17:30"}, "tuesday": {"open": "08:30", "close": "17:30"}, "wednesday": {"open": "08:30", "close": "17:30"}, "thursday": {"open": "08:30", "close": "17:30"}, "friday": {"open": "08:30", "close": "17:30"}, "saturday": {"open": "09:00", "close": "14:00"}, "sunday": {"open": "", "close": ""}}',
    12,
    45000,
    180,
    4.9,
    5600,
    true,
    'approved',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    gen_random_uuid(),
    'Auto Electronics Hub',
    'auto-electronics-hub',
    'Advanced Automotive Electronics',
    'Specializing in cutting-edge automotive electronics including GPS systems, car audio, security systems, and diagnostic tools. Upgrade your vehicle with the latest technology.',
    'partnership',
    'electronics',
    2012,
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
    '#7c3aed',
    '#ec4899',
    'info@autoelectronicshub.com',
    '+1-555-0126',
    'https://autoelectronicshub.com',
    'UK',
    'London',
    'Europe/London',
    '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "10:00", "close": "16:00"}, "sunday": {"open": "", "close": ""}}',
    20,
    156000,
    520,
    4.7,
    11200,
    true,
    'approved',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    gen_random_uuid(),
    'Tools & Equipment Plus',
    'tools-equipment-plus',
    'Professional Automotive Tools',
    'Your source for professional-grade automotive tools and equipment. From basic hand tools to advanced diagnostic equipment, we have everything mechanics need.',
    'individual',
    'tools',
    2016,
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
    '#ea580c',
    '#16a34a',
    'sales@toolsequipmentplus.com',
    '+1-555-0127',
    'https://toolsequipmentplus.com',
    'AU',
    'Sydney',
    'Australia/Sydney',
    '{"monday": {"open": "07:00", "close": "17:00"}, "tuesday": {"open": "07:00", "close": "17:00"}, "wednesday": {"open": "07:00", "close": "17:00"}, "thursday": {"open": "07:00", "close": "17:00"}, "friday": {"open": "07:00", "close": "17:00"}, "saturday": {"open": "08:00", "close": "12:00"}, "sunday": {"open": "", "close": ""}}',
    14,
    78000,
    290,
    4.5,
    7800,
    true,
    'approved',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    gen_random_uuid(),
    'Car Accessories World',
    'car-accessories-world',
    'Everything for Your Car Interior & Exterior',
    'Transform your vehicle with our extensive collection of car accessories. From floor mats and seat covers to exterior styling and lighting, we have it all.',
    'business',
    'accessories',
    2019,
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
    '#0891b2',
    '#6366f1',
    'info@caraccessoriesworld.com',
    '+1-555-0128',
    'https://caraccessoriesworld.com',
    'DE',
    'Berlin',
    'Europe/Berlin',
    '{"monday": {"open": "09:00", "close": "19:00"}, "tuesday": {"open": "09:00", "close": "19:00"}, "wednesday": {"open": "09:00", "close": "19:00"}, "thursday": {"open": "09:00", "close": "19:00"}, "friday": {"open": "09:00", "close": "19:00"}, "saturday": {"open": "10:00", "close": "18:00"}, "sunday": {"open": "11:00", "close": "16:00"}}',
    16,
    92000,
    380,
    4.4,
    9200,
    true,
    'approved',
    NOW(),
    NOW()
);

-- Create corresponding users for these partners
INSERT INTO users (
    id,
    email,
    full_name,
    user_type,
    partner_status,
    created_at,
    updated_at
) 
SELECT 
    pp.user_id,
    'partner' || pp.id || '@example.com',
    pp.store_name || ' Owner',
    'partner',
    'approved',
    NOW(),
    NOW()
FROM partner_profiles pp
WHERE pp.partner_status = 'approved'
AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = pp.user_id
);

-- Add some sample products for each partner
INSERT INTO partner_products (
    id,
    partner_id,
    name,
    description,
    category,
    price,
    original_price,
    in_stock,
    images,
    specifications,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    pp.id,
    CASE 
        WHEN pp.store_category = 'premium_auto' THEN 'Premium Brake Discs'
        WHEN pp.store_category = 'performance' THEN 'High-Performance Air Filter'
        WHEN pp.store_category = 'care' THEN 'Premium Car Wax Kit'
        WHEN pp.store_category = 'electronics' THEN 'GPS Navigation System'
        WHEN pp.store_category = 'tools' THEN 'Professional Socket Set'
        WHEN pp.store_category = 'accessories' THEN 'Premium Floor Mats'
        ELSE 'Auto Product'
    END,
    CASE 
        WHEN pp.store_category = 'premium_auto' THEN 'High-quality brake discs for superior stopping power and durability.'
        WHEN pp.store_category = 'performance' THEN 'High-flow air filter for improved engine performance.'
        WHEN pp.store_category = 'care' THEN 'Complete car wax kit for professional-grade shine and protection.'
        WHEN pp.store_category = 'electronics' THEN 'Advanced GPS navigation system with real-time traffic updates.'
        WHEN pp.store_category = 'tools' THEN 'Professional grade socket set with lifetime warranty.'
        WHEN pp.store_category = 'accessories' THEN 'Premium all-weather floor mats with custom fit.'
        ELSE 'Quality automotive product.'
    END,
    pp.store_category,
    CASE 
        WHEN pp.store_category = 'premium_auto' THEN 89.99
        WHEN pp.store_category = 'performance' THEN 45.99
        WHEN pp.store_category = 'care' THEN 34.99
        WHEN pp.store_category = 'electronics' THEN 299.99
        WHEN pp.store_category = 'tools' THEN 129.99
        WHEN pp.store_category = 'accessories' THEN 59.99
        ELSE 49.99
    END,
    CASE 
        WHEN pp.store_category = 'premium_auto' THEN 119.99
        WHEN pp.store_category = 'performance' THEN 59.99
        WHEN pp.store_category = 'care' THEN 44.99
        WHEN pp.store_category = 'electronics' THEN 399.99
        WHEN pp.store_category = 'tools' THEN 169.99
        WHEN pp.store_category = 'accessories' THEN 79.99
        ELSE 69.99
    END,
    true,
    '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"]',
    '{"brand": "' || pp.store_name || '", "warranty": "1 Year", "shipping": "Free"}',
    NOW(),
    NOW()
FROM partner_profiles pp
WHERE pp.partner_status = 'approved'
LIMIT 6;

-- Add store_id values for the partners
UPDATE partner_profiles 
SET store_id = 'STORE' || UPPER(substring(md5(id::text) from 1 for 8))
WHERE store_id IS NULL;

-- Add referral codes for some partners
UPDATE partner_profiles 
SET referral_code = UPPER(substring(replace(store_name, ' ', ''), 1, 6)) || '2025'
WHERE referral_code IS NULL
AND partner_status = 'approved';

-- Add invitation codes for some partners  
UPDATE partner_profiles 
SET invitation_code = UPPER(substring(replace(store_name, ' ', ''), 1, 5)) || 'INV'
WHERE invitation_code IS NULL
AND partner_status = 'approved';

RAISE NOTICE 'Sample partner data created successfully. % partners added.', 
    (SELECT COUNT(*) FROM partner_profiles WHERE partner_status = 'approved');
