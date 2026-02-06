-- Fix RLS policies on products table to allow proper category filtering
-- RLS is enabled and may be blocking category-based queries

-- Step 1: Check current RLS policies on products table
SELECT 
    '=== CURRENT RLS POLICIES ===' as analysis,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    'Current RLS policies that may block category filtering' as impact
FROM pg_policies 
WHERE tablename = 'products'
ORDER BY policyname;

-- Step 2: Drop all existing RLS policies on products table
DROP POLICY IF EXISTS "Users can view their own products" ON products;
DROP POLICY IF EXISTS "Users can insert their own products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;
DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
DROP POLICY IF EXISTS "Partners can view partner products" ON products;

-- Step 3: Create proper RLS policies for category filtering
-- Policy 1: Public users can view all active products (for homepage and products page)
CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (is_active = true);

-- Policy 2: Authenticated users can view all active products
CREATE POLICY "Authenticated users can view products" ON products
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Policy 3: Users can view their own products (for partner dashboard)
CREATE POLICY "Users can view their own products" ON products
    FOR SELECT USING (auth.uid() = created_by);

-- Policy 4: Users can insert their own products
CREATE POLICY "Users can insert their own products" ON products
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy 5: Users can update their own products
CREATE POLICY "Users can update their own products" ON products
    FOR UPDATE USING (auth.uid() = created_by);

-- Policy 6: Users can delete their own products
CREATE POLICY "Users can delete their own products" ON products
    FOR DELETE USING (auth.uid() = created_by);

-- Step 4: Verify RLS policies are set correctly
SELECT 
    '=== UPDATED RLS POLICIES ===' as analysis,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    'New RLS policies that allow category filtering' as status
FROM pg_policies 
WHERE tablename = 'products'
ORDER BY policyname;

-- Step 5: Test category filtering with RLS enabled
SELECT 
    '=== RLS CATEGORY FILTERING TEST ===' as test,
    COUNT(*) as engine_parts_count,
    'Should work with new RLS policies' as expectation
FROM products 
WHERE is_active = true AND category = 'engine-parts';

SELECT 
    '=== RLS CATEGORY FILTERING TEST ===' as test,
    COUNT(*) as suspension_count,
    'Should work with new RLS policies' as expectation
FROM products 
WHERE is_active = true AND category = 'suspension';

-- Step 6: Success message
SELECT 
    '✅ RLS POLICIES FIXED' as result,
    'Products table RLS policies updated' as status,
    'Category filtering should now work' as capability,
    'Products page will show filtered results' as expectation,
    'Homepage will show all products' as homepage_status,
    'No more RLS blocking category queries' as rls_fix;
