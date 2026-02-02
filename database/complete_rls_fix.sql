-- Complete RLS Policy Fix for pending_payments
-- This script drops ALL existing policies and creates new ones with proper restrictions

-- First, drop ALL existing policies on pending_payments
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'pending_payments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON pending_payments', policy_record.policyname);
    END LOOP;
END $$;

-- Now create new policies with proper restrictions

-- Allow all authenticated users to insert payments except wallet (partner/admin only)
CREATE POLICY "Anyone can insert non-wallet pending payments" ON pending_payments
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND (
            payment_method != 'wallet' 
            OR (
                payment_method = 'wallet' 
                AND EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE users.id = auth.uid() 
                    AND users.user_type IN ('partner', 'admin')
                )
            )
        )
    );

-- Allow all authenticated users to view pending payments (for admin verification)
CREATE POLICY "Anyone can view pending payments" ON pending_payments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins to update pending payments
CREATE POLICY "Admins can update pending payments" ON pending_payments
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Allow admins to delete pending payments
CREATE POLICY "Admins can delete pending payments" ON pending_payments
    FOR DELETE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Verify policies were created correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'pending_payments'
ORDER BY policyname;
