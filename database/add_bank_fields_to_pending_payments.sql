-- Add bank payment fields to pending_payments table
ALTER TABLE pending_payments 
ADD COLUMN IF NOT EXISTS bank_recipient_name TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_swift_bic TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_proof_url TEXT,
ADD COLUMN IF NOT EXISTS bank_proof_description TEXT,
ADD COLUMN IF NOT EXISTS bank_proof_filename TEXT;

-- Add comments for documentation
COMMENT ON COLUMN pending_payments.bank_recipient_name IS 'Bank recipient name for bank transfers';
COMMENT ON COLUMN pending_payments.bank_name IS 'Bank name for bank transfers';
COMMENT ON COLUMN pending_payments.bank_swift_bic IS 'SWIFT/BIC code for bank transfers';
COMMENT ON COLUMN pending_payments.bank_account_number IS 'Bank account number (masked) for bank transfers';
COMMENT ON COLUMN pending_payments.bank_proof_url IS 'URL to uploaded payment proof document';
COMMENT ON COLUMN pending_payments.bank_proof_description IS 'Customer description of the bank transfer';
COMMENT ON COLUMN pending_payments.bank_proof_filename IS 'Original filename of uploaded proof document';

-- Create index for bank payment queries
CREATE INDEX IF NOT EXISTS idx_pending_payments_bank_method ON pending_payments(payment_method) WHERE payment_method = 'bank';
