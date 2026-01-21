-- Create partner_profiles table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_partner_profiles_user_id ON public.partner_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_store_slug ON public.partner_profiles(store_slug);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_is_active ON public.partner_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_partner_status ON public.partner_profiles(partner_status);

-- Enable RLS (Row Level Security)
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own partner profile" ON public.partner_profiles;
DROP POLICY IF EXISTS "Users can insert own partner profile" ON public.partner_profiles;
DROP POLICY IF EXISTS "Users can update own partner profile" ON public.partner_profiles;
DROP POLICY IF EXISTS "Everyone can view active partner profiles" ON public.partner_profiles;

-- Create policies
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

-- Grant necessary permissions
GRANT ALL ON public.partner_profiles TO authenticated;
GRANT SELECT ON public.partner_profiles TO anon;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_partner_profiles_updated_at
    BEFORE UPDATE ON public.partner_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
