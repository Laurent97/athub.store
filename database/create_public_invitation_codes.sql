-- Create public_invitation_codes table for tracking all invitation codes
CREATE TABLE IF NOT EXISTS public.public_invitation_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code character varying(20) NOT NULL,
  is_active boolean NULL DEFAULT true,
  max_uses integer NULL DEFAULT 100,
  current_uses integer NULL DEFAULT 0,
  expires_at timestamp with time zone NULL,
  description text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT public_invitation_codes_pkey PRIMARY KEY (id),
  CONSTRAINT public_invitation_codes_code_key UNIQUE (code)
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_public_invitation_codes_code ON public.public_invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_public_invitation_codes_active ON public.public_invitation_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_public_invitation_codes_expires ON public.public_invitation_codes(expires_at);

-- Enable RLS on the table
ALTER TABLE public.public_invitation_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active invitation codes" ON public.public_invitation_codes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can insert invitation codes" ON public.public_invitation_codes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update all invitation codes" ON public.public_invitation_codes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Function to automatically record invitation codes from partner_profiles
CREATE OR REPLACE FUNCTION sync_partner_invitation_codes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sync_count INTEGER := 0;
    partner_record RECORD;
BEGIN
    -- Sync invitation codes from partner_profiles to public_invitation_codes
    FOR partner_record IN (
        SELECT id, store_name, invitation_code, partner_status, is_active
        FROM public.partner_profiles 
        WHERE invitation_code IS NOT NULL 
        AND invitation_code != ''
        AND partner_status = 'approved'
    ) LOOP
        -- Insert or update the invitation code in public_invitation_codes
        INSERT INTO public.public_invitation_codes (
            code,
            is_active,
            max_uses,
            current_uses,
            description,
            created_at,
            updated_at
        ) VALUES (
            partner_record.invitation_code,
            partner_record.is_active,
            100, -- Default max uses
            COALESCE(
                (SELECT COUNT(*) FROM public.partner_profiles p2 
                 WHERE p2.invitation_code = partner_record.invitation_code 
                 AND p2.referred_by IS NOT NULL), 0
            ), -- Current usage count
            'Invitation code for ' || partner_record.store_name,
            NOW(),
            NOW()
        )
        ON CONFLICT (code) 
        DO UPDATE SET
            is_active = partner_record.is_active,
            current_uses = COALESCE(
                (SELECT COUNT(*) FROM public.partner_profiles p2 
                 WHERE p2.invitation_code = partner_record.invitation_code 
                 AND p2.referred_by IS NOT NULL), 0
            ),
            updated_at = NOW();
        
        sync_count := sync_count + 1;
    END LOOP;
    
    RETURN sync_count;
END;
$$;

-- Update existing invitation validation function to use the new table
CREATE OR REPLACE FUNCTION validate_invitation_code(code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_record RECORD;
BEGIN
    -- Check if invitation code exists and is active
    SELECT * INTO invitation_record
    FROM public.public_invitation_codes
    WHERE code = code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if max uses reached
    IF invitation_record.max_uses IS NOT NULL 
    AND invitation_record.current_uses >= invitation_record.max_uses THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Function to increment invitation usage
CREATE OR REPLACE FUNCTION increment_invitation_usage(p_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Increment usage count in public_invitation_codes
    UPDATE public.public_invitation_codes 
    SET 
        current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE code = p_code;
    
    -- Also update partner_profiles for backward compatibility
    UPDATE public.partner_profiles 
    SET invitation_usage_count = COALESCE(invitation_usage_count, 0) + 1
    WHERE invitation_code = p_code;
END;
$$;

-- Function to generate new invitation codes and record them
CREATE OR REPLACE FUNCTION generate_and_record_invitation_code(partner_id TEXT, partner_name TEXT)
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
        SELECT 1 FROM public.public_invitation_codes 
        WHERE code = new_code
    ) LOOP
        random_part := upper(substring(md5(random()::text), 1, 6));
        checksum_part := upper(substring(md5(random_part || 'SALT'), 1, 2));
        new_code := prefix || random_part || checksum_part;
    END LOOP;
    
    -- Record the new invitation code
    INSERT INTO public.public_invitation_codes (
        code,
        is_active,
        max_uses,
        current_uses,
        description,
        created_at,
        updated_at
    ) VALUES (
        new_code,
        true,
        100,
        0,
        'Invitation code for ' || partner_name,
        NOW(),
        NOW()
    );
    
    RETURN new_code;
END;
$$;

-- Trigger to automatically sync invitation codes when partner_profiles change
CREATE OR REPLACE FUNCTION sync_invitation_on_partner_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Sync invitation codes when partner profile is updated
    IF TG_OP = 'UPDATE' THEN
        IF OLD.invitation_code IS DISTINCT FROM NEW.invitation_code 
        OR OLD.is_active IS DISTINCT FROM NEW.is_active
        OR OLD.partner_status IS DISTINCT FROM NEW.partner_status THEN
            PERFORM sync_partner_invitation_codes();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_sync_invitation_on_partner_change ON public.partner_profiles;
CREATE TRIGGER trigger_sync_invitation_on_partner_change
    AFTER UPDATE ON public.partner_profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_invitation_on_partner_change();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.public_invitation_codes TO authenticated, anon;
GRANT EXECUTE ON FUNCTION validate_invitation_code TO authenticated, anon;
GRANT EXECUTE ON FUNCTION increment_invitation_usage TO authenticated, anon;
GRANT EXECUTE ON FUNCTION generate_and_record_invitation_code TO authenticated;
GRANT EXECUTE ON FUNCTION sync_partner_invitation_codes TO authenticated;

-- Initial sync - sync existing partner invitation codes
SELECT sync_partner_invitation_codes() as codes_synced;

-- Verify the setup
SELECT 'Invitation code system setup completed' as status,
       (SELECT COUNT(*) FROM public.public_invitation_codes) as total_codes,
       (SELECT COUNT(*) FROM public.public_invitation_codes WHERE is_active = true) as active_codes;
