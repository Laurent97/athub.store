-- Insert test order for debugging
-- This will create the specific order you're trying to access

-- First, let's check if a user exists to associate with this order
SELECT id, email FROM users LIMIT 1;

-- If no user exists, we need to create one first or use an existing user ID
-- For now, let's try to insert the order with a placeholder user ID
-- You'll need to replace 'YOUR_USER_ID_HERE' with an actual user UUID from the users table

-- Insert the specific order you're trying to access
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
    '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
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
-- First get the order ID
DO $$
DECLARE
    order_uuid UUID;
BEGIN
    SELECT id INTO order_uuid FROM orders WHERE order_number = 'ORD-1769169025411';
    
    IF order_uuid IS NOT NULL THEN
        -- Insert sample order items
        INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            unit_price
        ) VALUES 
        (
            order_uuid,
            '00000000-0000-0000-0000-000000000001', -- Replace with actual product ID
            1,
            99.99
        )
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Order items inserted for order %', order_uuid;
    ELSE
        RAISE NOTICE 'Order not found, cannot insert items';
    END IF;
END $$;

-- Check the final result
SELECT 
    o.id,
    o.order_number,
    o.customer_id,
    o.total_amount,
    o.status,
    o.payment_status,
    oi.quantity,
    oi.unit_price,
    oi.subtotal
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.order_number = 'ORD-1769169025411';
