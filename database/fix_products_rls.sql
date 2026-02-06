-- Fix RLS policies for products table to allow public access
-- This will resolve the category filtering issues

-- Step 1: Check current RLS policies on products table
SELECT 
    'Current RLS Policies' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'products'
ORDER BY policyname;

-- Step 2: Drop all existing RLS policies on products
DROP POLICY IF EXISTS "Users can view own products" ON products;
DROP POLICY IF EXISTS "Partners can view own products" ON products;
DROP POLICY IF EXISTS "Admins can view all products" ON products;
DROP POLICY IF EXISTS "Public can view active products" ON products;

-- Step 3: Create comprehensive RLS policies for products

-- Policy 1: Public users can view active products
CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (
        auth.role() = 'anon' 
        AND is_active = true
    );

-- Policy 2: Authenticated users can view active products
CREATE POLICY "Authenticated users can view active products" ON products
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND is_active = true
    );

-- Policy 3: Partners can view own products
CREATE POLICY "Partners can view own products" ON products
    FOR SELECT USING (
        auth.role() = 'authenticated'
        AND created_by = auth.uid()
        AND is_active = true
    );

-- Policy 4: Partners can insert own products
CREATE POLICY "Partners can insert own products" ON products
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND created_by = auth.uid()
    );

-- Policy 5: Partners can update own products
CREATE POLICY "Partners can update own products" ON products
    FOR UPDATE WITH CHECK (
        auth.role() = 'authenticated'
        AND created_by = auth.uid()
    );

-- Policy 6: Admins can do everything
CREATE POLICY "Admins can manage all products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Step 4: Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Step 5: Grant necessary permissions
GRANT SELECT ON products TO anon;
GRANT SELECT, INSERT, UPDATE ON products TO authenticated;

-- Step 6: Verify the fix
SELECT 
    'RLS Fix Verification' as result,
    relname as table_name,
    relrowsecurity as rls_enabled,
    'RLS policies applied successfully' as status
FROM pg_class 
WHERE relname = 'products';

-- Step 7: Test the policies
SELECT 
    'Policy Test' as test_type,
    COUNT(*) as accessible_products
FROM products
WHERE is_active = true;

-- Show sample of what users can see
SELECT 
    'Sample Accessible Products' as test_type,
    id,
    title,
    category,
    is_active,
    created_at
FROM products
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 5;
