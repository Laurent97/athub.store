-- Fix partner_profiles table - Safe version that handles existing objects
-- This script will safely update the partner_profiles table without conflicts

-- First, let's check if the table exists and create it if needed
CREATE TABLE IF NOT EXISTS public.partner_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_partner_profiles_user_id ON public.partner_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_store_slug ON public.partner_profiles(store_slug);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_is_active ON public.partner_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_partner_status ON public.partner_profiles(partner_status);

-- Enable RLS if not already enabled
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

-- Create updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger only if it doesn't exist
DROP TRIGGER IF EXISTS handle_partner_profiles_updated_at ON public.partner_profiles;
CREATE TRIGGER handle_partner_profiles_updated_at
    BEFORE UPDATE ON public.partner_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Remove all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own partner profile" ON public.partner_profiles;
DROP POLICY IF EXISTS "Users can insert own partner profile" ON public.partner_profiles;
DROP POLICY IF EXISTS "Users can update own partner profile" ON public.partner_profiles;
DROP POLICY IF EXISTS "Everyone can view active partner profiles" ON public.partner_profiles;

-- Create fresh policies
-- Users can view their own partner profile
CREATE POLICY "Users can view own partner profile" ON public.partner_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own partner profile
CREATE POLICY "Users can insert own partner profile" ON public.partner_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own partner profile
CREATE POLICY "Users can update own partner profile" ON public.partner_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Everyone can view active partner profiles
CREATE POLICY "Everyone can view active partner profiles" ON public.partner_profiles
    FOR SELECT USING (is_active = true AND partner_status = 'approved');

-- Grant permissions
GRANT ALL ON public.partner_profiles TO authenticated;
GRANT SELECT ON public.partner_profiles TO anon;

-- Add sample data for testing
INSERT INTO public.partner_profiles (
    id,
    user_id,
    store_name,
    store_slug,
    logo_url,
    banner_url,
    description,
    contact_email,
    contact_phone,
    country,
    city,
    commission_rate,
    total_earnings,
    pending_balance,
    available_balance,
    store_visits,
    conversion_rate,
    total_orders,
    rating,
    is_active,
    partner_status,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM auth.users WHERE user_type = 'partner' LIMIT 1),
    'Laurent Auto Parts',
    'laurent-store',
    'https://via.placeholder.com/150x150.png?text=Logo',
    'https://via.placeholder.com/800x300.png?text=Banner',
    'Premium auto parts and accessories store. We offer high-quality parts for all makes and models.',
    'contact@laurent-store.com',
    '+1-555-0123',
    'United States',
    'New York',
    15.00,
    12500.00,
    2500.00,
    10000.00,
    1250,
    12.5,
    45,
    4.5,
    true,
    'approved',
    NOW(),
    NOW()
) ON CONFLICT (store_slug) DO NOTHING;
