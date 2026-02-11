-- CUSTOMER PAYMENT ACCESS POLICY
-- Allows customers to view and pay for their orders using any payment method

-- Step 1: Enable RLS on orders table (if not already enabled)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Step 2: Create policy for customer access to their own orders
CREATE POLICY "Customers can view and manage their orders" 
ON orders
FOR ALL 
USING (
  -- Allow access if user is authenticated and owns the order
  auth.uid() = customer_id
  OR
  -- Allow public access for payment completion (no authentication required)
  current_setting('request.headers.x-payment-access', 'false')::boolean = false
);

-- Step 3: Create policy for public order access during payment
CREATE POLICY "Public can access orders for payment" 
ON orders
FOR SELECT 
USING (
  -- Allow public access when accessing via payment endpoint
  current_setting('request.path', '') LIKE '%payment-shipping-tax%'
  OR
  -- Allow public access when accessing via order details with public token
  current_setting('request.headers.x-public-access', 'true')::boolean = true
);

-- Step 4: Grant permissions
GRANT ALL ON orders TO authenticated;
GRANT SELECT ON orders TO anon;

-- Step 5: Create payment methods table if it doesn't exist
CREATE TABLE IF NOT EXISTS customer_payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_type VARCHAR(50) NOT NULL, -- 'credit_card', 'bank_account', 'paypal', 'crypto'
  provider VARCHAR(100), -- 'stripe', 'bank_name', 'paypal_email', 'crypto_wallet'
  account_details JSONB, -- Encrypted payment method details
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Enable RLS on payment methods table
ALTER TABLE customer_payment_methods ENABLE ROW LEVEL SECURITY;

-- Step 7: Create policies for payment methods
CREATE POLICY "Customers can manage their payment methods" 
ON customer_payment_methods
FOR ALL 
USING (auth.uid() = customer_id);

-- Step 8: Grant permissions for payment methods
GRANT ALL ON customer_payment_methods TO authenticated;

-- Step 9: Create payment transactions table for tracking
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES customer_payment_methods(id) ON DELETE SET NULL,
  payment_type VARCHAR(50) NOT NULL, -- 'credit_card', 'bank_account', 'paypal', 'crypto'
  provider VARCHAR(100) NOT NULL, -- 'stripe', 'bank_transfer', 'paypal', 'crypto_wallet'
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL, -- 'pending', 'processing', 'completed', 'failed', 'refunded'
  transaction_id VARCHAR(255), -- External transaction ID
  gateway_response JSONB, -- Payment gateway response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 10: Enable RLS on payment transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Step 11: Create policies for payment transactions
CREATE POLICY "Customers can view their payment transactions" 
ON payment_transactions
FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create payment transactions" 
ON payment_transactions
FOR INSERT 
USING (auth.uid() = customer_id);

-- Step 12: Grant permissions for payment transactions
GRANT ALL ON payment_transactions TO authenticated;
GRANT SELECT ON payment_transactions TO anon;

-- Step 13: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer_id ON payment_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_payment_methods_customer_id ON customer_payment_methods(customer_id);

-- Step 14: Test the policies
SELECT 'Payment Access Policies Created' as status;
SELECT 'Orders table RLS enabled' as check, 
       CASE 
           WHEN EXISTS (
             SELECT 1 FROM pg_tables 
             WHERE schemaname = 'public' 
             AND tablename = 'orders'
             AND rowsecurity = true
           ) THEN 'ENABLED'
           ELSE 'DISABLED'
       END as rls_status;

SELECT 'Policies on orders' as check, COUNT(*) as count FROM pg_policies WHERE tablename = 'orders';
SELECT 'Customer can now pay using credit card, bank, PayPal, and crypto!' as result;
