-- Partner Invitation System Schema
-- This adds invitation codes, referral tracking, and benefits management

-- Add invitation-related columns to partner_profiles
DO $$
BEGIN
    -- Add invitation_code column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'invitation_code'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN invitation_code VARCHAR(10) UNIQUE;
        RAISE NOTICE 'Added invitation_code column to partner_profiles';
    END IF;

    -- Add referred_by column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'referred_by'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN referred_by UUID REFERENCES partner_profiles(id);
        RAISE NOTICE 'Added referred_by column to partner_profiles';
    END IF;

    -- Add referral_earnings column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'referral_earnings'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN referral_earnings DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Added referral_earnings column to partner_profiles';
    END IF;

    -- Add referral_count column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'referral_count'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN referral_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added referral_count column to partner_profiles';
    END IF;

    -- Add referral_tier column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'referral_tier'
    ) THEN
        ALTER TABLE partner_profiles ADD COLUMN referral_tier VARCHAR(20) DEFAULT 'bronze' 
            CHECK (referral_tier IN ('bronze', 'silver', 'gold', 'platinum'));
        RAISE NOTICE 'Added referral_tier column to partner_profiles';
    END IF;
END $$;

-- Create referral_benefits table
CREATE TABLE IF NOT EXISTS referral_benefits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
    benefit_type VARCHAR(50) NOT NULL CHECK (benefit_type IN ('commission_bonus', 'rate_reduction', 'credit', 'extended_trial')),
    benefit_value DECIMAL(10,2) NOT NULL,
    benefit_description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    UNIQUE(referrer_id, referred_id)
);

-- Create invitation_logs table for tracking invitation usage
CREATE TABLE IF NOT EXISTS invitation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invitation_code VARCHAR(10) NOT NULL,
    referrer_id UUID REFERENCES partner_profiles(id) ON DELETE SET NULL,
    applicant_email VARCHAR(255),
    applicant_ip INET,
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'used' CHECK (status IN ('used', 'expired', 'invalid', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    metadata JSONB DEFAULT '{}'
);

-- Create referral_tiers table for tier-based benefits
CREATE TABLE IF NOT EXISTS referral_tiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tier_name VARCHAR(20) UNIQUE NOT NULL CHECK (tier_name IN ('bronze', 'silver', 'gold', 'platinum')),
    min_referrals INTEGER NOT NULL,
    commission_bonus_percent DECIMAL(5,2) DEFAULT 0.00,
    commission_reduction_percent DECIMAL(5,2) DEFAULT 0.00,
    monthly_credit DECIMAL(10,2) DEFAULT 0.00,
    benefits JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_profiles_invitation_code ON partner_profiles(invitation_code);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_referred_by ON partner_profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_referral_benefits_referrer_id ON referral_benefits(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_benefits_referred_id ON referral_benefits(referred_id);
CREATE INDEX IF NOT EXISTS idx_invitation_logs_invitation_code ON invitation_logs(invitation_code);
CREATE INDEX IF NOT EXISTS idx_invitation_logs_created_at ON invitation_logs(created_at);

-- Enable RLS on new tables
ALTER TABLE referral_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_tiers ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_benefits
CREATE POLICY "Users can view their own referral benefits" ON referral_benefits
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM partner_profiles WHERE id = referrer_id));

CREATE POLICY "Users can view benefits they received" ON referral_benefits
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM partner_profiles WHERE id = referred_id));

-- RLS policies for invitation_logs
CREATE POLICY "Users can view logs for their invitation codes" ON invitation_logs
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM partner_profiles WHERE id = referrer_id));

-- RLS policies for referral_tiers (public read access)
CREATE POLICY "Everyone can view referral tiers" ON referral_tiers
    FOR SELECT USING (true);

-- Function to generate unique invitation code
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    prefix TEXT := 'INV';
    random_part TEXT;
    checksum_part TEXT;
    attempts INTEGER := 0;
    max_attempts INTEGER := 10;
