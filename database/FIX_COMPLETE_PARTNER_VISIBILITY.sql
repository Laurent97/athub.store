-- COMPLETE FIX FOR PARTNER STORES AND PRODUCTS VISIBILITY
-- Run all sections in order in Supabase SQL Editor

-- SECTION 1: FIX DATA ISSUES
-- Make sure all partners are approved and active
UPDATE partner_profiles
SET 
  is_active = true,
  partner_status = 'approved',
  approved_at = COALESCE(approved_at, NOW()),
  activated_at = COALESCE(activated_at, NOW())
WHERE partner_status IS NULL 
  OR partner_status != 'approved' 
  OR is_active IS NULL 
  OR is_active = false;

-- SECTION 2: FIX RLS POLICIES ON PARTNER_PROFILES
-- Enable RLS
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies (clean slate)
DROP POLICY IF EXISTS "Users can view own partner profile" ON partner_profiles;
DROP POLICY IF EXISTS "Public viewing for approved partners" ON partner_profiles;
DROP POLICY IF EXISTS "Authenticated users can view approved partners" ON partner_profiles;
DROP POLICY IF EXISTS "Anyone can view approved partners" ON partner_profiles;
DROP POLICY IF EXISTS "Approved partners readable by anyone" ON partner_profiles;

-- Create new, simple policies
CREATE POLICY "Anyone can view approved active partners" ON partner_profiles
  FOR SELECT 
  USING (is_active = true AND partner_status = 'approved');

CREATE POLICY "Users can view and edit own profile" ON partner_profiles
  FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can do anything" ON partner_profiles
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- SECTION 3: FIX RLS POLICIES ON PARTNER_PRODUCTS
-- Enable RLS
ALTER TABLE partner_products ENABLE ROW LEVEL SECURITY;

-- Drop old policies (clean slate)
DROP POLICY IF EXISTS "Partners can insert own partner products" ON partner_products;
DROP POLICY IF EXISTS "Partners can update own partner products" ON partner_products;
DROP POLICY IF EXISTS "Partners can view own partner products" ON partner_products;
DROP POLICY IF EXISTS "Partners can insert own products" ON partner_products;
DROP POLICY IF EXISTS "Partners can update own products" ON partner_products;
DROP POLICY IF EXISTS "Partners can view own products" ON partner_products;
DROP POLICY IF EXISTS "Public can view active partner products" ON partner_products;
DROP POLICY IF EXISTS "Authenticated users can view active partner products" ON partner_products;
DROP POLICY IF EXISTS "Admins can manage all partner products" ON partner_products;
DROP POLICY IF EXISTS "Anyone can view active products" ON partner_products;
DROP POLICY IF EXISTS "Partners manage own products" ON partner_products;

-- Create new policies
CREATE POLICY "Anyone can view active products" ON partner_products
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Partners can manage own products" ON partner_products
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM partner_profiles 
      WHERE partner_profiles.id = partner_products.partner_id 
      AND partner_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can update own products" ON partner_products
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM partner_profiles 
      WHERE partner_profiles.id = partner_products.partner_id 
      AND partner_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can do anything" ON partner_products
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- SECTION 4: GRANT PERMISSIONS
GRANT SELECT ON partner_profiles TO anon, authenticated;
GRANT SELECT ON partner_products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON partner_products TO authenticated;
GRANT SELECT ON products TO anon, authenticated;

-- SECTION 5: VERIFY THE FIX
-- Check that partners display properly
SELECT COUNT(*) as "Displayable Partner Stores"
FROM partner_profiles
WHERE is_active = true AND partner_status = 'approved';

-- Check partner products
SELECT 
  pr.store_name,
  COUNT(pp.id) as product_count
FROM partner_profiles pr
LEFT JOIN partner_products pp ON pp.partner_id = pr.id
WHERE pr.is_active = true AND pr.partner_status = 'approved'
GROUP BY pr.id, pr.store_name
ORDER BY product_count DESC;
