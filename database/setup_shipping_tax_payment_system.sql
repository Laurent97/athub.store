-- Shipping & Tax Payment System
-- This adds the ability for customers to pay shipping + tax fees after admin starts shipment
-- Partners have FREE shipping (no payment required)

-- =====================================================
-- PART 1: Extend orders table with shipping/tax payment fields
-- =====================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_tax_payment_status TEXT DEFAULT 'pending' 
  CHECK (shipping_tax_payment_status IN ('pending', 'pending_confirmation', 'verified', 'rejected', 'paid'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_tax_paid_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_shipping_tax_payment_status ON orders(shipping_tax_payment_status);

-- =====================================================
-- PART 2: Create shipping_tax_payments table
-- =====================================================

CREATE TABLE IF NOT EXISTS shipping_tax_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL,
    customer_email TEXT,
    
    -- Fee breakdown
    shipping_fee DECIMAL(10,2) NOT NULL,
    tax_fee DECIMAL(10,2) NOT NULL,
    
    -- Payment details
    payment_method TEXT CHECK (payment_method IN ('stripe', 'paypal', 'crypto', 'wallet', 'bank')),
    
    -- Payment method specific fields
    stripe_payment_intent_id TEXT,
    paypal_transaction_id TEXT,
    crypto_transaction_id TEXT,
    crypto_type TEXT,
    bank_transaction_reference TEXT,
    wallet_transaction_id TEXT,
    
    -- Card details (if Stripe)
    card_last4 TEXT,
    card_brand TEXT,
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    
    -- Bank details (if Bank transfer)
    bank_name TEXT,
    bank_swift_bic TEXT,
    bank_account_number TEXT,
    bank_proof_url TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pending_confirmation', 'verified', 'rejected', 'paid')),
    
    -- Admin confirmation
    confirmed_by UUID,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PART 3: Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_shipping_tax_payments_order_id ON shipping_tax_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_tax_payments_customer_id ON shipping_tax_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipping_tax_payments_status ON shipping_tax_payments(status);
CREATE INDEX IF NOT EXISTS idx_shipping_tax_payments_payment_method ON shipping_tax_payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_shipping_tax_payments_created_at ON shipping_tax_payments(created_at DESC);

-- =====================================================
-- PART 4: Enable RLS and create policies
-- =====================================================

ALTER TABLE shipping_tax_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can view their shipping tax payments" ON shipping_tax_payments;
DROP POLICY IF EXISTS "Customers can insert shipping tax payments" ON shipping_tax_payments;
DROP POLICY IF EXISTS "Admins can view all shipping tax payments" ON shipping_tax_payments;
DROP POLICY IF EXISTS "Admins can update shipping tax payments" ON shipping_tax_payments;

-- RLS Policies
-- Customers can view their own shipping tax payments
CREATE POLICY "Customers can view their shipping tax payments" ON shipping_tax_payments
    FOR SELECT USING (
        customer_id = auth.uid() OR auth.role() = 'service_role'
    );

-- Customers can insert shipping tax payments
CREATE POLICY "Customers can insert shipping tax payments" ON shipping_tax_payments
    FOR INSERT WITH CHECK (
        customer_id = auth.uid() OR auth.role() = 'service_role'
    );

-- Admins can view all shipping tax payments
CREATE POLICY "Admins can view all shipping tax payments" ON shipping_tax_payments
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.user_type = 'admin'
        )
    );

-- Admins can update shipping tax payments
CREATE POLICY "Admins can update shipping tax payments" ON shipping_tax_payments
    FOR UPDATE USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.user_type = 'admin'
        )
    );

-- =====================================================
-- PART 5: Create updated_at trigger
-- =====================================================

DROP FUNCTION IF EXISTS update_shipping_tax_payments_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION update_shipping_tax_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shipping_tax_payments_updated_at_trigger
BEFORE UPDATE ON shipping_tax_payments
FOR EACH ROW
EXECUTE FUNCTION update_shipping_tax_payments_updated_at();

-- =====================================================
-- PART 6: Add comments for documentation
-- =====================================================

COMMENT ON TABLE shipping_tax_payments IS 'Tracks shipping and tax fee payments that customers must complete after admin starts shipment';
COMMENT ON COLUMN shipping_tax_payments.shipping_fee IS 'Shipping cost charged to customer';
COMMENT ON COLUMN shipping_tax_payments.tax_fee IS 'Tax amount charged to customer';
COMMENT ON COLUMN shipping_tax_payments.status IS 'Payment status: pending, pending_confirmation (awaiting admin approval), verified, rejected, or paid';
COMMENT ON COLUMN shipping_tax_payments.confirmed_by IS 'UUID of admin who confirmed the payment';

-- =====================================================
-- PART 7: Verify changes
-- =====================================================

-- Check if columns were added to orders table
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('shipping_fee', 'tax_fee', 'shipping_tax_payment_status', 'shipping_tax_paid_at')
ORDER BY ordinal_position;

-- Check if shipping_tax_payments table exists
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'shipping_tax_payments'
ORDER BY ordinal_position;

-- Show migration status
SELECT 'Migration Complete - Shipping & Tax Payment System Ready' AS status;
