-- Find which store has the mismatched slug
SELECT 
  id,
  store_name,
  store_slug,
  LOWER(REPLACE(store_name, ' ', '-')) as "expected_slug",
  CASE 
    WHEN store_slug = LOWER(REPLACE(store_name, ' ', '-')) THEN 'MATCH'
    ELSE 'MISMATCH' 
  END as slug_status
FROM partner_profiles
WHERE is_active = true 
  AND partner_status = 'approved'
  AND store_slug != LOWER(REPLACE(store_name, ' ', '-'))
ORDER BY store_name;

-- Fix the mismatched slug - UNCOMMENT to apply
/*
UPDATE partner_profiles
SET store_slug = LOWER(REPLACE(store_name, ' ', '-'))
WHERE store_slug != LOWER(REPLACE(store_name, ' ', '-'))
  AND is_active = true 
  AND partner_status = 'approved';
*/

-- Verify all slugs are now consistent
SELECT COUNT(*) as "Mismatched slugs remaining"
FROM partner_profiles
WHERE is_active = true 
  AND partner_status = 'approved'
  AND store_slug != LOWER(REPLACE(store_name, ' ', '-'));
