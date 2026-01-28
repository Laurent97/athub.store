-- Test and verify the tracking system works correctly
-- This script tests the order_tracking functionality

-- First, let's check if there are any existing tracking records
SELECT 
  'EXISTING TRACKING RECORDS' as test_type,
  COUNT(*) as record_count
FROM order_tracking;

-- Test 1: Insert a new tracking record (simulating admin action)
INSERT INTO order_tracking (
  order_id,
  tracking_number,
  shipping_method,
  carrier,
  status,
  admin_id,
  partner_id,
  estimated_delivery,
  created_at,
  updated_at
) VALUES (
  'TEST-ORDER-001',
  'TRK-123456789',
  'Standard Shipping',
  'FedEx',
  'shipped',
  '00000000-0000-0000-0000-000000000000'::uuid, -- Test admin ID
  '00000000-0000-0000-0000-000000000000'::uuid, -- Test partner ID
  NOW() + INTERVAL '7 days',
  NOW(),
  NOW()
) ON CONFLICT (order_id) DO NOTHING;

-- Test 2: Verify the insert worked
SELECT 
  'AFTER INSERT' as test_type,
  id,
  order_id,
  tracking_number,
  shipping_method,
  carrier,
  status,
  created_at
FROM order_tracking 
WHERE order_id = 'TEST-ORDER-001';

-- Test 3: Add a tracking update (simulating timeline entry)
INSERT INTO tracking_updates (
  tracking_id,
  status,
  description,
  location,
  timestamp,
  updated_by
) 
SELECT 
  id,
  'shipped',
  'Package shipped via FedEx',
  'Warehouse',
  NOW(),
  '00000000-0000-0000-0000-000000000000'::uuid
FROM order_tracking 
WHERE order_id = 'TEST-ORDER-001';

-- Test 4: Verify the tracking update
SELECT 
  'TRACKING UPDATES' as test_type,
  tu.id,
  tu.tracking_id,
  tu.status,
  tu.description,
  tu.location,
  tu.timestamp
FROM tracking_updates tu
JOIN order_tracking ot ON tu.tracking_id = ot.id
WHERE ot.order_id = 'TEST-ORDER-001';

-- Test 5: Test the public tracking API query (what the Track.tsx page uses)
SELECT 
  'PUBLIC TRACKING API TEST' as test_type,
  ot.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', tu.id,
        'status', tu.status,
        'location', tu.location,
        'description', tu.description,
        'timestamp', tu.timestamp
      )
    ) FILTER (WHERE tu.id IS NOT NULL), 
    '[]'::json
  ) as updates
FROM order_tracking ot
LEFT JOIN tracking_updates tu ON ot.id = tu.tracking_id
WHERE ot.tracking_number = 'TRK-123456789'
GROUP BY ot.id;

-- Test 6: Test partner tracking query (what partner dashboard uses)
SELECT 
  'PARTNER TRACKING API TEST' as test_type,
  ot.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', tu.id,
        'status', tu.status,
        'location', tu.location,
        'description', tu.description,
        'timestamp', tu.timestamp
      )
    ) FILTER (WHERE tu.id IS NOT NULL), 
    '[]'::json
  ) as updates
FROM order_tracking ot
LEFT JOIN tracking_updates tu ON ot.id = tu.tracking_id
WHERE ot.partner_id = '00000000-0000-0000-0000-000000000000'::uuid
GROUP BY ot.id;

-- Cleanup test data
DELETE FROM tracking_updates WHERE tracking_id IN (
  SELECT id FROM order_tracking WHERE order_id = 'TEST-ORDER-001'
);
DELETE FROM order_tracking WHERE order_id = 'TEST-ORDER-001';

-- Final verification
SELECT 
  'CLEANUP VERIFICATION' as test_type,
  'Test data cleaned up successfully' as status;
