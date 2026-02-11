-- Check current partner store status
SELECT 
  id,
  store_name,
  store_slug,
  is_active,
  partner_status,
  user_id,
  created_at
FROM partner_profiles
ORDER BY created_at DESC;

-- Count stores by status
SELECT 
  'By Status' as category,
  'Approved' as status,
  COUNT(*) as count
FROM partner_profiles
WHERE partner_status = 'approved'
UNION ALL
SELECT 'By Status', 'Pending', COUNT(*)
FROM partner_profiles
WHERE partner_status = 'pending'
UNION ALL
SELECT 'By Status', 'Rejected', COUNT(*)
FROM partner_profiles
WHERE partner_status = 'rejected'
UNION ALL
SELECT 'By Active Status', 'Active', COUNT(*)
FROM partner_profiles
WHERE is_active = true
UNION ALL
SELECT 'By Active Status', 'Inactive', COUNT(*)
FROM partner_profiles
WHERE is_active = false
UNION ALL
SELECT 'Meets Display Criteria', 'Yes', COUNT(*)
FROM partner_profiles
WHERE is_active = true AND partner_status = 'approved';

-- FIX: Approve and activate all pending partners
-- UNCOMMENT the following lines to execute:
/*
UPDATE partner_profiles
SET 
  partner_status = 'approved',
  is_active = true,
  approved_at = NOW(),
  activated_at = NOW()
WHERE partner_status = 'pending' OR is_active = false;
*/

-- FIX: Approve and activate a specific partner by store name
-- UNCOMMENT and replace 'YOUR_STORE_NAME' with actual store name:
/*
UPDATE partner_profiles
SET 
  partner_status = 'approved',
  is_active = true,
  approved_at = NOW(),
  activated_at = NOW()
WHERE store_name = 'YOUR_STORE_NAME';
*/

-- FIX: Approve and activate a specific partner by store slug
-- UNCOMMENT and replace 'your-store-slug' with actual store slug:
/*
UPDATE partner_profiles
SET 
  partner_status = 'approved',
  is_active = true,
  approved_at = NOW(),
  activated_at = NOW()
WHERE store_slug = 'your-store-slug';
*/
