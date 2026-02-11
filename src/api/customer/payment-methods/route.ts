import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

// For Vite/React project, export functions for API usage
export async function getCustomerPaymentMethods(user: any) {
  try {
    const { data: paymentMethods, error } = await supabase
      .from('customer_payment_methods')
      .select('*')
      .eq('customer_id', user.id)
      .eq('is_active', true)
      .order('is_default DESC, created_at DESC');

    if (error) {
      console.error('Error fetching payment methods:', error);
      return { error: 'Failed to fetch payment methods', paymentMethods: [] };
    }

    return {
      paymentMethods: paymentMethods || [],
      customer: {
        id: user.id,
        email: user.email
      }
    };
  } catch (error) {
    console.error('Payment methods API error:', error);
    return { error: 'Internal server error', paymentMethods: [] };
  }
}

export async function addPaymentMethod(user: any, paymentData: any) {
  try {
    const { payment_type, provider, account_details, is_default = false } = paymentData;

    // Validate required fields
    if (!payment_type || !provider || !account_details) {
      return { error: 'Missing required fields: payment_type, provider, account_details' };
    }

    // If setting as default, unset other defaults first
    if (is_default) {
      await supabase
        .from('customer_payment_methods')
        .update({ is_default: false })
        .eq('customer_id', user.id);
    }

    const { data: paymentMethod, error } = await supabase
      .from('customer_payment_methods')
      .insert({
        customer_id: user.id,
        payment_type,
        provider,
        account_details, // Should be encrypted in production
        is_default,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding payment method:', error);
      return { error: 'Failed to add payment method' };
    }

    return {
      paymentMethod,
      message: 'Payment method added successfully'
    };

  } catch (error) {
    console.error('Add payment method API error:', error);
    return { error: 'Internal server error' };
  }
}
