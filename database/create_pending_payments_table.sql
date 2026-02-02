-- Create pending_payments table for storing payment verification requests
CREATE TABLE IF NOT EXISTS pending_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    customer_email TEXT,
    customer_name TEXT,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'crypto', 'wallet', 'bank')),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    
    -- PayPal fields
    paypal_email TEXT,
    paypal_transaction_id TEXT,
    
    -- Crypto fields
    crypto_address TEXT,
    crypto_transaction_id TEXT,
    crypto_type TEXT,
    
    -- Stripe card payment fields
    stripe_payment_method_id TEXT,
    card_last4 TEXT,
    card_brand TEXT,
    card_country TEXT,
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    
    -- Bank transfer fields
    bank_recipient_name TEXT,
    bank_name TEXT,
    bank_swift_bic TEXT,
    bank_account_number TEXT,
    bank_proof_url TEXT,
    bank_proof_description TEXT,
    bank_proof_filename TEXT,
    
    -- Status and tracking
    status TEXT DEFAULT 'pending_confirmation' CHECK (status IN ('pending_confirmation', 'verified', 'rejected')),
    admin_notes TEXT,
    confirmed_by TEXT,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE pending_payments IS 'Stores payment verification requests that require admin approval';
COMMENT ON COLUMN pending_payments.payment_method IS 'Payment method: stripe, paypal, crypto, wallet, or bank';
COMMENT ON COLUMN pending_payments.status IS 'Payment status: pending_confirmation, verified, or rejected';
COMMENT ON COLUMN pending_payments.bank_proof_url IS 'URL to uploaded payment proof document for bank transfers';
COMMENT ON COLUMN pending_payments.bank_proof_description IS 'Customer description of the bank transfer details';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_payments_status ON pending_payments(status);
CREATE INDEX IF NOT EXISTS idx_pending_payments_customer_id ON pending_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_order_id ON pending_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_payment_method ON pending_payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_pending_payments_created_at ON pending_payments(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE pending_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read pending payments" ON pending_payments;
DROP POLICY IF EXISTS "Anyone can insert pending payments" ON pending_payments;
DROP POLICY IF EXISTS "Admins can update pending payments" ON pending_payments;
DROP POLICY IF EXISTS "Admins can delete pending payments" ON pending_payments;

-- Create RLS policies
-- Allow anyone to read pending payments (for admin verification)
CREATE POLICY "Anyone can read pending payments" ON pending_payments
    FOR SELECT USING (true);

-- Allow anyone to insert pending payments (for payment forms)
CREATE POLICY "Anyone can insert pending payments" ON pending_payments
    FOR INSERT WITH CHECK (true);

-- Allow admins to update pending payments
CREATE POLICY "Admins can update pending payments" ON pending_payments
    FOR UPDATE USING (
        auth.role() = 'authenticated'
    );

-- Allow admins to delete pending payments
CREATE POLICY "Admins can delete pending payments" ON pending_payments
    FOR DELETE USING (
        auth.role() = 'authenticated'
    );

-- Create updated_at trigger
DROP FUNCTION IF EXISTS update_pending_payments_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION update_pending_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_pending_payments_updated_at ON pending_payments;
CREATE TRIGGER update_pending_payments_updated_at 
    BEFORE UPDATE ON pending_payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_pending_payments_updated_at();

-- Insert sample data for testing
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
    '00000000-0000-0000-0000-000000000000',
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
    '00000000-0000-0000-0000-000000000000',
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
