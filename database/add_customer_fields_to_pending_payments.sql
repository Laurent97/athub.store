-- Add customer fields to existing pending_payments table
ALTER TABLE pending_payments 
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Add comments for documentation
COMMENT ON COLUMN pending_payments.customer_email IS 'Customer email address for display purposes';
COMMENT ON COLUMN pending_payments.customer_name IS 'Customer full name for display purposes';

-- Update existing records with sample customer data if customer fields are null
UPDATE pending_payments 
SET 
    customer_email = CASE 
        WHEN customer_email IS NULL THEN 'test@example.com'
        ELSE customer_email
    END,
    customer_name = CASE 
        WHEN customer_name IS NULL THEN 'Test User'
        ELSE customer_name
    END
WHERE customer_email IS NULL OR customer_name IS NULL;

-- Insert sample data if table is empty (using a valid UUID format)
INSERT INTO pending_payments (
    order_id,
    customer_id,
    customer_email,
    customer_name,
    payment_method,
    amount,
    currency,
    paypal_email,
    paypal_transaction_id,
    status
) VALUES (
    'TEST-ORDER-001',
    '123e4567-89ab-cdef-0123-456789abcdef01',
    'test@example.com',
    'Test User',
    'paypal',
    100.00,
    'USD',
    'test@example.com',
    'TEST_TXN_123456',
    'pending_confirmation'
) ON CONFLICT DO NOTHING;

INSERT INTO pending_payments (
    order_id,
    customer_id,
    customer_email,
    customer_name,
    payment_method,
    amount,
    currency,
    bank_recipient_name,
    bank_name,
    bank_swift_bic,
    bank_account_number,
    bank_proof_description,
    bank_proof_filename,
    status
) VALUES (
    'TEST-ORDER-002',
    '123e4567-89ab-cdef-0123-456789abcdef02',
    'customer@example.com',
    'Customer Name',
    'bank',
    250.00,
    'USD',
    'Auto Trade Hub Ltd',
    'International Business Bank',
    'IBBKUS33XXX',
    '9876543210',
    'Transfer sent on Feb 2, transaction ID: TX789012345',
    'bank_receipt.jpg',
    'pending_confirmation'
) ON CONFLICT DO NOTHING;
