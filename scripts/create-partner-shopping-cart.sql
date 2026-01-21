-- Create Partner Shopping Cart Table
-- This script creates a comprehensive cart system for partner products

-- First, let's create a partner_shopping_carts table
CREATE TABLE IF NOT EXISTS partner_shopping_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cart_name VARCHAR(255) NOT NULL DEFAULT 'Shopping Cart',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    total_items INTEGER DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create partner_shopping_cart_items table
CREATE TABLE IF NOT EXISTS partner_shopping_cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES partner_shopping_carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    partner_product_id UUID REFERENCES partner_products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_shopping_carts_partner_id ON partner_shopping_carts(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_shopping_carts_customer_id ON partner_shopping_carts(customer_id);
CREATE INDEX IF NOT EXISTS idx_partner_shopping_cart_items_cart_id ON partner_shopping_cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_partner_shopping_cart_items_product_id ON partner_shopping_cart_items(product_id);

-- Create a view for easy access to partner cart data
CREATE OR REPLACE VIEW partner_cart_view AS
SELECT 
    psci.id as cart_item_id,
    psci.cart_id,
    psci.product_id,
    psci.quantity,
    psci.unit_price,
    psci.subtotal,
    p.title as product_title,
    p.make as product_make,
    p.model as product_model,
    p.images as product_images,
    p.description as product_description,
    p.stock_quantity as product_stock,
    pp.selling_price as partner_selling_price,
    p.original_price as product_original_price,
    pr.store_name as partner_store_name
FROM 
    partner_shopping_cart_items psci
INNER JOIN products p ON psci.product_id = p.id
INNER JOIN partner_products pp ON psci.partner_product_id = pp.id
INNER JOIN partner_profiles pr ON psci.partner_id = pr.user_id;

-- Insert sample data for testing
INSERT INTO partner_shopping_carts (id, partner_id, customer_id, cart_name, status, total_items, total_amount)
SELECT 
    gen_random_uuid(),
    (SELECT id FROM auth.users WHERE email LIKE '%partner%' LIMIT 1),
    (SELECT id FROM auth.users WHERE email LIKE '%customer%' LIMIT 1),
    'Default Cart',
    'active',
    0,
    0.00;

-- Insert sample cart items
INSERT INTO partner_shopping_cart_items (id, cart_id, product_id, partner_product_id, quantity, unit_price, subtotal)
SELECT 
    gen_random_uuid(),
    psc.id,
    p.id,
    pp.id,
    1,
    pp.selling_price,
    pp.selling_price
FROM 
    partner_shopping_carts psc
INNER JOIN products p ON p.title LIKE '%Brake Pad%'
INNER JOIN partner_products pp ON p.id = pp.product_id
WHERE 
    psc.cart_name = 'Default Cart'
LIMIT 3;

-- Update cart totals
UPDATE partner_shopping_carts 
SET 
    total_items = (SELECT COUNT(*) FROM partner_shopping_cart_items WHERE cart_id = id),
    total_amount = (SELECT COALESCE(SUM(subtotal), 0) FROM partner_shopping_cart_items WHERE cart_id = id)
WHERE 
    cart_name = 'Default Cart';

-- Verification query
SELECT 
    'Partner Shopping Cart Setup Complete' as section,
    COUNT(*) as total_carts,
    COUNT(*) as total_cart_items,
    COUNT(CASE WHEN pr.store_name IS NOT NULL THEN 1 ELSE 0 END) as carts_with_store_names
FROM 
    partner_shopping_carts psc
LEFT JOIN partner_profiles pr ON psc.partner_id = pr.user_id;

-- Create function to get partner cart items
CREATE OR REPLACE FUNCTION get_partner_cart_items(p_partner_id UUID)
RETURNS TABLE (
    cart_id UUID,
    product_id UUID,
    quantity INTEGER,
    unit_price DECIMAL(10,2),
    subtotal DECIMAL(10,2),
    product_title TEXT,
    product_make TEXT,
    product_model TEXT,
    product_images TEXT[],
    product_description TEXT,
    partner_store_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        psci.cart_id,
        psci.product_id,
        psci.quantity,
        psci.unit_price,
        psci.subtotal,
        p.title,
        p.make,
        p.model,
        p.images,
        p.description,
        pr.store_name
    FROM 
        partner_shopping_cart_items psci
        JOIN partner_shopping_carts psc ON psci.cart_id = psc.id
        JOIN products p ON psci.product_id = p.id
        JOIN partner_products pp ON psci.partner_product_id = pp.id
        JOIN partner_profiles pr ON psci.partner_id = pr.user_id
    WHERE 
        psci.partner_id = p_partner_id
        AND psc.status = 'active';
END;
$$;
