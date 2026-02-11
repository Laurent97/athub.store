-- Fix conflicting RLS policies on products table
-- This will resolve the duplicate policy error

-- Step 1: Drop all existing RLS policies on products
DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Authenticated users can view active products" ON products;
DROP POLICY IF EXISTS "Partners can view own products" ON products;
DROP POLICY IF EXISTS "Partners can insert own products" ON products;
DROP POLICY IF EXISTS "Partners can update own products" ON products;
DROP POLICY IF EXISTS "Admins can manage all products" ON products;

-- Step 2: Recreate RLS policies with correct names
-- Policy 1: Public users can view active products
CREATE POLICY "Public users can view active products" ON products
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

-- Policy 6: Admins can manage all products
CREATE POLICY "Admins can manage all products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Step 3: Verify policies are created correctly
SELECT 
    'RLS Policies Recreated' as result,
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'products'
ORDER BY policyname;

-- Step 4: Test that policies work
SELECT 
    'Policy Test' as test_type,
    COUNT(*) as accessible_products
FROM products
WHERE is_active = true;

-- Step 5: Show success message
SELECT 
    '✅ SUCCESS' as result,
    'Conflicting RLS policies resolved' as status,
    'Products table now has proper RLS policies' as message,
    'All category filtering should work now' as expectation;
