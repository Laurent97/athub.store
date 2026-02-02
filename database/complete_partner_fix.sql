-- Complete fix for partner products relationship and RPC function
-- Run this in Supabase SQL Editor to resolve all partner-related issues

-- Step 1: Check and fix the foreign key relationship
DO $$
BEGIN
    -- Check if partner_products table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_products' AND table_schema = 'public') THEN
        -- Check if partner_profiles table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_profiles' AND table_schema = 'public') THEN
            -- Check if the foreign key constraint already exists
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'partner_products_partner_id_fkey' 
                AND table_name = 'partner_products'
                AND table_schema = 'public'
            ) THEN
                -- Add the foreign key constraint
                EXECUTE '
                    ALTER TABLE partner_products 
                    ADD CONSTRAINT partner_products_partner_id_fkey 
                    FOREIGN KEY (partner_id) 
                    REFERENCES partner_profiles(id) 
                    ON DELETE CASCADE
                ';
                RAISE NOTICE 'Foreign key constraint added successfully';
            ELSE
                RAISE NOTICE 'Foreign key constraint already exists';
            END IF;
        ELSE
            RAISE NOTICE 'partner_profiles table does not exist';
        END IF;
    ELSE
        RAISE NOTICE 'partner_products table does not exist';
    END IF;
END $$;

-- Step 2: Drop and recreate the get_partner_products RPC function
DROP FUNCTION IF EXISTS get_partner_products(p_partner_id UUID);

-- Step 3: Create the corrected RPC function
CREATE OR REPLACE FUNCTION get_partner_products(p_partner_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            json_build_object(
                'id', pp.id,
                'partner_id', pp.partner_id,
                'product_id', pp.product_id,
                'selling_price', pp.selling_price,
                'profit_margin', pp.profit_margin,
                'is_active', pp.is_active,
                'created_at', pp.created_at,
                'updated_at', pp.updated_at,
                'product', row_to_json(p)
            ) ORDER BY pp.created_at DESC
        )
        FROM public.partner_products pp
        LEFT JOIN public.products p ON pp.product_id = p.id
        WHERE pp.partner_id = p_partner_id AND pp.is_active = true
    );
END;
$$;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION get_partner_products(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_partner_products(UUID) TO service_role;

-- Step 5: Create a fallback function that returns empty array if no data
CREATE OR REPLACE FUNCTION get_partner_products_safe(p_partner_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN COALESCE(
        (SELECT json_agg(
            json_build_object(
                'id', pp.id,
                'partner_id', pp.partner_id,
                'product_id', pp.product_id,
                'selling_price', pp.selling_price,
                'profit_margin', pp.profit_margin,
                'is_active', pp.is_active,
                'created_at', pp.created_at,
                'updated_at', pp.updated_at,
                'product', row_to_json(p)
            ) ORDER BY pp.created_at DESC
        )
        FROM public.partner_products pp
        LEFT JOIN public.products p ON pp.product_id = p.id
        WHERE pp.partner_id = p_partner_id AND pp.is_active = true),
        '[]'::json
    );
END;
$$;

-- Step 6: Grant permissions for safe function
GRANT EXECUTE ON FUNCTION get_partner_products_safe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_partner_products_safe(UUID) TO service_role;

-- Step 7: Verify everything is working
SELECT 
    'Verification' as step,
    'Foreign Key Check' as item,
    COUNT(*) as count
FROM information_schema.table_constraints 
WHERE constraint_name = 'partner_products_partner_id_fkey' 
AND table_name = 'partner_products'
AND table_schema = 'public'

UNION ALL

SELECT 
    'Verification' as step,
    'RPC Function Check' as item,
    COUNT(*) as count
FROM pg_proc 
WHERE proname = 'get_partner_products'

UNION ALL

SELECT 
    'Verification' as step,
    'Safe RPC Function Check' as item,
    COUNT(*) as count
FROM pg_proc 
WHERE proname = 'get_partner_products_safe';

-- Step 8: Test the function (this will return null if no partner_id exists, which is expected)
SELECT get_partner_products_safe('00000000-0000-0000-0000-000000000000'::UUID) as test_result;

-- Final notice
DO $$
BEGIN
    RAISE NOTICE 'Partner products fix completed successfully!';
END $$;
