-- Create Admin Products Table for Partner Store Management
-- This script creates a comprehensive product management system for admin dashboard

-- First, let's create a table that links products to partner stores
CREATE TABLE IF NOT EXISTS admin_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    selling_price DECIMAL(10,2) NOT NULL,
    profit_margin DECIMAL(5,2) DEFAULT 15.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_products_partner_id ON admin_products(partner_id);
CREATE INDEX IF NOT EXISTS idx_admin_products_product_id ON admin_products(product_id);
CREATE INDEX IF NOT EXISTS idx_admin_products_is_active ON admin_products(is_active);

-- Insert sample data for testing
INSERT INTO admin_products (id, partner_id, product_id, store_name, is_active, selling_price, profit_margin)
SELECT 
    gen_random_uuid(),
    (SELECT id FROM auth.users WHERE email LIKE '%partner%' LIMIT 1),
    (SELECT id FROM products WHERE title LIKE '%Brake Pad%' LIMIT 3),
    'Laurent Auto Parts',
    true,
    ROUND(p.original_price * 1.15, 2),
    15.00
);

-- Create a view for easy access to partner products
CREATE OR REPLACE VIEW admin_products_view AS
SELECT 
    ap.id,
    ap.partner_id,
    ap.store_name,
    ap.is_active,
    ap.selling_price,
    ap.profit_margin,
    p.id as product_id,
    p.title,
    p.make,
    p.model,
    p.images,
    p.description,
    p.stock_quantity,
    p.original_price,
    u.email as partner_email,
    u.first_name as partner_first_name,
    u.last_name as partner_last_name
FROM 
    admin_products ap
LEFT JOIN auth.users u ON ap.partner_id = u.id
LEFT JOIN products p ON ap.product_id = p.id
WHERE 
    ap.is_active = true;

-- Create a function to get products by partner
CREATE OR REPLACE FUNCTION get_admin_products_by_partner(p_partner_id UUID)
RETURNS TABLE (
    product_id UUID,
    title TEXT,
    make TEXT,
    model TEXT,
    images TEXT[],
    description TEXT,
    stock_quantity INTEGER,
    selling_price DECIMAL(10,2),
    original_price DECIMAL(10,2),
    store_name VARCHAR(255),
    is_active BOOLEAN,
    profit_margin DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ap.product_id,
        p.title,
        p.make,
        p.model,
        p.images,
        p.description,
        p.stock_quantity,
        ap.selling_price,
        ap.profit_margin,
        ap.store_name
    FROM 
        admin_products ap
        JOIN auth.users u ON ap.partner_id = u.id
        JOIN products p ON ap.product_id = p.id
    WHERE 
        ap.partner_id = p_partner_id
        AND ap.is_active = true;
END;
$$;

-- Create a function to update product status
CREATE OR REPLACE FUNCTION update_admin_product_status(
    p_product_id UUID,
    p_is_active BOOLEAN
) RETURNS VOID AS $$
BEGIN
    UPDATE admin_products 
    SET 
        is_active = p_is_active,
        updated_at = NOW()
    WHERE 
        product_id = p_product_id;
END;
$$;

-- Create a function to add products to partner store
CREATE OR REPLACE FUNCTION add_product_to_partner_store(
    p_partner_id UUID,
    p_product_ids UUID[],
    p_selling_price DECIMAL(10,2),
    p_profit_margin DECIMAL(5,2) DEFAULT 15.00
) RETURNS VOID AS $$
BEGIN
    -- Insert products into admin_products
    INSERT INTO admin_products (id, partner_id, product_id, store_name, is_active, selling_price, profit_margin, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        p_partner_id,
        UNNEST(p_product_ids) AS product_id
    FROM 
        unnest(p_product_ids) AS product_id
    CROSS JOIN products p ON p.id = product_id
        CROSS JOIN auth.users u ON u.email LIKE '%partner%'
        WHERE 
            p.is_active = true
        LIMIT 1;

    -- Update selling prices
    UPDATE admin_products ap
    SET 
        selling_price = ROUND(p.original_price * (1 + p_profit_margin / 100), 2),
        updated_at = NOW()
    FROM 
        admin_products ap
        JOIN products p ON ap.product_id = p.id
        WHERE 
            ap.product_id = ANY(UNNEST(p_product_ids))
            AND ap.is_active = true;
END;
$$;

-- Verification query
SELECT 
    'Admin Products Setup Complete' as section,
    COUNT(*) as total_products,
    COUNT(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_products,
    COUNT(CASE WHEN store_name IS NOT NULL THEN 1 ELSE 0 END) as products_with_store_names,
    AVG(selling_price) as avg_selling_price
    AVG(profit_margin) as avg_profit_margin
FROM 
    admin_products ap
LEFT JOIN auth.users u ON ap.partner_id = u.id
LEFT JOIN products p ON ap.product_id = p.id;
