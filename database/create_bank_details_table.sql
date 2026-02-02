-- Create bank_details table for storing international wire transfer information
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
COMMENT ON COLUMN bank_details.recipient_name IS 'Full name of the account recipient (person or business)';
COMMENT ON COLUMN bank_details.recipient_address IS 'Complete physical address of the recipient';
COMMENT ON COLUMN bank_details.bank_name IS 'Name of the receiving bank';
COMMENT ON COLUMN bank_details.bank_address IS 'Address of the receiving bank';
COMMENT ON COLUMN bank_details.swift_bic IS 'SWIFT/BIC code for international transfers (required)';
COMMENT ON COLUMN bank_details.iban IS 'IBAN for European transfers';
COMMENT ON COLUMN bank_details.routing_number IS 'Routing number for US transfers';
COMMENT ON COLUMN bank_details.sort_code IS 'Sort code for UK transfers';
COMMENT ON COLUMN bank_details.ifsc IS 'IFSC code for Indian transfers';
COMMENT ON COLUMN bank_details.account_number IS 'Bank account number (encrypted in production)';
COMMENT ON COLUMN bank_details.account_type IS 'Type of account: checking, savings, business, current';
COMMENT ON COLUMN bank_details.currency IS 'Currency code: USD, EUR, GBP, etc.';
COMMENT ON COLUMN bank_details.is_active IS 'Whether these bank details are shown to customers';

-- Create index for faster queries
CREATE INDEX idx_bank_details_is_active ON bank_details(is_active);
CREATE INDEX idx_bank_details_created_at ON bank_details(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE bank_details ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow anyone to read active bank details (for payment forms)
CREATE POLICY "Anyone can read active bank details" ON bank_details
    FOR SELECT USING (is_active = true);

-- Allow authenticated users to read all bank details
CREATE POLICY "Authenticated users can read all bank details" ON bank_details
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins to manage bank details
CREATE POLICY "Admins can manage bank details" ON bank_details
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Insert default bank details for demo purposes
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

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bank_details_updated_at 
    BEFORE UPDATE ON bank_details 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
