-- Check for orders with payment_status issues
SELECT 
  o.id,
  o.order_number,
  o.payment_status,
  o.status as order_status,
  pp.id as payment_id,
  pp.order_id as payment_order_id,
  pp.status as payment_status_pending,
  pp.payment_method,
  pp.amount
FROM orders o
LEFT JOIN pending_payments pp ON o.order_number = pp.order_id OR o.id = pp.order_id
WHERE o.payment_status = 'pending' 
  AND (pp.status = 'confirmed' OR pp.status = 'pending_confirmation')
ORDER BY o.created_at DESC
LIMIT 10;
