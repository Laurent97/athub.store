-- Check partner_profiles column types to find VARCHAR(9) issue
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'partner_profiles' 
    AND table_schema = 'public'
    AND (
        data_type LIKE '%varchar%' OR 
        data_type LIKE '%character%'
    )
ORDER BY character_maximum_length DESC;
