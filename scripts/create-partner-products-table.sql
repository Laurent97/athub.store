-- Create partner_products table
CREATE TABLE IF NOT EXISTS public.partner_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    selling_price DECIMAL(12,2) NOT NULL,
    profit_margin DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_partner_products_partner_id ON public.partner_products(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_products_product_id ON public.partner_products(product_id);
CREATE INDEX IF NOT EXISTS idx_partner_products_is_active ON public.partner_products(is_active);

-- Enable RLS (Row Level Security)
ALTER TABLE public.partner_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Partners can view own products" ON public.partner_products;
DROP POLICY IF EXISTS "Partners can insert own products" ON public.partner_products;
DROP POLICY IF EXISTS "Partners can update own products" ON public.partner_products;
DROP POLICY IF EXISTS "Everyone can view active products" ON public.partner_products;

-- Create policies
-- Partners can view their own products
CREATE POLICY "Partners can view own products" ON public.partner_products
    FOR SELECT USING (partner_id IN (
        SELECT id FROM public.partner_profiles 
        WHERE user_id = auth.uid()
    ));

-- Partners can insert their own products
CREATE POLICY "Partners can insert own products" ON public.partner_products
    FOR INSERT WITH CHECK (partner_id IN (
        SELECT id FROM public.partner_profiles 
        WHERE user_id = auth.uid()
    ));

-- Partners can update their own products
CREATE POLICY "Partners can update own products" ON public.partner_products
    FOR UPDATE USING (partner_id IN (
        SELECT id FROM public.partner_profiles 
        WHERE user_id = auth.uid()
    ));

-- Everyone can view active products
CREATE POLICY "Everyone can view active products" ON public.partner_products
    FOR SELECT USING (is_active = true);

-- Grant necessary permissions
GRANT ALL ON public.partner_products TO authenticated;
GRANT SELECT ON public.partner_products TO anon;

-- Create updated_at trigger
CREATE TRIGGER handle_partner_products_updated_at
    BEFORE UPDATE ON public.partner_products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
