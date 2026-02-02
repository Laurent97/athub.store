-- Create test users first, then use their IDs for sample data

-- Insert test admin user
INSERT INTO public.users (
    id,
    email,
    full_name,
    user_type,
    email_verified
) VALUES (
    gen_random_uuid(),
    'admin@test.com',
    'Admin User',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert test customer user (using 'user' type since 'customer' is not in the constraint)
INSERT INTO public.users (
    id,
    email,
    full_name,
    user_type,
    email_verified
) VALUES (
    gen_random_uuid(),
    'customer@test.com',
    'Customer User',
    'user',
    true
) ON CONFLICT (email) DO NOTHING;

-- Get the test user IDs and create sample pending payments
-- This approach uses a CTE to get real user IDs

WITH test_admin AS (
    SELECT id FROM public.users WHERE email = 'admin@test.com' LIMIT 1
),
test_customer AS (
    SELECT id FROM public.users WHERE email = 'customer@test.com' LIMIT 1
)
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
) 
SELECT 
    'TEST-ORDER-001',
    test_customer.id,
    test_customer.email,
    test_customer.full_name,
    'paypal',
    100.00,
    'USD',
    test_customer.email,
    'TEST_TXN_123456',
    'pending_confirmation'
FROM test_customer
ON CONFLICT DO NOTHING;

WITH test_admin AS (
    SELECT id FROM public.users WHERE email = 'admin@test.com' LIMIT 1
),
test_customer AS (
    SELECT id FROM public.users WHERE email = 'customer@test.com' LIMIT 1
)
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
)
SELECT 
    'TEST-ORDER-002',
    test_customer.id,
    test_customer.email,
    test_customer.full_name,
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
FROM test_customer
ON CONFLICT DO NOTHING;
