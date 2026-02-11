-- DIAGNOSTIC: Check store slugs and what's actually being searched for

-- See all partner stores with their slugs
SELECT 
  id,
  store_name,
  store_slug,
  is_active,
  partner_status,
  created_at
FROM partner_profiles
WHERE is_active = true AND partner_status = 'approved'
ORDER BY store_name;

-- See what slugs look like vs store names
SELECT 
  store_name,
  store_slug,
  LOWER(REPLACE(store_name, ' ', '-')) as "computed_slug_from_name",
  CASE 
    WHEN store_slug = LOWER(REPLACE(store_name, ' ', '-')) THEN 'MATCH'
    ELSE 'MISMATCH' 
  END as slug_status
FROM partner_profiles
WHERE is_active = true AND partner_status = 'approved'
ORDER BY store_name;

-- Fix: Update all store_slugs to match uniform format (if needed)
-- UNCOMMENT to fix mismatched slugs
/*
UPDATE partner_profiles
SET store_slug = LOWER(REPLACE(store_name, ' ', '-'))
WHERE store_slug IS NULL 
   OR store_slug != LOWER(REPLACE(store_name, ' ', '-'));
*/

-- Verify the fix
SELECT 
  'Slugs should now be consistent' as note,
  COUNT(*) as total_stores,
  SUM(CASE WHEN store_slug = LOWER(REPLACE(store_name, ' ', '-')) THEN 1 ELSE 0 END) as matching_slug_format
FROM partner_profiles
WHERE is_active = true AND partner_status = 'approved';
