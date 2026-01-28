-- Check and integrate order_tracking_history table
-- This script examines the order_tracking_history table structure and usage

-- Check the structure of order_tracking_history
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'order_tracking_history' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check existing data in order_tracking_history
SELECT 
  'ORDER_TRACKING_HISTORY DATA' as table_name,
  COUNT(*) as record_count
FROM order_tracking_history;

-- Sample of existing history records
SELECT 
  history_id,
  order_reference,
  old_status,
  new_status,
  changed_by,
  change_reason,
  notes,
  created_at
FROM order_tracking_history 
ORDER BY created_at DESC
LIMIT 5;

-- Check how this relates to orders table
SELECT 
  'ORDERS TABLE SAMPLE' as table_name,
  id,
  order_number,
  status,
  payment_status,
  created_at
FROM orders 
LIMIT 3;

-- Check relationship between order_tracking and order_tracking_history
SELECT 
  'RELATIONSHIP CHECK' as check_type,
  COUNT(DISTINCT ot.order_id) as tracking_orders,
  COUNT(DISTINCT oth.order_reference) as history_orders
FROM order_tracking ot
FULL OUTER JOIN order_tracking_history oth ON ot.order_id = oth.order_reference::text;

-- Test: Create a history entry when tracking is updated
-- This simulates what should happen when admin adds tracking
DO $$
DECLARE
  test_order_id UUID;
BEGIN
  -- Get a test order ID
  SELECT id INTO test_order_id FROM orders LIMIT 1;
  
  IF test_order_id IS NOT NULL THEN
    INSERT INTO order_tracking_history (
      order_reference,
      old_status,
      new_status,
      changed_by,
      change_reason,
      notes
    ) VALUES (
      test_order_id,
      'confirmed',
      'shipped',
      (SELECT id FROM users WHERE user_type = 'admin' LIMIT 1),
      'Tracking information added',
      'Package shipped with tracking number'
    );
    
    RAISE NOTICE 'Created history entry for order: %', test_order_id;
  END IF;
END $$;

-- Verify the history entry was created
SELECT 
  'NEW HISTORY ENTRY' as check_type,
  history_id,
  order_reference,
  old_status,
  new_status,
  change_reason,
  created_at
FROM order_tracking_history 
WHERE change_reason = 'Tracking information added'
ORDER BY created_at DESC
LIMIT 1;
