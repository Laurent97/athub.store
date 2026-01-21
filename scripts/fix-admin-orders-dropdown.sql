-- Fix Admin Orders Page Dropdown Issue
-- This script fixes the dropdown functionality to properly display products from selected partner store

-- First, let's check the current orders table structure
SELECT 
    'Current Orders Table Structure' as section,
    column_name,
    data_type,
    is_nullable
    character_maximum_length
    ordinal_position
    column_default
    table_name,
    schema_name
    table_schema
FROM 
    information_schema.tables 
WHERE 
    table_name = 'orders';

-- Create a function to get orders by partner store
CREATE OR REPLACE FUNCTION get_orders_by_partner(p_partner_id UUID)
RETURNS TABLE (
    order_id UUID,
    customer_id UUID,
    total_amount DECIMAL(10,2),
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    partner_id UUID,
    customer_first_name TEXT,
    customer_last_name TEXT,
    customer_email TEXT,
    shipping_address JSONB,
    billing_address JSONB,
    product_details JSONB,
    payment_status VARCHAR(50),
    payment_method VARCHAR(100),
    notes TEXT
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.customer_id,
        o.total_amount,
        o.status,
        o.created_at,
        o.updated_at,
        o.partner_id,
        o.customer_first_name,
        o.customer_last_name,
        o.customer_email,
        o.shipping_address,
        o.billing_address,
        o.product_details,
        o.payment_status,
        o.payment_method,
        o.notes
    FROM 
        orders o
    WHERE 
        o.partner_id = p_partner_id
    ORDER BY 
        o.created_at DESC;
END;
$$;

-- Create a function to get products for order
CREATE OR REPLACE FUNCTION get_order_products(p_order_id UUID)
RETURNS TABLE (
    product_id UUID,
    title TEXT,
    make TEXT,
    model TEXT,
    images TEXT[],
    description TEXT,
    quantity INTEGER,
    unit_price DECIMAL(10,2),
    subtotal DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oi.product_id,
        p.title,
        p.make,
        p.model,
        p.images,
        p.description,
        oi.quantity,
        oi.unit_price,
        oi.subtotal
    FROM 
        order_items oi
        JOIN products p ON oi.product_id = p.id
    WHERE 
        oi.order_id = p_order_id;
END;
$$;

-- Create a view for orders with product details
CREATE OR REPLACE VIEW order_details_view AS
SELECT 
    o.id,
    o.customer_id,
    o.total_amount,
    o.status,
    o.created_at,
    o.updated_at,
    o.partner_id,
    o.customer_first_name,
    o.customer_last_name,
    o.customer_email,
    o.shipping_address,
    o.billing_address,
    o.product_details,
    o.payment_status,
    o.payment_method,
    o.notes,
    c.first_name,
    c.last_name,
    c.email,
    p.title,
    p.make,
    p.model,
    p.images,
    p.description,
    p.stock_quantity,
    p.original_price,
    u.email as partner_email,
    u.first_name as partner_first_name,
    u.last_name as partner_last_name,
    ap.store_name,
    ap.is_active,
    ap.selling_price,
    ap.profit_margin
FROM 
    order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    JOIN admin_products ap ON ap.product_id = p.id
    JOIN auth.users u ON o.customer_id = u.id
    LEFT JOIN partner_profiles pr ON o.partner_id = pr.user_id
    LEFT JOIN partner_shopping_carts psc ON psci.cart_id = o.id
    LEFT JOIN partner_shopping_cart_items psci ON psci.cart_id = psc.id
    LEFT JOIN partner_shopping_carts psc2 ON psci2.cart_id = psc.id
    LEFT JOIN auth.users u2 ON psc2.customer_id = u2.id
    WHERE 
        o.partner_id = p_partner_id
        AND o.status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')
    ORDER BY 
        o.created_at DESC;

-- Create a function to get orders by partner
CREATE OR REPLACE FUNCTION get_orders_by_partner(p_partner_id UUID)
RETURNS TABLE (
    order_id UUID,
    customer_id UUID,
    total_amount DECIMAL(10,2),
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    partner_id UUID,
    customer_first_name TEXT,
    customer_last_name TEXT,
    customer_email TEXT,
    shipping_address JSONB,
    billing_address JSONB,
    product_details JSONB,
    payment_status VARCHAR(50),
    payment_method VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.customer_id,
        o.total_amount,
        o.status,
        o.created_at,
        o.updated_at,
        o.partner_id,
        o.customer_first_name,
        o.customer_last_name,
        o.customer_email,
        o.shipping_address,
        o.billing_address,
        o.product_details,
        o.payment_status,
        o.payment_method,
        o.notes,
        c.first_name,
        c.last_name,
        c.email,
        p.title,
        p.make,
        p.model,
        p.images,
        p.description,
        p.stock_quantity,
        p.original_price,
        u.email as partner_email,
        u.first_name as partner_first_name,
        u.last_name as partner_last_name,
        ap.store_name,
        ap.is_active,
        ap.selling_price,
        ap.profit_margin
    FROM 
        order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        JOIN admin_products ap ON ap.product_id = p.id
        JOIN auth.users u ON o.customer_id = u.id
        LEFT JOIN partner_profiles pr ON o.partner_id = pr.user_id
        LEFT JOIN partner_shopping_carts psc ON psci.cart_id = o.id
        LEFT JOIN partner_shopping_cart_items psci ON psci.cart_id = psc.id
        LEFT JOIN partner_shopping_carts psc2 ON psci2.cart_id = psc.id
        LEFT JOIN auth.users u2 ON psc2.customer_id = u2.id
    WHERE 
        o.partner_id = p_partner_id
        AND o.status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')
    ORDER BY 
        o.created_at DESC;
END;
$$;

-- Create a function to get available products for partner
CREATE OR REPLACE FUNCTION get_available_products_for_partner(p_partner_id UUID)
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

-- Verification query
SELECT 
    'Admin Orders Fix Verification' as section,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled') THEN 1 ELSE 0 END) as orders_with_status,
    COUNT(CASE WHEN partner_id IS NOT NULL THEN 1 ELSE 0 END) as orders_with_partner,
    COUNT(CASE WHEN partner_store_name IS NOT NULL THEN 1 ELSE 0 END) as orders_with_store_names,
    AVG(total_amount) as avg_order_value
FROM 
    orders o
    LEFT JOIN auth.users u ON o.customer_id = u.id
    LEFT JOIN partner_profiles pr ON o.partner_id = pr.user_id;
