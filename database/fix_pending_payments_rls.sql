-- Fix RLS policies for pending_payments to allow all authenticated users to insert payments
-- except wallet payments which are restricted to partner users only

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert own pending payments" ON pending_payments;
DROP POLICY IF EXISTS "Users can view own pending payments" ON pending_payments;
DROP POLICY IF EXISTS "Admins can insert pending payments" ON pending_payments;
DROP POLICY IF EXISTS "Admins can update pending payments" ON pending_payments;
DROP POLICY IF EXISTS "Admins can view all pending payments" ON pending_payments;
DROP POLICY IF EXISTS "Anyone can view pending payments" ON pending_payments;

-- Create policy that allows all authenticated users to insert payments except wallet
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
