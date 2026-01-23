-- Debug script to check for orders
-- Run this in the Supabase SQL editor to debug order issues

-- Check if the specific order exists
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

-- Check all orders with similar pattern
SELECT 
    id,
    order_number,
    customer_id,
    total_amount,
    status,
    payment_status,
    created_at
FROM orders 
WHERE order_number LIKE 'ORD-176916%'
ORDER BY created_at DESC;

-- Check all orders (limit 10 for debugging)
SELECT 
    id,
    order_number,
    customer_id,
    total_amount,
    status,
    payment_status,
    created_at
FROM orders 
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any orders at all
SELECT COUNT(*) as total_orders FROM orders;

-- Check order items for a specific order (if it exists)
SELECT 
    oi.id,
    oi.order_id,
    oi.product_id,
    oi.quantity,
    oi.unit_price,
    oi.subtotal,
    p.title as product_title
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
WHERE oi.order_id = (SELECT id FROM orders WHERE order_number = 'ORD-1769169025411' LIMIT 1);
