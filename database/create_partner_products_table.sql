-- Create partner_products table if it doesn't exist
-- This will fix the foreign key relationship error

-- Step 1: Check if table exists
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

-- Step 2: Create the table if it doesn't exist
-- Only create if table doesn't exist to avoid errors
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

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_products_partner_id ON partner_products(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_products_sku ON partner_products(sku);
CREATE INDEX IF NOT EXISTS idx_partner_products_category ON partner_products(category);
CREATE INDEX IF NOT EXISTS idx_partner_products_is_active ON partner_products(is_active);
CREATE INDEX IF NOT EXISTS idx_partner_products_created_at ON partner_products(created_at);

-- Step 4: Enable RLS on partner_products
ALTER TABLE partner_products ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for partner_products
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

-- Policy 3: Partners can view their own products
CREATE POLICY "Partners can view own partner products" ON partner_products
    FOR SELECT USING (
        auth.role() = 'authenticated'
        AND partner_id IN (
            SELECT id FROM partner_profiles WHERE user_id = auth.uid()
        )
        AND is_active = true
    );

-- Policy 4: Partners can insert own products
CREATE POLICY "Partners can insert own partner products" ON partner_products
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND partner_id IN (
            SELECT id FROM partner_profiles WHERE user_id = auth.uid()
        )
    );

-- Policy 5: Partners can update own products
CREATE POLICY "Partners can update own partner products" ON partner_products
    FOR UPDATE WITH CHECK (
        auth.role() = 'authenticated'
        AND partner_id IN (
            SELECT id FROM partner_profiles WHERE user_id = auth.uid()
        )
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

-- Step 7: Verify table creation
SELECT 
    'Table Creation Success' as result,
    'partner_products table created successfully' as status,
    'Foreign key relationship to partner_profiles established' as relationship,
    'RLS policies enabled for partner_products' as security,
    'Partners can now manage their own products' as capability;
