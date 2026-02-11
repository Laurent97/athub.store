-- DIAGNOSTIC QUERIES - Run these to see what's in your database

-- 1. Check partner profiles and their status
SELECT 
  'PARTNER PROFILES' as section,
  id,
  user_id,
  store_name,
  store_slug,
  is_active,
  partner_status,
  created_at
FROM partner_profiles
ORDER BY created_at DESC
LIMIT 20;

-- 2. Count partners by status
SELECT 
  'STATUS SUMMARY' as section,
  partner_status,
  is_active,
  COUNT(*) as total
FROM partner_profiles
GROUP BY partner_status, is_active
ORDER BY total DESC;

-- 3. Check how many meet the display criteria
SELECT 
  COUNT(*) as "Stores that will display in Manufacturers page"
FROM partner_profiles
WHERE is_active = true AND partner_status = 'approved';

-- 4. Check partner products
SELECT 
  'PARTNER PRODUCTS' as section,
  pp.id,
  pp.partner_id,
  pp.product_id,
  pp.is_active,
  pp.created_at,
  pr.store_name,
  p.title
FROM partner_products pp
LEFT JOIN partner_profiles pr ON pp.partner_id = pr.id
LEFT JOIN products p ON pp.product_id = p.id
ORDER BY pp.created_at DESC
LIMIT 20;

-- 5. Count products per partner
SELECT 
  pr.store_name,
  COUNT(pp.id) as product_count,
  pr.id as partner_id,
  pr.is_active,
  pr.partner_status
FROM partner_profiles pr
LEFT JOIN partner_products pp ON pp.partner_id = pr.id
GROUP BY pr.id, pr.store_name, pr.is_active, pr.partner_status
ORDER BY product_count DESC;

-- PART 2: FIXES - Uncomment to apply

-- FIX 1: Activate all pending partners and make them approved
/*
UPDATE partner_profiles
SET 
  is_active = true,
  partner_status = 'approved',
  approved_at = NOW(),
  activated_at = NOW()
WHERE partner_status != 'approved' OR is_active = false;
*/

-- FIX 2: Enable RLS on partner_profiles table
/*
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own partner profile" ON partner_profiles;
DROP POLICY IF EXISTS "Public viewing for approved partners" ON partner_profiles;
DROP POLICY IF EXISTS "Authenticated users can view approved partners" ON partner_profiles;

-- Create new policies
CREATE POLICY "Anyone can view approved partners" ON partner_profiles
  FOR SELECT USING (is_active = true AND partner_status = 'approved');

CREATE POLICY "Users can view own profile" ON partner_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON partner_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all" ON partner_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin')
  );
*/

-- FIX 3: Enable RLS on partner_products table and add policies
/*
ALTER TABLE partner_products ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Public can view active partner products" ON partner_products;
DROP POLICY IF EXISTS "Authenticated users can view active partner products" ON partner_products;
DROP POLICY IF EXISTS "Partners can insert own products" ON partner_products;
DROP POLICY IF EXISTS "Partners can update own products" ON partner_products;
DROP POLICY IF EXISTS "Partners can view own products" ON partner_products;
DROP POLICY IF EXISTS "Admins can manage all partner products" ON partner_products;

-- Create new policies
CREATE POLICY "Anyone can view active products" ON partner_products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Partners manage own products" ON partner_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM partner_profiles 
      WHERE id = partner_products.partner_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all" ON partner_products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin')
  );
*/

-- FIX 4: Grant permissions
/*
GRANT SELECT ON partner_profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON partner_products TO authenticated;
GRANT SELECT ON products TO anon, authenticated;
*/
