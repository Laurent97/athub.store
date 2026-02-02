import { supabase } from './client';

export const payoutService = {
  async processOrderPayout(orderId: string) {
    try {
      console.log(`💰 Processing payout for order: ${orderId}`);
      
      // 1. Fetch order details with partner information
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          partner:partner_profiles(
            id,
            user_id,
            commission_rate
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      if (!order) throw new Error('Order not found');

      // 2. Check if order has already been paid out to prevent duplicate payments
      if (order.paid_out) {
        console.log(`⚠️ Order ${orderId} has already been paid out on ${order.payout_date}`);
        return {
          success: false,
          error: 'Order has already been paid out to the partner'
        };
      }

      if (!order.partner) {
        throw new Error('Partner information not found for this order');
      }

      if (order.status !== 'completed' && order.status !== 'delivered') {
        throw new Error('Order must be completed or delivered before payout');
      }

      // 2. Calculate partner's payout amount
      // Convert commission rate from percentage to decimal (15% -> 0.15)
      const commissionRate = (order.partner?.commission_rate || 10) / 100; // 10% default
      const commissionEarnings = order.total_amount * commissionRate;
      
      // Get the base cost that partner originally paid for this order
      const baseCostTotal = order.base_cost_total || 0;
      
      // Calculate order profit (selling price - base cost) - this is what partner earns
      const orderProfit = (order.total_amount || 0) - baseCostTotal;
      
      // FIXED: Total payout = Base cost reimbursement + Order profit + Commission earnings
      // Partner should be reimbursed for what they paid (base cost) plus earn profit plus commission
      // Since orderProfit = total_amount - baseCostTotal, this simplifies to: total_amount + commissionEarnings
      const totalPayoutAmount = baseCostTotal + orderProfit + commissionEarnings;
      
      console.log(`💰 Partner payout calculation:`, {
        totalAmount: order.total_amount,
        baseCostTotal,
        orderProfit,
        commissionRate,
        commissionEarnings,
        totalPayoutAmount
      });

      // 3. Create wallet transaction for partner
      const { data: transaction, error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: order.partner.user_id,
          order_id: orderId,
          type: 'commission',
          amount: totalPayoutAmount,
          status: 'completed',
          description: `Payout from Order #${order.order_number} - Profit: $${orderProfit}, Commission: $${commissionEarnings}, Total: $${totalPayoutAmount}, Rate: ${(commissionRate * 100).toFixed(0)}%`
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // 4. Update partner's wallet balance
      // Get current balance
      const { data: currentBalance, error: balanceError } = await supabase
        .from('wallet_balances')
        .select('balance')
        .eq('user_id', order.partner.user_id)
        .single();

      if (balanceError && balanceError.code === 'PGRST116') {
        // If wallet doesn't exist, create it
        const { error: createError } = await supabase
          .from('wallet_balances')
          .insert({
            user_id: order.partner.user_id,
            balance: totalPayoutAmount,
            updated_at: new Date().toISOString()
          });

        if (createError) throw createError;
      } else if (balanceError) {
        throw balanceError;
      } else {
        // Update existing wallet
        const newBalance = (currentBalance?.balance || 0) + totalPayoutAmount;
        const { error: updateError } = await supabase
          .from('wallet_balances')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', order.partner.user_id);

        if (updateError) throw updateError;
      }

      // 5. Mark order as paid_out
      const { error: payoutError } = await supabase
        .from('orders')
        .update({
          paid_out: true,
          payout_amount: totalPayoutAmount,
          payout_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (payoutError) throw payoutError;

      console.log(`✅ Payout processed successfully: $${totalPayoutAmount} added to partner's wallet`);
      
      return {
        success: true,
        data: {
          orderId,
          totalPayoutAmount,
          commissionEarnings,
          baseCostTotal,
          orderProfit,
          commissionRate
        }
      };
    } catch (error) {
      console.error('❌ Error processing payout:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to process payout';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle Supabase errors or other object errors
        if ('message' in error) {
          errorMessage = String(error.message);
        } else if ('error' in error) {
          errorMessage = String(error.error);
        } else if ('details' in error) {
          errorMessage = String(error.details);
        } else {
          errorMessage = JSON.stringify(error);
        }
      } else {
        errorMessage = String(error);
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};
