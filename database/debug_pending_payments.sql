-- Debug: Check if PayPal payments are being recorded
SELECT 
    id,
    order_id,
    customer_id,
    customer_email,
    customer_name,
    payment_method,
    amount,
    currency,
    paypal_email,
    paypal_transaction_id,
    status,
    created_at,
    updated_at
FROM pending_payments 
WHERE payment_method = 'paypal' 
ORDER BY created_at DESC;

-- Check all pending payments
SELECT 
    payment_method,
    COUNT(*) as count,
    MAX(created_at) as latest_payment
FROM pending_payments 
GROUP BY payment_method
ORDER BY payment_method;
