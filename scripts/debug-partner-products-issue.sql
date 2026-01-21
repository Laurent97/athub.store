-- Debug script to investigate partner products issue
-- This script will help us understand why the Products dropdown is empty

-- First, let's check if we have any partner profiles
SELECT 
    'Partner Profiles' as table_name,
    COUNT(*) as count,
    STRING_AGG(DISTINCT store_name, ', ') as stores
FROM partner_profiles 
WHERE partner_status = 'approved';

-- Check if we have any products at all
SELECT 
    'Products' as table_name,
    COUNT(*) as count
FROM products 
WHERE is_active = true;

-- Check if we have any partner products
SELECT 
    'Partner Products' as table_name,
    COUNT(*) as count
FROM partner_products 
WHERE is_active = true;

-- Now let's see the actual data for a specific partner (Laurent store)
-- First get the partner ID for Laurent store
WITH laurent_partner AS (
    SELECT id, store_name 
    FROM partner_profiles 
    WHERE store_name ILIKE '%laurent%' OR store_slug = 'laurent-store'
    LIMIT 1
)
SELECT 
    'Laurent Partner Info' as info,
    id,
    store_name
FROM laurent_partner;

-- Check partner products for Laurent store using the exact query from the code
WITH laurent_partner AS (
    SELECT id 
    FROM partner_profiles 
    WHERE store_name ILIKE '%laurent%' OR store_slug = 'laurent-store'
    LIMIT 1
)
SELECT 
    'Laurent Partner Products (Exact Query)' as info,
    pp.*,
    p.id as product_id,
    p.title,
    p.sku,
    p.original_price,
    p.images,
    p.make,
    p.model,
    p.category,
    p.stock_quantity
FROM partner_products pp
LEFT JOIN products p ON pp.product_id = p.id
WHERE pp.partner_id = (SELECT id FROM laurent_partner)
AND pp.is_active = true;

-- Let's also check all partner products to see the structure
SELECT 
    'All Partner Products (Sample)' as info,
    pp.id as partner_product_id,
    pp.partner_id,
    pp.product_id,
    pp.selling_price,
    pp.is_active,
    pp.created_at,
    p.title as product_title,
    p.sku as product_sku,
    p.is_active as product_is_active
FROM partner_products pp
LEFT JOIN products p ON pp.product_id = p.id
LIMIT 10;

-- Check RLS policies that might be affecting the query
SELECT 
    'RLS Policies' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('partner_products', 'products', 'partner_profiles')
ORDER BY tablename, policyname;
