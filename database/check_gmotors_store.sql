-- Find the Gmotors store and check its status
SELECT 
  id,
  store_name,
  store_slug,
  is_active,
  partner_status,
  user_id,
  created_at
FROM partner_profiles
WHERE LOWER(store_name) LIKE '%gmotors%'
   OR LOWER(store_slug) LIKE '%gmotors%'
ORDER BY store_name;

-- Check if gmotors slug specifically exists
SELECT 
  id,
  store_name,
  store_slug,
  is_active,
  partner_status
FROM partner_profiles
WHERE store_slug = 'gmotors';

-- Check products for Gmotors
SELECT 
  pp.id,
  pp.partner_id,
  COUNT(*) as product_count
FROM partner_products pp
WHERE pp.partner_id = (
  SELECT id FROM partner_profiles 
  WHERE store_slug = 'gmotors' OR LOWER(store_name) = 'gmotors'
)
GROUP BY pp.id, pp.partner_id;

-- If Gmotors wasn't found, show all store slugs
SELECT 
  store_name,
  store_slug
FROM partner_profiles
WHERE is_active = true AND partner_status = 'approved'
ORDER BY store_name;
