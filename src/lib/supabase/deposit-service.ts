import { supabase } from './client';
import { walletService } from './wallet-service';

export interface DepositRequest {
  user_id: string;
  amount: number;
  payment_method: 'stripe' | 'paypal' | 'crypto' | 'bank';
  payment_details: {
    cardNumber?: string;
    cardExpiry?: string;
    cardCvc?: string;
    email?: string;
    cryptoType?: string;
    cryptoAddress?: string;
    cryptoTransactionId?: string;
    bankName?: string;
    bankAccount?: string;
    routingNumber?: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  description: string;
}

export interface PaymentMethodConfig {
  method_name: string;
  enabled: boolean;
  customer_access: boolean;
  partner_access: boolean;
  admin_access: boolean;
  admin_confirmation_required: boolean;
  collect_data_only: boolean;
  config_data: any;
}

export const depositService = {
  // Get payment method configuration from database
  async getPaymentMethodConfig(method: string): Promise<{ data: PaymentMethodConfig | null; error: any }> {
    try {
      console.log(`Fetching payment method config for ${method} from database...`);
      const { data, error } = await supabase
        .from('payment_method_config')
        .select('*')
        .eq('method_name', method)
        .eq('enabled', true)
        .single();

      if (error) {
        console.error(`Database error fetching ${method} config:`, error);
        throw error;
      }

      console.log(`${method} config fetched successfully:`, data?.enabled ? 'Enabled' : 'Disabled');
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching payment method config:', error);
      return { data: null, error };
    }
  },

  // Check if payment method is available for user
  async isPaymentMethodAvailable(method: string, userType: 'customer' | 'partner' | 'admin'): Promise<{ available: boolean; reason?: string }> {
    try {
      const { data, error } = await this.getPaymentMethodConfig(method);
      
      if (error || !data) {
        return { available: false, reason: 'Payment method not found or disabled' };
      }

      // Check user access
      const hasAccess = 
        (userType === 'customer' && data.customer_access) ||
        (userType === 'partner' && data.partner_access) ||
        (userType === 'admin' && data.admin_access);

      if (!hasAccess) {
        return { available: false, reason: 'Payment method not available for your user type' };
      }

      return { available: true };
    } catch (error) {
      console.error('Error checking payment method availability:', error);
      return { available: false, reason: 'Error checking payment method availability' };
    }
  },

  // Submit deposit request to database
  async submitDepositRequest(request: DepositRequest): Promise<{ data: any; error: any }> {
    try {
      console.log('Submitting deposit request to database:', request);
      
      // First create the transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: request.user_id,
          type: 'deposit',
          amount: request.amount,
          status: 'pending',
          description: request.description,
          payment_method: request.payment_method,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Error creating deposit transaction:', transactionError);
        throw transactionError;
      }

      console.log('Deposit transaction created successfully:', transaction.id);

      // Create payment record for tracking
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('pending_payments')
        .insert({
          order_id: `DEP-${transaction.id}`,
          customer_id: request.user_id,
          payment_method: request.payment_method,
          amount: request.amount,
          currency: 'USD',
          status: 'pending_confirmation',
          crypto_address: request.payment_details.cryptoAddress,
          crypto_transaction_id: request.payment_details.cryptoTransactionId,
          crypto_type: request.payment_details.cryptoType,
          paypal_email: request.payment_details.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        // Don't throw error here, transaction is already created
      } else {
        console.log('Payment record created successfully:', paymentRecord.id);
      }

      return { 
        data: { 
          transaction, 
          paymentRecord,
          message: 'Deposit request submitted successfully'
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error submitting deposit request:', error);
      return { data: null, error };
    }
  },

  // Process Stripe payment
  async processStripePayment(request: DepositRequest): Promise<{ data: any; error: any }> {
    try {
      console.log('Processing Stripe payment for deposit:', request);
      
      // Check if Stripe is available
      const { available, reason } = await this.isPaymentMethodAvailable('stripe', 'partner');
      if (!available) {
        throw new Error(reason || 'Stripe payment not available');
      }

      // Get Stripe config
      const { data: config } = await this.getPaymentMethodConfig('stripe');
      if (!config) {
        throw new Error('Stripe configuration not found');
      }

      // Validate card details
      if (!request.payment_details.cardNumber || !request.payment_details.cardExpiry || !request.payment_details.cardCvc) {
        throw new Error('Missing card details');
      }

      // In a real implementation, you would integrate with Stripe API here
      // For now, we'll simulate the payment processing
      console.log('Simulating Stripe payment processing...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create transaction record
      const result = await this.submitDepositRequest(request);
      
      console.log('Stripe payment processed successfully');
      return result;
    } catch (error) {
      console.error('Error processing Stripe payment:', error);
      return { data: null, error };
    }
  },

  // Process PayPal payment
  async processPayPalPayment(request: DepositRequest): Promise<{ data: any; error: any }> {
    try {
      console.log('Processing PayPal payment for deposit:', request);
      
      // Check if PayPal is available
      const { available, reason } = await this.isPaymentMethodAvailable('paypal', 'partner');
      if (!available) {
        throw new Error(reason || 'PayPal payment not available');
      }

      // Validate PayPal email
      if (!request.payment_details.email) {
        throw new Error('PayPal email is required');
      }

      // In a real implementation, you would integrate with PayPal API here
      console.log('Simulating PayPal payment processing...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create transaction record
      const result = await this.submitDepositRequest(request);
      
      console.log('PayPal payment processed successfully');
      return result;
    } catch (error) {
      console.error('Error processing PayPal payment:', error);
      return { data: null, error };
    }
  },

  // Process Crypto payment
  async processCryptoPayment(request: DepositRequest): Promise<{ data: any; error: any }> {
    try {
      console.log('Processing Crypto payment for deposit:', request);
      
      // Check if Crypto is available
      const { available, reason } = await this.isPaymentMethodAvailable('crypto', 'partner');
      if (!available) {
        throw new Error(reason || 'Crypto payment not available');
      }

      // Validate crypto details
      if (!request.payment_details.cryptoType || !request.payment_details.cryptoAddress) {
        throw new Error('Crypto type and address are required');
      }

      // In a real implementation, you would verify the crypto transaction here
      console.log('Simulating crypto payment verification...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create transaction record
      const result = await this.submitDepositRequest(request);
      
      console.log('Crypto payment processed successfully');
      return result;
    } catch (error) {
      console.error('Error processing Crypto payment:', error);
      return { data: null, error };
    }
  },

  // Process Bank Transfer payment
  async processBankTransferPayment(request: DepositRequest): Promise<{ data: any; error: any }> {
    try {
      console.log('Processing Bank Transfer payment for deposit:', request);
      
      // Check if Bank Transfer is available
      const { available, reason } = await this.isPaymentMethodAvailable('bank', 'partner');
      if (!available) {
        throw new Error(reason || 'Bank transfer not available');
      }

      // Validate bank details
      if (!request.payment_details.bankName || !request.payment_details.bankAccount) {
        throw new Error('Bank name and account number are required');
      }

      // In a real implementation, you would generate bank transfer instructions here
      console.log('Simulating bank transfer processing...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create transaction record
      const result = await this.submitDepositRequest(request);
      
      console.log('Bank transfer payment processed successfully');
      return result;
    } catch (error) {
      console.error('Error processing Bank Transfer payment:', error);
      return { data: null, error };
    }
  },

  // Get deposit status
  async getDepositStatus(transactionId: string): Promise<{ data: any; error: any }> {
    try {
      console.log('Fetching deposit status for transaction:', transactionId);
      
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) {
        console.error('Error fetching deposit status:', error);
        throw error;
      }

      console.log('Deposit status fetched successfully:', data?.status);
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching deposit status:', error);
      return { data: null, error };
    }
  },

  // Test database connection for deposit service
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing deposit service database connection...');
      
      // Test payment method config table
      const { data: configData, error: configError } = await supabase
        .from('payment_method_config')
        .select('count')
        .eq('enabled', true);

      if (configError) {
        throw new Error(`Payment method config table error: ${configError.message}`);
      }

      // Test wallet transactions table
      const { data: transactionData, error: transactionError } = await supabase
        .from('wallet_transactions')
        .select('count')
        .eq('type', 'deposit');

      if (transactionError) {
        throw new Error(`Wallet transactions table error: ${transactionError.message}`);
      }

      const configCount = configData?.[0]?.count || 0;
      const transactionCount = transactionData?.[0]?.count || 0;
      
      console.log('Deposit service connection test successful');
      return { 
        success: true, 
        message: `Connected successfully. ${configCount} payment methods enabled, ${transactionCount} deposit transactions found.` 
      };
    } catch (error) {
      console.error('Deposit service connection test failed:', error);
      return { success: false, message: `Connection test failed: ${error.message}` };
    }
  }
};
