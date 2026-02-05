-- Create payment_method_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payment_method_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  config_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT payment_method_config_method_name_key UNIQUE (method_name)
);

-- Enable RLS
ALTER TABLE public.payment_method_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view payment configs" ON public.payment_method_config
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert payment configs" ON public.payment_method_config
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.payment_method_config TO authenticated, anon;

-- Insert default payment configurations
INSERT INTO public.payment_method_config (method_name, is_active, config_data) VALUES
('stripe', true, '{"publishable_key": "pk_test_51SqvCrCgjkU88ujjHxsEKcVVEB0PruhYMqScySU99sFFIIeN70kMu94TXFg7UIuHt1u4QS1kahWSo6tetnH2HcXy00PiQRBovt"}'),
('paypal', true, '{"client_id": "AW-zlTWY6oQurImEP5Ch1pF6N6QOAF1QkY9O3lLZ0mTrxBXlPN8FeM4_m6CTwwCsWW4sT3__PJz93_7C"}'),
('crypto', false, '{"enabled": false}'),
('wallet', false, '{"enabled": false}'),
('bank', false, '{"enabled": false}')
ON CONFLICT (method_name) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  config_data = EXCLUDED.config_data,
  updated_at = NOW();

-- Verify the setup
SELECT 'payment_method_config table setup completed' as status,
       (SELECT COUNT(*) FROM public.payment_method_config) as total_configs;
