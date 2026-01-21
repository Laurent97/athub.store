-- Fix any potential database issues and add debugging

-- 1. Ensure partner_shopping_cart_items table has proper structure
CREATE TABLE IF NOT EXISTS partner_shopping_cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  partner_product_id UUID REFERENCES partner_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_partner_shopping_cart_user_id ON partner_shopping_cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_shopping_cart_product_id ON partner_shopping_cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_partner_shopping_cart_partner_product_id ON partner_shopping_cart_items(partner_product_id);

-- 3. Add debugging trigger to log cart additions
CREATE OR REPLACE FUNCTION debug_cart_addition()
RETURNS TRIGGER AS $$
BEGIN
  RAISE LOG 'Cart item added: Product ID: %, User ID: %, Price: %', 
    NEW.product_id, 
    NEW.user_id, 
    NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_debug_cart_addition
  BEFORE INSERT ON partner_shopping_cart_items
  FOR EACH ROW
  EXECUTE FUNCTION debug_cart_addition();

-- 4. Add sample cart item for testing (if needed)
INSERT INTO partner_shopping_cart_items (
  id, user_id, product_id, partner_product_id, quantity, unit_price, subtotal, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'test-user-id',
  'd437c33e-5391-469d-9b9d-1f99ab3325a7',
  (SELECT id FROM partner_products WHERE product_id = 'd437c33e-5391-469d-9b9d-1f99ab3325a7' LIMIT 1),
  1,
  250000.00,
  250000.00,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 5. Add constraints to prevent invalid prices
ALTER TABLE partner_shopping_cart_items 
  ADD CONSTRAINT chk_unit_price_positive CHECK (unit_price > 0),
  ADD CONSTRAINT chk_subtotal_positive CHECK (subtotal > 0);

-- 6. Update existing cart items to ensure they have valid prices
UPDATE partner_shopping_cart_items 
SET unit_price = GREATEST(unit_price, 0.01),
    subtotal = quantity * GREATEST(unit_price, 0.01)
WHERE unit_price <= 0 OR subtotal <= 0;

-- 7. Add comments for documentation
COMMENT ON TABLE partner_shopping_cart_items IS 'Shopping cart items for partner products with proper price validation';
COMMENT ON COLUMN partner_shopping_cart_items.unit_price IS 'Unit price of the cart item (must be > 0)';
COMMENT ON COLUMN partner_shopping_cart_items.subtotal IS 'Subtotal of the cart item (must be > 0)';
