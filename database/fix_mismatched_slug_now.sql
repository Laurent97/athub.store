-- Show the exact store with mismatched slug
SELECT 
  id,
  store_name,
  store_slug as "actual_slug",
  LOWER(REPLACE(store_name, ' ', '-')) as "correct_slug"
FROM partner_profiles
WHERE is_active = true 
  AND partner_status = 'approved'
  AND store_slug != LOWER(REPLACE(store_name, ' ', '-'));

-- Apply the fix immediately
UPDATE partner_profiles
SET store_slug = LOWER(REPLACE(store_name, ' ', '-'))
WHERE store_slug != LOWER(REPLACE(store_name, ' ', '-'))
  AND is_active = true 
  AND partner_status = 'approved';

-- Verify it's fixed
SELECT COUNT(*) as "Mismatched slugs remaining"
FROM partner_profiles
WHERE is_active = true 
  AND partner_status = 'approved'
  AND store_slug != LOWER(REPLACE(store_name, ' ', '-'));
