import { supabase } from './client';
import { ShippingTaxPayment, ShippingTaxPaymentStatus } from '@/lib/types/database';
import { notificationService } from '@/services/notificationService';

export const shippingTaxPaymentService = {
  /**
   * Check if order requires shipping and tax payment
   * Partners don't need to pay shipping/tax
   */
  async isShippingTaxPaymentRequired(orderId: string): Promise<boolean> {
    const { data: order, error } = await supabase
      .from('orders')
      .select('partner_id')
      .eq('id', orderId)
      .single();

    if (error) throw error;

    // If no partner_id, it's a direct customer order - requires payment
    // If partner_id exists, it's partner order - no payment required
    return !order.partner_id;
  },

  /**
   * Create shipping tax payment record when admin sets fees
   */
  async createShippingTaxPayment(
    orderId: string,
    shippingFee: number,
    taxFee: number
  ) {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('customer_id, partner_id')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // If partner order, no payment needed
    if (order.partner_id) {
      return {
        data: null,
        message: 'Partner orders do not require shipping/tax payment'
      };
    }

    // Update orders table with fees
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        shipping_fee: shippingFee,
        tax_fee: taxFee,
        shipping_tax_payment_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // Create shipping_tax_payments record if table exists
    try {
      const { data: payment, error: paymentError } = await supabase
        .from('shipping_tax_payments')
        .insert({
          order_id: orderId,
          customer_id: order.customer_id,
          shipping_fee: shippingFee,
          tax_fee: taxFee,
          status: 'pending'
        })
        .select()
        .single();

      if (paymentError && paymentError.code !== 'PGRST204') {
        console.warn('Could not create shipping_tax_payments record:', paymentError);
      }

      return { data: payment, error: null };
    } catch (e) {
      console.warn('Shipping tax payments table may not exist yet');
      return { data: null, error: null };
    }
  },

  /**
   * Get shipping tax payment details for order
   */
  async getShippingTaxPayment(orderId: string) {
    const { data: order, error } = await supabase
      .from('orders')
      .select('shipping_fee, tax_fee, shipping_tax_payment_status, shipping_tax_paid_at')
      .eq('id', orderId)
      .single();

    if (error) throw error;

    return {
      shipping_fee: order.shipping_fee || 0,
      tax_fee: order.tax_fee || 0,
      total_amount: (order.shipping_fee || 0) + (order.tax_fee || 0),
      payment_status: order.shipping_tax_payment_status || 'not_required',
      paid_at: order.shipping_tax_paid_at
    };
  },

  /**
   * Update payment status for order
   */
  async updateShippingTaxPaymentStatus(
    orderId: string,
    status: ShippingTaxPaymentStatus,
    transactionRef?: string,
    paymentMethod?: string
  ) {
    const updateData: any = {
      shipping_tax_payment_status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'paid') {
      updateData.shipping_tax_paid_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) throw error;

    // Also update shipping_tax_payments record if it exists
    if (status === 'paid' || status === 'rejected') {
      try {
        await supabase
          .from('shipping_tax_payments')
          .update({
            payment_status: status,
            transaction_reference: transactionRef,
            payment_method: paymentMethod,
            paid_at: status === 'paid' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('order_id', orderId);
      } catch (e) {
        console.warn('Could not update shipping_tax_payments record:', e);
      }
    }

    return { error: null };
  },

  /**
   * Process shipping tax payment (called after successful payment)
   */
  async processPayment(
    orderId: string,
    paymentMethod: string,
    transactionRef: string,
    amount: number
  ) {
    // Get current order state
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('customer_id, shipping_fee, tax_fee, shipping_tax_payment_status')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    const expectedAmount = (order.shipping_fee || 0) + (order.tax_fee || 0);

    // Verify payment amount
    if (Math.abs(amount - expectedAmount) > 0.01) {
      throw new Error(
        `Payment amount mismatch. Expected $${expectedAmount}, got $${amount}`
      );
    }

    // Update to pending_confirmation status (payment received, awaiting admin confirmation)
    await this.updateShippingTaxPaymentStatus(
      orderId,
      'pending_confirmation',
      transactionRef,
      paymentMethod
    );

    // Send notification to customer
    await notificationService.sendNotification(
      order.customer_id,
      'Shipping & Tax Payment Received',
      'Your shipping and tax payment has been received. The admin will confirm shortly.',
      'info',
      `/orders/${orderId}`,
      'payment'
    );

    return { success: true };
  },

  /**
   * Admin confirms payment (makes it visible to customer)
   */
  async confirmPayment(orderId: string) {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('customer_id')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Update status to paid
    await this.updateShippingTaxPaymentStatus(orderId, 'paid');

    // Send notification to customer
    await notificationService.sendNotification(
      order.customer_id,
      'Shipping & Tax Payment Confirmed',
      'Your payment has been confirmed. You can now view tracking information and invoice.',
      'success',
      `/orders/${orderId}`,
      'payment'
    );

    return { success: true };
  },

  /**
   * Admin rejects payment with reason
   */
  async rejectPayment(orderId: string, reason: string) {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('customer_id')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Update status to rejected
    await supabase
      .from('orders')
      .update({
        shipping_tax_payment_status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    // Update shipping_tax_payments record with reason
    try {
      await supabase
        .from('shipping_tax_payments')
        .update({
          payment_status: 'rejected',
          rejected_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId);
    } catch (e) {
      console.warn('Could not update shipping_tax_payments record:', e);
    }

    // Send notification to customer with rejection reason
    await notificationService.sendNotification(
      order.customer_id,
      'Shipping & Tax Payment Rejected',
      `Your payment was rejected: ${reason}. Please contact support.`,
      'error',
      `/orders/${orderId}`,
      'payment'
    );

    return { success: true };
  },

  /**
   * Get pending shipping tax payments for admin dashboard
   */
  async getPendingShippingTaxPayments(limit = 50) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_id,
        shipping_fee,
        tax_fee,
        shipping_tax_payment_status,
        created_at,
        users:customer_id(email, full_name)
      `)
      .eq('shipping_tax_payment_status', 'pending_confirmation')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data, error };
  },

  /**
   * Check if customer can view tracking/invoice
   */
  canViewTrackingAndInvoice(order: any): boolean {
    // Customer can view tracking/invoice only if:
    // 1. It's a partner order (no payment required), OR
    // 2. Shipping tax payment is paid/confirmed
    const isPartnerOrder = !!order.partner_id;
    const isPaymentPaid = order.shipping_tax_payment_status === 'paid';

    return isPartnerOrder || isPaymentPaid;
  },

  /**
   * Check if customer should see payment prompt
   */
  shouldShowPaymentPrompt(order: any): boolean {
    // Show payment prompt if:
    // 1. NOT a partner order, AND
    // 2. Status is pending or pending_confirmation (not yet confirmed by admin)
    const isPartnerOrder = !!order.partner_id;
    const needsPayment = !isPartnerOrder && 
      (order.shipping_tax_payment_status === 'pending' || 
       order.shipping_tax_payment_status === 'pending_confirmation');

    return needsPayment;
  }
};
