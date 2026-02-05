-- Add invitation_usage_count column to partner_profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'partner_profiles' 
        AND column_name = 'invitation_usage_count'
    ) THEN
        ALTER TABLE partner_profiles 
        ADD COLUMN invitation_usage_count INTEGER DEFAULT 0;
        
        -- Update existing records to calculate usage count based on referred_by relationships
        UPDATE partner_profiles 
        SET invitation_usage_count = (
            SELECT COUNT(*) 
            FROM partner_profiles p2 
            WHERE p2.referred_by = partner_profiles.id
        );
        
        RAISE NOTICE 'invitation_usage_count column added to partner_profiles table';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'partner_profiles' 
  AND column_name = 'invitation_usage_count';

SELECT 'invitation_usage_count column setup completed' as status;
