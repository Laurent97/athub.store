-- Insert test order for debugging
-- This will create the specific order you're trying to access

-- First, check if any users exist
SELECT id, email, full_name FROM users LIMIT 5;

-- If no users exist, create a test user first
INSERT INTO users (
    id,
    email,
    full_name,
    user_type,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'testuser@example.com',
    'Test User',
    'customer',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Get the user ID for our test order
DO $$
DECLARE
    user_uuid UUID;
    order_exists BOOLEAN;
BEGIN
    -- Try to find an existing user first
    SELECT id INTO user_uuid FROM users WHERE email = 'testuser@example.com' LIMIT 1;
    
    -- If no test user found, try any user
    IF user_uuid IS NULL THEN
        SELECT id INTO user_uuid FROM users LIMIT 1;
    END IF;
    
    -- If still no user found, we can't proceed
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'No users found in database. Please create a user first.';
    END IF;
    
    RAISE NOTICE 'Using user ID: %', user_uuid;
    
    -- Check if order already exists
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = 'ORD-1769169025411') INTO order_exists;
    
    IF order_exists THEN
        RAISE NOTICE 'Order ORD-1769169025411 already exists, updating...';
    END IF;
    
    -- Insert or update the specific order you're trying to access
    INSERT INTO orders (
        order_number,
        customer_id,
        total_amount,
        status,
        payment_status,
        payment_method,
        shipping_address,
        billing_address,
        notes
    ) VALUES (
        'ORD-1769169025411',
        user_uuid,
        99.99,
        'pending',
        'pending',
        'wallet',
        '{"full_name": "Test User", "address_line_1": "123 Test Street", "address_line_2": "", "city": "Test City", "state": "TS", "postal_code": "12345", "country": "United States", "phone": "+1234567890"}',
        '{"full_name": "Test User", "address_line_1": "123 Test Street", "address_line_2": "", "city": "Test City", "state": "TS", "postal_code": "12345", "country": "United States", "phone": "+1234567890"}',
        'Test order for debugging purposes'
    ) ON CONFLICT (order_number) DO UPDATE SET
        customer_id = EXCLUDED.customer_id,
        total_amount = EXCLUDED.total_amount,
        status = EXCLUDED.status,
        payment_status = EXCLUDED.payment_status,
        payment_method = EXCLUDED.payment_method,
        shipping_address = EXCLUDED.shipping_address,
        billing_address = EXCLUDED.billing_address,
        notes = EXCLUDED.notes;
    
    RAISE NOTICE 'Order ORD-1769169025411 inserted/updated successfully';
END $$;

-- Verify the order was inserted
SELECT 
    id,
    order_number,
    customer_id,
    total_amount,
    status,
    payment_status,
    created_at
FROM orders 
WHERE order_number = 'ORD-1769169025411';

-- Insert some sample order items
DO $$
DECLARE
    order_uuid UUID;
    product_uuid UUID;
BEGIN
    -- Get the order ID
    SELECT id INTO order_uuid FROM orders WHERE order_number = 'ORD-1769169025411';
    
    IF order_uuid IS NULL THEN
        RAISE EXCEPTION 'Order not found, cannot insert items';
    END IF;
    
    -- Try to find an existing product
    SELECT id INTO product_uuid FROM products LIMIT 1;
    
    IF product_uuid IS NULL THEN
        -- Create a test product if none exists
        INSERT INTO products (
            id,
            title,
            description,
            price,
            category,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'Test Product',
            'A test product for order debugging',
            99.99,
            'test',
            NOW(),
            NOW()
        ) ON CONFLICT DO NOTHING;
        
        -- Get the product ID
        SELECT id INTO product_uuid FROM products WHERE title = 'Test Product' LIMIT 1;
    END IF;
    
    IF product_uuid IS NOT NULL THEN
        -- Insert sample order items
        INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            unit_price
        ) VALUES 
        (
            order_uuid,
            product_uuid,
            1,
            99.99
        )
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Order items inserted for order %', order_uuid;
    ELSE
        RAISE NOTICE 'No products found, skipping order items insertion';
    END IF;
END $$;

-- Check the final result
SELECT 
    o.id,
    o.order_number,
    o.customer_id,
    u.email as customer_email,
    o.total_amount,
    o.status,
    o.payment_status,
    oi.quantity,
    oi.unit_price,
    oi.subtotal,
    p.title as product_title
FROM orders o
LEFT JOIN users u ON o.customer_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.order_number = 'ORD-1769169025411';