BEGIN
    LOOP
        -- Generate 6-character random part
        random_part := UPPER(substring(encode(gen_random_bytes(4), 'hex'), 1, 6));
        
        -- Generate checksum
        checksum_part := MOD(
            (ASCII(prefix) + ASCII(SUBSTRING(random_part, 1, 3)) + ASCII(SUBSTRING(random_part, 4, 6))), 
            36
        )::TEXT;
        
        code := prefix || random_part || checksum_part;
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM partner_profiles WHERE invitation_code = code) THEN
            EXIT;
        END IF;
        
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique invitation code after % attempts', max_attempts;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate invitation code
CREATE OR REPLACE FUNCTION validate_invitation_code(code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check format: INV + 6 chars + 1 checksum (total 10 chars)
    IF code IS NULL OR LENGTH(code) != 10 THEN
        RETURN FALSE;
    END IF;
    
    -- Check if starts with INV
    IF LEFT(code, 3) != 'INV' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if all characters after prefix are alphanumeric
    IF SUBSTRING(code, 4) ~ '[^A-Z0-9]' THEN
        RETURN FALSE;
    END IF;
    
    -- Validate checksum
    DECLARE
        prefix TEXT := LEFT(code, 3);
        random_part TEXT := SUBSTRING(code, 4, 6);
        checksum_part TEXT := RIGHT(code, 1);
        calculated_checksum TEXT;
    BEGIN
        calculated_checksum := MOD(
            (ASCII(prefix) + ASCII(SUBSTRING(random_part, 1, 3)) + ASCII(SUBSTRING(random_part, 4, 6))), 
            36
        )::TEXT;
        
        RETURN checksum_part = calculated_checksum;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create referral benefit
CREATE OR REPLACE FUNCTION create_referral_benefit(
    referrer_id UUID,
    referred_id UUID,
    benefit_type VARCHAR(50),
    benefit_value DECIMAL(10,2),
    benefit_description TEXT DEFAULT NULL,
    expires_days INTEGER DEFAULT 365
)
RETURNS UUID AS $$
DECLARE
    benefit_id UUID;
    expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate expiration date
    IF expires_days > 0 THEN
        expires_at := NOW() + (expires_days || ' days')::INTERVAL;
    END IF;
    
    -- Create benefit
    INSERT INTO referral_benefits (
        referrer_id,
        referred_id,
        benefit_type,
        benefit_value,
        benefit_description,
        expires_at
    ) VALUES (
        referrer_id,
        referred_id,
        benefit_type,
        benefit_value,
        benefit_description,
        expires_at
    ) RETURNING id INTO benefit_id;
    
    -- Update referrer stats
    UPDATE partner_profiles 
    SET 
        referral_count = referral_count + 1,
        referral_tier = CASE 
            WHEN referral_count + 1 >= 50 THEN 'platinum'
            WHEN referral_count + 1 >= 20 THEN 'gold'
            WHEN referral_count + 1 >= 5 THEN 'silver'
            ELSE 'bronze'
        END
    WHERE id = referrer_id;
    
    RETURN benefit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate referral tier benefits
CREATE OR REPLACE FUNCTION calculate_referral_benefits(partner_id UUID)
RETURNS TABLE(
    tier_name VARCHAR(20),
    commission_bonus_percent DECIMAL(5,2),
    commission_reduction_percent DECIMAL(5,2),
    monthly_credit DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH partner_tier AS (
        SELECT referral_tier, referral_count
        FROM partner_profiles
        WHERE id = partner_id
    )
    SELECT 
        rt.tier_name,
        rt.commission_bonus_percent,
        rt.commission_reduction_percent,
        rt.monthly_credit
    FROM referral_tiers rt
    JOIN partner_tier pt ON rt.tier_name = pt.referral_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate invitation code for new partners
CREATE OR REPLACE FUNCTION auto_generate_invitation_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate invitation code only for approved partners
    IF NEW.partner_status = 'approved' AND (NEW.invitation_code IS NULL OR NEW.invitation_code = '') THEN
        NEW.invitation_code := generate_invitation_code();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_auto_generate_invitation_code ON partner_profiles;
CREATE TRIGGER trigger_auto_generate_invitation_code
    BEFORE UPDATE ON partner_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_invitation_code();

-- Insert default referral tiers
INSERT INTO referral_tiers (tier_name, min_referrals, commission_bonus_percent, commission_reduction_percent, monthly_credit, benefits) VALUES
('bronze', 0, 0.00, 0.00, 0.00, '{"name": "Bronze Partner", "description": "Starting tier for all partners"}'),
('silver', 5, 1.00, 0.50, 50.00, '{"name": "Silver Partner", "description": "5+ successful referrals"}'),
('gold', 20, 2.50, 1.00, 150.00, '{"name": "Gold Partner", "description": "20+ successful referrals"}'),
('platinum', 50, 5.00, 2.00, 500.00, '{"name": "Platinum Partner", "description": "50+ successful referrals"}')
ON CONFLICT (tier_name) DO NOTHING;

-- Grant permissions
GRANT ALL ON referral_benefits TO authenticated;
GRANT ALL ON referral_benefits TO service_role;
GRANT ALL ON invitation_logs TO authenticated;
GRANT ALL ON invitation_logs TO service_role;
GRANT SELECT ON referral_tiers TO authenticated;
GRANT SELECT ON referral_tiers TO service_role;
GRANT EXECUTE ON FUNCTION generate_invitation_code TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invitation_code TO service_role;
GRANT EXECUTE ON FUNCTION validate_invitation_code TO authenticated;
GRANT EXECUTE ON FUNCTION validate_invitation_code TO service_role;
GRANT EXECUTE ON FUNCTION create_referral_benefit TO authenticated;
GRANT EXECUTE ON FUNCTION create_referral_benefit TO service_role;
GRANT EXECUTE ON FUNCTION calculate_referral_benefits TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_referral_benefits TO service_role;

DO $$
BEGIN
    RAISE NOTICE 'Partner invitation system schema completed successfully!';
END $$;
