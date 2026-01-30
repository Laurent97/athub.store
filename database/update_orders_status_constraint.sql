-- Update orders table to allow new statuses in the check constraint
-- This will allow 'in_transit' and 'out_for_delivery' statuses in the orders.status field

-- First, check the current constraint
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.orders'::regclass
  AND conname = 'orders_status_check';

-- Drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the updated constraint with new statuses
ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (
  status = ANY (
    array[
      'pending'::text,
      'waiting_confirmation'::text,
      'confirmed'::text,
      'processing'::text,
      'shipped'::text,
      'in_transit'::text,        -- New status
      'out_for_delivery'::text,   -- New status
      'delivered'::text,
      'completed'::text,
      'cancelled'::text
    ]
  )
);

-- Verify the new constraint was added
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.orders'::regclass
  AND conname = 'orders_status_check';

-- Test the constraint by trying to insert with new statuses (this should succeed)
-- You can run these tests to verify the constraint works:

-- Test with in_transit (should succeed)
-- INSERT INTO orders (order_number, customer_id, total_amount, status, shipping_address, payment_status)
-- VALUES ('TEST-001', '00000000-0000-0000-0000-000000000000', 100.00, 'in_transit', '{"address": "123 Test St"}', 'pending')
-- ON CONFLICT (order_number) DO NOTHING;

-- Test with out_for_delivery (should succeed)
-- INSERT INTO orders (order_number, customer_id, total_amount, status, shipping_address, payment_status)
-- VALUES ('TEST-002', '00000000-0000-0000-0000-000000000000', 200.00, 'out_for_delivery', '{"address": "456 Test Ave"}', 'pending')
-- ON CONFLICT (order_number) DO NOTHING;

-- Test with invalid status (should fail)
-- INSERT INTO orders (order_number, customer_id, total_amount, status, shipping_address, payment_status)
-- VALUES ('TEST-003', '00000000-0000-0000-0000-000000000000', 300.00, 'invalid_status', '{"address": "789 Test Blvd"}', 'pending');

-- Clean up test data
-- DELETE FROM orders WHERE order_number LIKE 'TEST-%';

-- Check current status distribution
SELECT 
  status,
  COUNT(*) as count
FROM orders 
GROUP BY status 
ORDER BY status;
