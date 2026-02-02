-- Create paypal_details table for storing PayPal configuration
CREATE TABLE IF NOT EXISTS paypal_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paypal_email TEXT NOT NULL,
    business_name TEXT NOT NULL,
    business_description TEXT,
    currency TEXT NOT NULL DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE paypal_details IS 'Stores PayPal configuration for customer payments';
COMMENT ON COLUMN paypal_details.paypal_email IS 'PayPal email address where customers send payments';
COMMENT ON COLUMN paypal_details.business_name IS 'Name of the business that appears on PayPal transactions';
COMMENT ON COLUMN paypal_details.currency IS 'Currency for PayPal transactions';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_paypal_details_is_active ON paypal_details(is_active);
CREATE INDEX IF NOT EXISTS idx_paypal_details_created_at ON paypal_details(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE paypal_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read active paypal details" ON paypal_details;
DROP POLICY IF EXISTS "Authenticated users can read all paypal details" ON paypal_details;
DROP POLICY IF EXISTS "Admins can manage paypal details" ON paypal_details;

-- Create RLS policies for paypal_details
CREATE POLICY "Anyone can read active paypal details" ON paypal_details
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage paypal details" ON paypal_details
    FOR ALL USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_paypal_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_paypal_details_updated_at ON paypal_details;
CREATE TRIGGER update_paypal_details_updated_at 
    BEFORE UPDATE ON paypal_details 
    FOR EACH ROW 
    EXECUTE FUNCTION update_paypal_details_updated_at();

-- Insert default PayPal details
INSERT INTO paypal_details (
    paypal_email,
    business_name,
    business_description,
    currency,
    is_active
) VALUES (
    'payments@autotradehub.com',
    'Auto Trade Hub',
    'Premium automotive parts and accessories marketplace',
    'USD',
    true
) ON CONFLICT DO NOTHING;
