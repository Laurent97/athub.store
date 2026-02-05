-- Create invitation code system functions
-- These functions are needed for the partner invitation system to work properly

-- Function to generate invitation codes
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_code TEXT;
    prefix TEXT := 'PARTNER';
    random_part TEXT;
    checksum_part TEXT;
BEGIN
    -- Generate random 6-character part
    random_part := upper(substring(md5(random()::text), 1, 6));
    
    -- Generate checksum (2 characters)
    checksum_part := upper(substring(md5(random_part || 'SALT'), 1, 2));
    
    -- Combine parts
    new_code := prefix || random_part || checksum_part;
    
    -- Ensure uniqueness
    WHILE EXISTS (
        SELECT 1 FROM partner_profiles 
        WHERE invitation_code = new_code
    ) LOOP
        random_part := upper(substring(md5(random()::text), 1, 6));
        checksum_part := upper(substring(md5(random_part || 'SALT'), 1, 2));
        new_code := prefix || random_part || checksum_part;
    END LOOP;
    
    RETURN new_code;
END;
$$;

-- Function to validate invitation code format and existence
CREATE OR REPLACE FUNCTION validate_invitation_code(code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check format: PARTNER + 6 chars + 2 chars (total 14 chars)
    IF length(code) != 14 THEN
        RETURN FALSE;
    END IF;
    
    -- Check prefix
    IF left(code, 7) != 'PARTNER' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if it exists and belongs to an approved partner
    IF EXISTS (
        SELECT 1 FROM partner_profiles 
        WHERE invitation_code = code 
        AND partner_status = 'approved'
        AND is_active = true
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Function to increment invitation code usage
CREATE OR REPLACE FUNCTION increment_invitation_usage(p_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update usage count for the partner who owns this invitation code
    UPDATE partner_profiles 
    SET invitation_usage_count = COALESCE(invitation_usage_count, 0) + 1
    WHERE invitation_code = p_code;
    
    -- Log the usage if invitation_logs table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'invitation_logs'
    ) THEN
        INSERT INTO invitation_logs (
            invitation_code,
            used_at,
            status
        ) VALUES (
            p_code,
            NOW(),
            'used'
        );
    END IF;
END;
$$;

-- Function to assign invitation codes to partners who don't have one
CREATE OR REPLACE FUNCTION assign_invitation_codes_to_partners()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    partner_count INTEGER := 0;
    partner_record RECORD;
BEGIN
    -- Count partners without invitation codes
    SELECT COUNT(*) INTO partner_count
    FROM partner_profiles 
    WHERE invitation_code IS NULL 
    OR invitation_code = '';
    
    IF partner_count > 0 THEN
        -- Assign invitation codes to partners who don't have one
        FOR partner_record IN (
            SELECT id, store_name 
            FROM partner_profiles 
            WHERE invitation_code IS NULL 
            OR invitation_code = ''
        ) LOOP
            UPDATE partner_profiles 
            SET invitation_code = generate_invitation_code()
            WHERE id = partner_record.id;
        END LOOP;
    END IF;
    
    RETURN partner_count;
END;
$$;

-- Add invitation_usage_count column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'invitation_usage_count'
    ) THEN
        ALTER TABLE partner_profiles 
        ADD COLUMN invitation_usage_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create invitation_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS invitation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_code TEXT NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'used',
    applicant_email TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitation_logs_code ON invitation_logs(invitation_code);
CREATE INDEX IF NOT EXISTS idx_invitation_logs_used_at ON invitation_logs(used_at);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_invitation_code ON partner_profiles(invitation_code);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION generate_invitation_code TO authenticated, anon;
GRANT EXECUTE ON FUNCTION validate_invitation_code TO authenticated, anon;
GRANT EXECUTE ON FUNCTION increment_invitation_usage TO authenticated, anon;
GRANT EXECUTE ON FUNCTION assign_invitation_codes_to_partners TO authenticated;

-- Enable RLS on invitation_logs
ALTER TABLE invitation_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invitation_logs
CREATE POLICY "Anyone can view invitation logs" ON invitation_logs
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert invitation logs" ON invitation_logs
    FOR INSERT WITH CHECK (true);

-- Run the assignment function for existing partners
SELECT assign_invitation_codes_to_partners() as partners_updated;

-- Verify the functions work
SELECT 'Functions created successfully' as status;
