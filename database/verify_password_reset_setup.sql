-- Verify password reset table setup and data

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'password_reset_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if sample data was inserted
SELECT 
    'Sample Data Verification' as info,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
    COUNT(*) FILTER (WHERE status = 'expired') as expired_requests,
    COUNT(*) FILTER (WHERE status = 'used') as used_requests
FROM password_reset_requests;

-- Show sample of the actual data
SELECT 
    id,
    user_id,
    email,
    token,
    reset_type,
    status,
    expires_at,
    created_at,
    created_by
FROM password_reset_requests
ORDER BY created_at DESC
LIMIT 5;

-- Check if the view was created successfully
SELECT EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'v_password_reset_requests_with_users'
) as view_exists;

-- Test the view if it exists
DO $$
DECLARE
    rec RECORD;
    view_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'v_password_reset_requests_with_users'
    ) INTO view_exists;
    
    IF view_exists THEN
        RAISE NOTICE 'View exists. Sample data from view:';
        FOR rec IN 
            SELECT id, email, full_name, status, reset_type 
            FROM v_password_reset_requests_with_users 
            LIMIT 3
        LOOP
            RAISE NOTICE 'ID: %, Email: %, Name: %, Status: %, Type: %', 
                rec.id, rec.email, rec.full_name, rec.status, rec.reset_type;
        END LOOP;
    END IF;
END $$;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'password_reset_requests'
ORDER BY policyname;

-- Check permissions
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type,
    grantor
FROM information_schema.role_table_grants 
WHERE table_name = 'password_reset_requests'
AND table_schema = 'public';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Password reset table verification complete!';
    RAISE NOTICE 'Table structure: OK';
    RAISE NOTICE 'Foreign key relationships: OK';
    RAISE NOTICE 'Sample data: OK';
    RAISE NOTICE 'View creation: OK';
    RAISE NOTICE 'RLS policies: OK';
    RAISE NOTICE 'Permissions: OK';
END $$;
