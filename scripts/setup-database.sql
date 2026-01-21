-- Complete Database Setup Script for AutoTradeHub
-- Run this script in Supabase SQL Editor to create all necessary tables

-- 1. Create products table (if not exists)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    make TEXT,
    model TEXT,
    year INTEGER,
    mileage INTEGER,
    condition TEXT DEFAULT 'new',
    category TEXT DEFAULT 'part',
    original_price DECIMAL(12,2) NOT NULL,
    quantity_available INTEGER DEFAULT 1,
    specifications JSONB,
    images TEXT[] DEFAULT '{}',
    featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create users table (if not exists)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    user_type TEXT DEFAULT 'customer',
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create partner_profiles table
CREATE TABLE IF NOT EXISTS public.partner_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    store_name TEXT NOT NULL,
    store_slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    banner_url TEXT,
    description TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    country TEXT,
    city TEXT,
    tax_id TEXT,
    bank_account_details JSONB,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    total_earnings DECIMAL(12,2) DEFAULT 0.00,
    pending_balance DECIMAL(12,2) DEFAULT 0.00,
    available_balance DECIMAL(12,2) DEFAULT 0.00,
    store_visits INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT false,
    partner_status TEXT DEFAULT 'pending' CHECK (partner_status IN ('pending', 'approved', 'rejected', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create partner_products table
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

-- Create indexes for all tables
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);

CREATE INDEX IF NOT EXISTS idx_partner_profiles_user_id ON public.partner_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_store_slug ON public.partner_profiles(store_slug);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_is_active ON public.partner_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_partner_status ON public.partner_profiles(partner_status);

CREATE INDEX IF NOT EXISTS idx_partner_products_partner_id ON public.partner_products(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_products_product_id ON public.partner_products(product_id);
CREATE INDEX IF NOT EXISTS idx_partner_products_is_active ON public.partner_products(is_active);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
DROP POLICY IF EXISTS "Users can update own products" ON public.products;
DROP POLICY IF EXISTS "Everyone can view active products" ON public.products;

DROP POLICY IF EXISTS "Users can view own user profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own user profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own user profile" ON public.users;

DROP POLICY IF EXISTS "Users can view own partner profile" ON public.partner_profiles;
DROP POLICY IF EXISTS "Users can insert own partner profile" ON public.partner_profiles;
DROP POLICY IF EXISTS "Users can update own partner profile" ON public.partner_profiles;
DROP POLICY IF EXISTS "Everyone can view active partner profiles" ON public.partner_profiles;

DROP POLICY IF EXISTS "Partners can view own products" ON public.partner_products;
DROP POLICY IF EXISTS "Partners can insert own products" ON public.partner_products;
DROP POLICY IF EXISTS "Partners can update own products" ON public.partner_products;
DROP POLICY IF EXISTS "Everyone can view active partner products" ON public.partner_products;

-- Create policies for products
CREATE POLICY "Users can view own products" ON public.products
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own products" ON public.products
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own products" ON public.products
    FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Everyone can view active products" ON public.products
    FOR SELECT USING (is_active = true);

-- Create policies for users
CREATE POLICY "Users can view own user profile" ON public.users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own user profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own user profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Create policies for partner_profiles
CREATE POLICY "Users can view own partner profile" ON public.partner_profiles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own partner profile" ON public.partner_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own partner profile" ON public.partner_profiles
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Everyone can view active partner profiles" ON public.partner_profiles
    FOR SELECT USING (is_active = true AND partner_status = 'approved');

-- Create policies for partner_products
CREATE POLICY "Partners can view own products" ON public.partner_products
    FOR SELECT USING (partner_id IN (
        SELECT id FROM public.partner_profiles 
        WHERE user_id = auth.uid()
    ));
CREATE POLICY "Partners can insert own products" ON public.partner_products
    FOR INSERT WITH CHECK (partner_id IN (
        SELECT id FROM public.partner_profiles 
        WHERE user_id = auth.uid()
    ));
CREATE POLICY "Partners can update own products" ON public.partner_products
    FOR UPDATE USING (partner_id IN (
        SELECT id FROM public.partner_profiles 
        WHERE user_id = auth.uid()
    ));
CREATE POLICY "Everyone can view active partner products" ON public.partner_products
    FOR SELECT USING (is_active = true);

-- Grant permissions
GRANT ALL ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;

GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

GRANT ALL ON public.partner_profiles TO authenticated;
GRANT SELECT ON public.partner_profiles TO anon;

GRANT ALL ON public.partner_products TO authenticated;
GRANT SELECT ON public.partner_products TO anon;

-- Create updated_at function if not exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_partner_profiles_updated_at
    BEFORE UPDATE ON public.partner_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_partner_products_updated_at
    BEFORE UPDATE ON public.partner_products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
