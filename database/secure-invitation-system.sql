-- Secure Invitation System with Role-Based Access Control

-- First, check if admin role system exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'auth.users' 
  AND column_name = 'raw_user_meta_data';

-- Create admin-specific invitation codes table
CREATE TABLE IF NOT EXISTS admin_invitation_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    max_uses INTEGER DEFAULT 50,
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create public invitation codes table (for general use)
CREATE TABLE IF NOT EXISTS public_invitation_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    max_uses INTEGER DEFAULT 100,
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on both tables
ALTER TABLE admin_invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_invitation_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for admin invitation codes (only admins can manage)
CREATE POLICY "Admins can manage admin invitation codes" 
    ON admin_invitation_codes FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Create policies for public invitation codes (anyone can use, but only admins can manage)
CREATE POLICY "Anyone can use public invitation codes" 
    ON public_invitation_codes FOR SELECT 
    USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Admins can manage public invitation codes" 
    ON public_invitation_codes FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Insert secure admin invitation codes
INSERT INTO admin_invitation_codes (code, created_by, description, max_uses) VALUES
    ('ADMIN2025', (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin' LIMIT 1), 'Admin invitation code for 2025', 50),
    ('STAFF2025', (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin' LIMIT 1), 'Staff invitation code for 2025', 25)
ON CONFLICT (code) DO NOTHING;

-- Insert public invitation codes for general use
INSERT INTO public_invitation_codes (code, description, max_uses) VALUES
    ('WELCOME2025', 'Public welcome code for new partners', 100),
    ('LAUNCH2025', 'Launch celebration invitation code', 200),
    ('BETA2025', 'Beta tester invitation code', 50)
ON CONFLICT (code) DO NOTHING;

-- Create function to validate invitation codes with role checking
CREATE OR REPLACE FUNCTION validate_invitation_code(
    p_code VARCHAR(20),
    p_user_email VARCHAR(255)
) RETURNS TABLE (
    is_valid BOOLEAN,
    code_type VARCHAR(20),
    referrer_name VARCHAR(255),
    benefits TEXT[],
    error_message VARCHAR(255)
) AS $$
BEGIN
    -- First check if user is admin trying to use admin code
    IF EXISTS (
        SELECT 1 FROM admin_invitation_codes 
        WHERE code = p_code 
        AND is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND current_uses < max_uses
    ) THEN
        -- Check if user is actually an admin
        IF EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = p_user_email 
            AND raw_user_meta_data->>'role' = 'admin'
        ) THEN
            -- Valid admin using admin code
            RETURN QUERY SELECT 
                true, 
                'admin', 
                'AutoTradeHub Admin',
                ARRAY['Full admin access', 'Priority support', 'Advanced features'],
                NULL::VARCHAR;
        ELSE
            -- Non-admin trying to use admin code
            RETURN QUERY SELECT 
                false, 
                'admin', 
                NULL,
                NULL,
                'Admin codes are reserved for administrators only'::VARCHAR;
        END IF;
    ELSIF EXISTS (
        SELECT 1 FROM public_invitation_codes 
        WHERE code = p_code 
        AND is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND current_uses < max_uses
    ) THEN
        -- Valid public code
        RETURN QUERY SELECT 
            true, 
            'public', 
            'AutoTradeHub',
            ARRAY['Welcome bonus', 'Standard features', 'Community support'],
            NULL::VARCHAR;
    ELSE
        -- Invalid code
        RETURN QUERY SELECT 
            false, 
            'invalid', 
            NULL,
            NULL,
            'Invalid or expired invitation code'::VARCHAR;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment usage count
CREATE OR REPLACE FUNCTION increment_invitation_usage(p_code VARCHAR(20)) RETURNS BOOLEAN AS $$
BEGIN
    -- Try admin codes first
    UPDATE admin_invitation_codes 
    SET current_uses = current_uses + 1 
    WHERE code = p_code AND current_uses < max_uses;
    
    -- If no rows affected, try public codes
    IF NOT FOUND THEN
        UPDATE public_invitation_codes 
        SET current_uses = current_uses + 1 
        WHERE code = p_code AND current_uses < max_uses;
    END IF;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Show available codes for verification
SELECT 
    'admin' as type,
    code, 
    current_uses, 
    max_uses, 
    is_active,
    expires_at,
    description
FROM admin_invitation_codes
UNION ALL
SELECT 
    'public' as type,
    code, 
    current_uses, 
    max_uses, 
    is_active,
    expires_at,
    description
FROM public_invitation_codes
ORDER BY type, code;
