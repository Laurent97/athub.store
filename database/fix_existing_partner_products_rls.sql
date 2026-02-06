-- Fix RLS policies for existing partner_products table
-- This will work with your actual table structure

-- Step 1: Check if table exists and show structure
SELECT 
    'Table Check' as result,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'partner_products'
        ) THEN '✅ Table exists'
        ELSE '❌ Table missing'
    END as status,
    'partner_products' as table_name;

-- Step 2: Show current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'partner_products'
ORDER BY ordinal_position;

-- Step 3: Enable RLS on existing table
ALTER TABLE partner_products ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies (if any)
DROP POLICY IF EXISTS "Public can view active partner products" ON partner_products;
DROP POLICY IF EXISTS "Authenticated users can view active partner products" ON partner_products;
DROP POLICY IF EXISTS "Partners can view own partner products" ON partner_products;
DROP POLICY IF EXISTS "Partners can insert own partner products" ON partner_products;
DROP POLICY IF EXISTS "Partners can update own partner products" ON partner_products;
DROP POLICY IF EXISTS "Admins can manage all partner products" ON partner_products;

-- Step 5: Create RLS policies for existing table structure
-- Policy 1: Public users can view active products
CREATE POLICY "Public can view active partner products" ON partner_products
    FOR SELECT USING (
        auth.role() = 'anon' 
        AND is_active = true
    );

-- Policy 2: Authenticated users can view active products
CREATE POLICY "Authenticated users can view active partner products" ON partner_products
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND is_active = true
    );

-- Policy 3: Partners can view their own products (using partner_id -> users relationship)
CREATE POLICY "Partners can view own partner products" ON partner_products
    FOR SELECT USING (
        auth.role() = 'authenticated'
        AND partner_id = auth.uid()
        AND is_active = true
    );

-- Policy 4: Partners can insert their own products
CREATE POLICY "Partners can insert own partner products" ON partner_products
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND partner_id = auth.uid()
    );

-- Policy 5: Partners can update their own products
CREATE POLICY "Partners can update own partner products" ON partner_products
    FOR UPDATE WITH CHECK (
        auth.role() = 'authenticated'
        AND partner_id = auth.uid()
    );

-- Policy 6: Admins can manage all partner products
CREATE POLICY "Admins can manage all partner products" ON partner_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Step 6: Grant necessary permissions
GRANT SELECT ON partner_products TO anon;
GRANT SELECT, INSERT, UPDATE ON partner_products TO authenticated;

-- Step 7: Add sample data (only if table is empty)
INSERT INTO partner_products (
    product_id,
    partner_id,
    profit_margin,
    selling_price,
    is_active,
    base_cost_price,
    markup_percentage,
    sku
)
SELECT 
    p.id as product_id,
    u.id as partner_id,
    20.00 as profit_margin,
    p.original_price * 1.2 as selling_price,
    true as is_active,
    p.original_price as base_cost_price,
    20.00 as markup_percentage,
    'PARTNER-' || UPPER(substring(md5(random()::text), 1, 8)) as sku
FROM products p
CROSS JOIN users u
WHERE p.is_active = true
    AND u.user_type = 'partner'
    AND NOT EXISTS (
        SELECT 1 FROM partner_products 
        LIMIT 1
    )
LIMIT 5;

-- Step 8: Verify table and data
SELECT 
    '✅ SUCCESS' as result,
    'partner_products RLS policies configured' as status,
    COUNT(*) as total_partner_products,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_products
FROM partner_products;

-- Step 9: Show sample data
SELECT 
    'Sample Partner Products' as result,
    pp.id,
    pp.sku,
    pp.profit_margin,
    pp.selling_price,
    pp.is_active,
    pp.created_at
FROM partner_products pp
ORDER BY pp.created_at DESC
LIMIT 3;
