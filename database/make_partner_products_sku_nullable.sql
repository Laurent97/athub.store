-- Make SKU column nullable in partner_products table
-- Since SKU is already available through the product_id foreign key relationship,
-- it doesn't need to be duplicated in partner_products
ALTER TABLE partner_products
ALTER COLUMN sku DROP NOT NULL;

-- Add a comment explaining why SKU is optional
COMMENT ON COLUMN partner_products.sku IS 'Optional - SKU is available through the product relationship. This column is kept for reference/denormalization purposes.';
