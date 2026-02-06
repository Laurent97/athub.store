-- Simple deployment of partner_products table without complex sample data
-- This will fix the foreign key relationship error immediately

-- Step 1: Create the table (safe to run multiple times)
CREATE TABLE IF NOT EXISTS partner_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    original_price DECIMAL(10,2) CHECK (original_price >= 0),
    cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
    images JSONB DEFAULT '[]'::jsonb,
    specifications JSONB DEFAULT '{}'::jsonb,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    min_order_quantity INTEGER DEFAULT 1 CHECK (min_order_quantity >= 1),
    weight DECIMAL(8,2) CHECK (weight >= 0),
    dimensions JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true NOT NULL,
    featured BOOLEAN DEFAULT false NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_partner_products_partner_id ON partner_products(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_products_sku ON partner_products(sku);
CREATE INDEX IF NOT EXISTS idx_partner_products_category ON partner_products(category);
CREATE INDEX IF NOT EXISTS idx_partner_products_is_active ON partner_products(is_active);
CREATE INDEX IF NOT EXISTS idx_partner_products_created_at ON partner_products(created_at);

-- Step 3: Enable RLS
ALTER TABLE partner_products ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies (safe to run multiple times)
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

-- Step 5: Grant permissions
GRANT SELECT ON partner_products TO anon;
GRANT SELECT, INSERT, UPDATE ON partner_products TO authenticated;

-- Step 6: Add simple sample data (only if table is empty)
INSERT INTO partner_products (
    partner_id, sku, name, description, category, price, original_price, 
    stock_quantity, images, specifications, is_active, featured, created_by
)
SELECT 
    pp.id as partner_id,
    'PARTNER-' || UPPER(substring(md5(random()::text), 1, 8)) as sku,
    'Premium Automotive Parts Kit' as name,
    'High-quality automotive parts for professional use' as description,
    '3' as category,
    199.99 as price,
    249.99 as original_price,
    25 as stock_quantity,
    '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop"]'::jsonb as images,
    '{"warranty": "2 years", "features": ["High quality", "Fast shipping"]}'::jsonb as specifications,
    true as is_active,
    false as featured,
    gen_random_uuid() as created_by
FROM partner_profiles pp
WHERE pp.partner_status = 'approved' 
    AND pp.is_active = true
    AND NOT EXISTS (
        SELECT 1 FROM partner_products 
        LIMIT 1
    )
LIMIT 3;

-- Step 7: Verify table creation and data
SELECT 
    '✅ SUCCESS' as result,
    'partner_products table created successfully' as status,
    COUNT(*) as total_partner_products,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_products
FROM partner_products;

-- Step 8: Show sample data
SELECT 
    'Sample Partner Products' as result,
    pp.id,
    pp.name,
    pp.category,
    pp.price,
    pp.stock_quantity,
    pp.is_active,
    pp.created_at
FROM partner_products pp
ORDER BY pp.created_at DESC
LIMIT 3;
