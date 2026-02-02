-- Create a server-side function to verify a pending payment and mark order as paid
-- Runs as SECURITY DEFINER so it can perform necessary updates

CREATE OR REPLACE FUNCTION verify_pending_payment(payment_uuid uuid, admin_uuid uuid)
RETURNS void AS $$
DECLARE
  p RECORD;
BEGIN
  -- Update the pending payment to verified
  UPDATE pending_payments
  SET status = 'verified', confirmed_by = admin_uuid, confirmed_at = now()
  WHERE id = payment_uuid
  RETURNING * INTO p;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending payment % not found', payment_uuid;
  END IF;

  -- Update corresponding order: try by order_number first, then by id
  UPDATE orders
  SET payment_status = 'paid', status = 'confirmed', updated_at = now()
  WHERE order_number = p.order_id
     OR (p.order_id ~* '^[0-9a-fA-F-]{36}$' AND id = p.order_id::uuid);

  -- Insert a security log entry
  INSERT INTO payment_security_logs (user_id, event_type, event_data, admin_id, created_at)
  VALUES (
    p.customer_id,
    'payment_verified',
    jsonb_build_object(
      'payment_id', p.id,
      'order_id', p.order_id,
      'amount', p.amount,
      'payment_method', p.payment_method
    ),
    admin_uuid,
    now()
  );

  -- If there's an existing helper RPC to move orders, attempt to call it (ignore if not defined)
  BEGIN
    PERFORM move_to_paid_orders(p.order_id);
  EXCEPTION WHEN undefined_function THEN
    -- ignore if RPC not present
    NULL;
  END;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated role so the app can call this RPC when authenticated
GRANT EXECUTE ON FUNCTION verify_pending_payment(uuid, uuid) TO authenticated;
