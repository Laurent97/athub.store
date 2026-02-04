-- Fix payment_method column to allow NULL values
-- This resolves the "null value in column payment_method violates not-null constraint" error

-- Make payment_method column nullable
ALTER TABLE shipping_tax_payments ALTER COLUMN payment_method DROP NOT NULL;

-- Verify the change
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'shipping_tax_payments'
  AND column_name = 'payment_method';

SELECT 'payment_method column is now nullable - fix applied' AS status;
