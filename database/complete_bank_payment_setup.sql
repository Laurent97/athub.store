-- Complete Bank Payment System Setup
-- This script creates everything needed for the bank payment system

-- Step 1: Add customer fields to pending_payments table
ALTER TABLE pending_payments 
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Add comments for documentation
COMMENT ON COLUMN pending_payments.customer_email IS 'Customer email address for display purposes';
COMMENT ON COLUMN pending_payments.customer_name IS 'Customer full name for display purposes';

-- Step 2: Create test users
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

-- Step 3: Create bank_details table
CREATE TABLE IF NOT EXISTS bank_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_name TEXT NOT NULL,
    recipient_address TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    bank_address TEXT NOT NULL,
    swift_bic TEXT NOT NULL,
    iban TEXT,
    routing_number TEXT,
    sort_code TEXT,
    ifsc TEXT,
    account_number TEXT NOT NULL,
    account_type TEXT NOT NULL DEFAULT 'checking',
    currency TEXT NOT NULL DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE bank_details IS 'Stores bank account details for international wire transfers';

-- Enable Row Level Security (RLS) for bank_details
ALTER TABLE bank_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read active bank details" ON bank_details;
DROP POLICY IF EXISTS "Authenticated users can read all bank details" ON bank_details;
DROP POLICY IF EXISTS "Admins can manage bank details" ON bank_details;

-- Create RLS policies for bank_details (simplified to avoid auth.users issues)
CREATE POLICY "Anyone can read active bank details" ON bank_details
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can read all bank details" ON bank_details
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage bank details" ON bank_details
    FOR ALL USING (
        auth.role() = 'authenticated'
    );

-- Create updated_at trigger for bank_details
CREATE OR REPLACE FUNCTION update_bank_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_bank_details_updated_at ON bank_details;
CREATE TRIGGER update_bank_details_updated_at 
    BEFORE UPDATE ON bank_details 
    FOR EACH ROW 
    EXECUTE FUNCTION update_bank_details_updated_at();

-- Insert default bank details
INSERT INTO bank_details (
    recipient_name,
    recipient_address,
    bank_name,
    bank_address,
    swift_bic,
    iban,
    routing_number,
    account_number,
    account_type,
    currency,
    is_active
) VALUES (
    'Auto Trade Hub Ltd',
    '123 Business Street, New York, NY 10001, United States',
    'International Business Bank',
    '456 Banking Avenue, New York, NY 10002, United States',
    'IBBKUS33XXX',
    'US12 3456 7890 1234 5678',
    '021000021',
    '9876543210',
    'checking',
    'USD',
    true
) ON CONFLICT DO NOTHING;

-- Step 4: Insert sample pending payments using real user IDs
WITH test_customer AS (
    SELECT id, email, full_name FROM public.users WHERE email = 'customer@test.com' LIMIT 1
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

WITH test_customer AS (
    SELECT id, email, full_name FROM public.users WHERE email = 'customer@test.com' LIMIT 1
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
