-- Create a server-side function to approve or reject a Stripe payment attempt
-- This function updates the attempt status and the corresponding order
-- When approved, it marks the order as paid and confirmed

CREATE OR REPLACE FUNCTION approve_stripe_attempt(
  attempt_uuid uuid, 
  admin_uuid uuid, 
  action text, 
  rejection_reason text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  attempt RECORD;
  order_result RECORD;
BEGIN
  -- Fetch the stripe payment attempt
  SELECT * FROM stripe_payment_attempts
  WHERE id = attempt_uuid
  INTO attempt;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stripe payment attempt % not found', attempt_uuid;
  END IF;

  -- Validate action
  IF action NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid action: %. Must be approved or rejected.', action;
  END IF;

  -- Update the stripe attempt status
  UPDATE stripe_payment_attempts
  SET 
    status = action,
    confirmed_by = admin_uuid,
    confirmed_at = now(),
    rejection_reason = rejection_reason,
    updated_at = now()
  WHERE id = attempt_uuid;

  -- If approved, update the corresponding order
  IF action = 'approved' THEN
    -- Try to find and update the order by order_number first, then by id
    UPDATE orders
    SET 
      payment_status = 'paid',
      status = 'confirmed',
      updated_at = now()
    WHERE order_number = attempt.order_id
       OR (attempt.order_id ~* '^[0-9a-fA-F-]{36}$' AND id = attempt.order_id::uuid)
    RETURNING * INTO order_result;

    -- Log the approval
    INSERT INTO payment_security_logs (
      user_id, 
      event_type, 
      event_data, 
      admin_id, 
      ip_address, 
      user_agent, 
      created_at
    )
    VALUES (
      attempt.customer_id,
      'stripe_attempt_approved',
      jsonb_build_object(
        'attempt_id', attempt.id,
        'order_id', attempt.order_id,
        'amount', attempt.amount,
        'payment_intent_id', attempt.payment_intent_id
      ),
      admin_uuid,
      NULL,
      NULL,
      now()
    );

  ELSE -- rejected
    -- Update order to failed
    UPDATE orders
    SET 
      payment_status = 'failed',
      status = 'pending',
      updated_at = now()
    WHERE order_number = attempt.order_id
       OR (attempt.order_id ~* '^[0-9a-fA-F-]{36}$' AND id = attempt.order_id::uuid)
    RETURNING * INTO order_result;

    -- Log the rejection
    INSERT INTO payment_security_logs (
      user_id, 
      event_type, 
      event_data, 
      admin_id, 
      ip_address, 
      user_agent, 
      created_at
    )
    VALUES (
      attempt.customer_id,
      'stripe_attempt_rejected',
      jsonb_build_object(
        'attempt_id', attempt.id,
        'order_id', attempt.order_id,
        'amount', attempt.amount,
        'payment_intent_id', attempt.payment_intent_id,
        'reason', rejection_reason
      ),
      admin_uuid,
      NULL,
      NULL,
      now()
    );
  END IF;

  -- Return result with order details
  result := jsonb_build_object(
    'success', true,
    'action', action,
    'attempt_id', attempt.id,
    'order_id', attempt.order_id,
    'order_number', attempt.order_number,
    'amount', attempt.amount,
    'status', action,
    'message', CASE 
      WHEN action = 'approved' THEN 'Payment approved successfully. Order marked as paid.'
      WHEN action = 'rejected' THEN 'Payment rejected. Order returned to pending.'
      ELSE 'Payment processed.'
    END
  );

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'attempt_id', attempt_uuid
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated role
GRANT EXECUTE ON FUNCTION approve_stripe_attempt(uuid, uuid, text, text) TO authenticated;

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_stripe_attempts_status_created 
ON stripe_payment_attempts(status, created_at DESC);
