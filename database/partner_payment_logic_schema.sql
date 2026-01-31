-- Partner Order Payment Logic Schema Updates
-- This migration adds support for base cost prices, selling prices, and payment tracking

-- 1. Update partner_products table to include pricing structure
ALTER TABLE partner_products 
ADD COLUMN base_cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN markup_percentage DECIMAL(5,2) DEFAULT 0;

-- 2. Update orders table to track payment amounts
ALTER TABLE orders 
ADD COLUMN base_cost_total DECIMAL(10,2) DEFAULT 0,
ADD COLUMN partner_payment_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN partner_payout_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN partner_payment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN partner_payout_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN partner_payment_at TIMESTAMP,
ADD COLUMN partner_payout_at TIMESTAMP;

-- 3. Create partner_transactions table for payment tracking
CREATE TABLE partner_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('payment', 'payout', 'refund')),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description TEXT,
  payment_method VARCHAR(50),
  transaction_reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  failed_at TIMESTAMP,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'
);

-- 4. Create indexes for performance
CREATE INDEX idx_partner_transactions_partner_id ON partner_transactions(partner_id);
CREATE INDEX idx_partner_transactions_order_id ON partner_transactions(order_id);
CREATE INDEX idx_partner_transactions_type_status ON partner_transactions(transaction_type, status);
CREATE INDEX idx_partner_transactions_created_at ON partner_transactions(created_at);

-- 5. Create orders index for payment status queries
CREATE INDEX idx_orders_partner_payment_status ON orders(partner_payment_status);
CREATE INDEX idx_orders_partner_payout_status ON orders(partner_payout_status);

-- 6. Update existing partner_products with pricing data
-- This assumes current price is selling price and sets base price to 80% of it
UPDATE partner_products 
SET 
  selling_price = price,
  base_cost_price = ROUND(price * 0.80, 2),
  markup_percentage = ROUND(((price - (price * 0.80)) / (price * 0.80)) * 100, 2)
WHERE selling_price = 0 AND base_cost_price = 0;

-- 7. Add constraints to ensure data integrity
ALTER TABLE partner_products 
ADD CONSTRAINT check_positive_prices CHECK (base_cost_price >= 0 AND selling_price >= 0),
ADD CONSTRAINT check_selling_price_higher CHECK (selling_price >= base_cost_price),
ADD CONSTRAINT check_markup_percentage CHECK (markup_percentage >= 0);

ALTER TABLE orders 
ADD CONSTRAINT check_positive_payment_amounts CHECK (
  base_cost_total >= 0 AND 
  partner_payment_amount >= 0 AND 
  partner_payout_amount >= 0
);

-- 8. Create function to calculate partner profit
CREATE OR REPLACE FUNCTION calculate_partner_profit(order_id UUID)
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN (
    SELECT COALESCE(partner_payout_amount, 0) - COALESCE(partner_payment_amount, 0)
    FROM orders
    WHERE id = order_id
  );
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to calculate platform revenue
CREATE OR REPLACE FUNCTION calculate_platform_revenue(order_id UUID)
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN (
    SELECT total_amount - COALESCE(partner_payout_amount, 0)
    FROM orders
    WHERE id = order_id
  );
END;
$$ LANGUAGE plpgsql;

-- 10. Create view for partner financial summary
CREATE OR REPLACE VIEW partner_financial_summary AS
SELECT 
  p.id as partner_id,
  p.store_name,
  COUNT(o.id) as total_orders,
  SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
  SUM(COALESCE(o.partner_payment_amount, 0)) as total_payments,
  SUM(COALESCE(o.partner_payout_amount, 0)) as total_payouts,
  SUM(COALESCE(o.partner_payout_amount, 0) - COALESCE(o.partner_payment_amount, 0)) as total_profit,
  AVG(CASE WHEN o.status = 'completed' THEN COALESCE(o.partner_payout_amount, 0) - COALESCE(o.partner_payment_amount, 0) ELSE NULL END) as avg_profit_per_order,
  SUM(o.total_amount) as total_revenue,
  SUM(o.total_amount - COALESCE(o.partner_payout_amount, 0)) as platform_revenue
FROM partner_profiles p
LEFT JOIN orders o ON p.id = o.partner_id
GROUP BY p.id, p.store_name;

-- 11. Add RLS policies for partner_transactions
ALTER TABLE partner_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their own transactions" ON partner_transactions
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM partner_profiles WHERE id = partner_id
  ));

CREATE POLICY "Admins can view all transactions" ON partner_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 12. Create trigger to update transaction timestamps
CREATE OR REPLACE FUNCTION update_transaction_processed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.processed_at = NOW();
  END IF;
  
  IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    NEW.failed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_transaction_processed_at
  BEFORE UPDATE ON partner_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transaction_processed_at();

-- 13. Create trigger to update order payment timestamps
CREATE OR REPLACE FUNCTION update_order_payment_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.partner_payment_status = 'completed' AND OLD.partner_payment_status != 'completed' THEN
    NEW.partner_payment_at = NOW();
  END IF;
  
  IF NEW.partner_payout_status = 'completed' AND OLD.partner_payout_status != 'completed' THEN
    NEW.partner_payout_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_payment_timestamps
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_payment_timestamps();

COMMIT;
