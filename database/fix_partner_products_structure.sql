-- Fix partner_products table to work with the existing code structure
-- This creates the correct relationship between partner_products and products tables

-- Step 1: Drop existing table if it has wrong structure
DROP TABLE IF EXISTS partner_products CASCADE;

-- Step 2: Create correct partner_products table that references products
CREATE TABLE IF NOT EXISTS partner_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    selling_price DECIMAL(10,2) CHECK (selling_price >= 0),
    profit_margin DECIMAL(5,2) DEFAULT 0.00 CHECK (profit_margin >= -100 AND profit_margin <= 100),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure unique partner-product combination
    UNIQUE(partner_id, product_id)
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_partner_products_partner_id ON partner_products(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_products_product_id ON partner_products(product_id);
CREATE INDEX IF NOT EXISTS idx_partner_products_is_active ON partner_products(is_active);

-- Step 4: Enable RLS
ALTER TABLE partner_products ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
DROP POLICY IF EXISTS "Public can view active partner products" ON partner_products;
DROP POLICY IF EXISTS "Authenticated users can view active partner products" ON partner_products;
DROP POLICY IF EXISTS "Partners can view own partner products" ON partner_products;
DROP POLICY IF EXISTS "Partners can insert own partner products" ON partner_products;
DROP POLICY IF EXISTS "Partners can update own partner products" ON partner_products;
DROP POLICY IF EXISTS "Admins can manage all partner products" ON partner_products;

CREATE POLICY "Public can view active partner products" ON partner_products
    FOR SELECT USING (
        auth.role() = 'anon' 
        AND is_active = true
    );

CREATE POLICY "Authenticated users can view active partner products" ON partner_products
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND is_active = true
    );

CREATE POLICY "Partners can view own partner products" ON partner_products
    FOR SELECT USING (
        auth.role() = 'authenticated'
        AND partner_id IN (
            SELECT id FROM partner_profiles WHERE user_id = auth.uid()
        )
        AND is_active = true
    );

CREATE POLICY "Partners can insert own partner products" ON partner_products
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND partner_id IN (
            SELECT id FROM partner_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Partners can update own partner products" ON partner_products
    FOR UPDATE WITH CHECK (
        auth.role() = 'authenticated'
        AND partner_id IN (
            SELECT id FROM partner_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all partner products" ON partner_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Step 6: Grant permissions
GRANT SELECT ON partner_products TO anon;
GRANT SELECT, INSERT, UPDATE ON partner_products TO authenticated;

-- Step 7: Add sample partner products for testing
-- This will add some existing products to partner inventories
INSERT INTO partner_products (partner_id, product_id, selling_price, profit_margin, is_active)
SELECT 
    pp.id as partner_id,
    p.id as product_id,
    p.original_price * 1.2 as selling_price,  -- 20% markup
    20.0 as profit_margin,
    true as is_active
FROM partner_profiles pp
CROSS JOIN products p
WHERE pp.partner_status = 'approved' 
    AND pp.is_active = true
    AND p.is_active = true
    AND p.original_price > 0
LIMIT 20;  -- Add 20 sample partner products

-- Step 8: Drop existing function and recreate the RPC function for getting partner products
DROP FUNCTION IF EXISTS get_partner_products(UUID);

CREATE OR REPLACE FUNCTION get_partner_products(p_partner_id UUID)
RETURNS TABLE (
    id UUID,
    partner_id UUID,
    product_id UUID,
    selling_price DECIMAL(10,2),
    profit_margin DECIMAL(5,2),
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    product JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.id,
        pp.partner_id,
        pp.product_id,
        pp.selling_price,
        pp.profit_margin,
        pp.is_active,
        pp.created_at,
        pp.updated_at,
        to_jsonb(p) as product
    FROM partner_products pp
    INNER JOIN products p ON pp.product_id = p.id
    WHERE pp.partner_id = p_partner_id
        AND pp.is_active = true
        AND p.is_active = true
    ORDER BY pp.created_at DESC;
END;
$$;

-- Step 9: Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_partner_products(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_partner_products(UUID) TO anon;

-- Step 10: Verify results
SELECT 
    '✅ SUCCESS' as result,
    'partner_products table created with correct structure' as status,
    COUNT(*) as total_partner_products,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
    COUNT(DISTINCT partner_id) as partners_with_products
FROM partner_products;

-- Step 11: Show sample data
SELECT 
    'Sample Partner Products' as result,
    pp.id,
    pp.partner_id,
    pp.product_id,
    pp.selling_price,
    pp.profit_margin,
    pp.is_active,
    p.title as product_title,
    p.category as product_category,
    p.original_price
FROM partner_products pp
INNER JOIN products p ON pp.product_id = p.id
ORDER BY pp.created_at DESC
LIMIT 5;
