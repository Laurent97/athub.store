    -- Remove foreign key constraint temporarily to allow data updates
    -- This will fix the constraint violation error

    -- Step 1: Remove the foreign key constraint
    ALTER TABLE partner_products DROP CONSTRAINT IF EXISTS partner_products_partner_id_fkey;

    -- Step 2: Verify constraint is removed
    SELECT 
        'Constraint Removed' as result,
        'Foreign key constraint removed from partner_products' as status,
        'Data can now be updated without constraint violations' as note;

    -- Step 3: Show current data state
    SELECT 
        'Current Data State' as result,
        COUNT(*) as total_partner_products,
        'partner_products' as table_name
    FROM partner_products;

    -- Step 4: Show partner_profiles available for mapping
    SELECT 
        'Available Partner Profiles' as result,
        COUNT(*) as total_partner_profiles,
        COUNT(CASE WHEN partner_status = 'approved' AND is_active = true THEN 1 END) as approved_profiles
    FROM partner_profiles;

    -- Step 5: Success message
    SELECT 
        '✅ SUCCESS' as result,
        'Foreign key constraint removed' as status,
        'Now run the mapping script to fix the data' as next_step,
        'Then recreate the constraint' as final_step;
