-- Fix permissions for tracking system
-- Run this in your Supabase SQL Editor

-- 1. Grant basic permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON order_tracking TO authenticated;
GRANT ALL ON tracking_updates TO authenticated;

-- 2. Grant read permissions to anonymous users (for public tracking)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON order_tracking TO anon;
GRANT SELECT ON tracking_updates TO anon;

-- 3. Fix RLS policies - make sure they're not too restrictive
DROP POLICY IF EXISTS "Admins can view all tracking" ON order_tracking;
DROP POLICY IF EXISTS "Partners can view their tracking" ON order_tracking;
DROP POLICY IF EXISTS "Users can view tracking by number" ON order_tracking;
DROP POLICY IF EXISTS "Admins can insert tracking" ON order_tracking;
DROP POLICY IF EXISTS "Admins can update tracking" ON order_tracking;

DROP POLICY IF EXISTS "Admins can view all updates" ON tracking_updates;
DROP POLICY IF EXISTS "Partners can view their updates" ON tracking_updates;
DROP POLICY IF EXISTS "Users can view updates by tracking number" ON tracking_updates;
DROP POLICY IF EXISTS "Admins can insert updates" ON tracking_updates;

-- 4. Create simplified RLS policies
CREATE POLICY "Enable read access for all authenticated users" ON order_tracking
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for admin users" ON order_tracking
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>''role'' = ''admin''
        )
    );

CREATE POLICY "Enable update for admin users" ON order_tracking
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>''role'' = ''admin''
        )
    );

-- Policies for tracking_updates
CREATE POLICY "Enable read access for all authenticated users" ON tracking_updates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for admin users" ON tracking_updates
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>''role'' = ''admin''
        )
    );

-- 5. Public access for tracking by number (read-only)
CREATE POLICY "Public read access by tracking number" ON order_tracking
    FOR SELECT USING (
        auth.role() = 'anon' 
        AND tracking_number IS NOT NULL
    );

CREATE POLICY "Public read access for tracking updates" ON tracking_updates
    FOR SELECT USING (
        auth.role() = 'anon' 
        AND EXISTS (
            SELECT 1 FROM order_tracking ot 
            WHERE ot.id = tracking_updates.tracking_id 
            AND ot.tracking_number IS NOT NULL
        )
    );

-- 6. Verify permissions
SELECT 
    schemaname,
    tablename,
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE tablename IN ('order_tracking', 'tracking_updates')
ORDER BY tablename, grantee;
