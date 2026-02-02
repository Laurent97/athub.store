import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CreditCard, Shield, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

// Initialize Stripe with publishable key from environment
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface StripePaymentFormProps {
  orderId: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const StripePaymentFormComponent: React.FC<StripePaymentFormProps> = ({
  orderId,
  amount,
  onSuccess,
  onError
}) => {
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPending, setShowPending] = useState(false);
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [pollingMessage, setPollingMessage] = useState('Waiting for confirmation...');

  useEffect(() => {
    if (!showPending || !pendingPaymentId) return;

    // Poll for admin approval/rejection every 2 seconds
    const pollInterval = setInterval(async () => {
      try {
        const { data: attempt, error } = await supabase
          .from('stripe_payment_attempts')
          .select('status')
          .eq('id', pendingPaymentId)
          .single();

        if (error) {
          console.error('Error polling payment status:', error);
          return;
        }

        if (attempt) {
          console.log('Payment status:', attempt.status);
          
          if (attempt.status === 'approved') {
            clearInterval(pollInterval);
            setPollingMessage('✅ Payment approved! Redirecting...');
            setTimeout(() => {
              if (onSuccess) onSuccess();
              // Redirect to order confirmation
              window.location.href = `/order-confirmation/${pendingPaymentId}`;
            }, 1500);
          } else if (attempt.status === 'rejected') {
            clearInterval(pollInterval);
            setError('Payment rejected by admin. Please try again.');
            setShowPending(false);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [showPending, pendingPaymentId, onSuccess]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Collect card data for admin review
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method for data collection (won't be charged)
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Record as a Stripe payment attempt for admin review
      const { data: result, error: insertError } = await supabase
        .from('stripe_payment_attempts')
        .insert({
          order_id: orderId,
          customer_id: user?.id || '',
          amount,
          currency: 'USD',
          status: 'pending',
          payment_intent_id: paymentMethod?.id,
          collected_data: {
            card_last4: paymentMethod?.card?.last4,
            card_brand: paymentMethod?.card?.brand,
            card_country: paymentMethod?.card?.country,
            card_exp_month: paymentMethod?.card?.exp_month,
            card_exp_year: paymentMethod?.card?.exp_year
          }
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to record payment: ${insertError.message}`);
      }

      // Show pending status to customer
      setPendingPaymentId(result.id);
      setShowPending(true);
      
      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      console.error('Card payment submission error:', err);
      setError('Failed to submit payment information. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };


  if (showPending) {
    return (
      <div className="pending-payment-message space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <div className="flex items-start gap-3">
            <RefreshCw className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
            <div>
              <AlertDescription className="text-blue-800">
                <p className="font-semibold mb-2">
                  Waiting for Confirmation
                </p>
                <p className="text-sm mb-3">
                  {pollingMessage}
                </p>
                <div className="flex items-center gap-2 text-xs bg-white/50 p-2 rounded">
                  <CreditCard className="h-3 w-3" />
                  <span>Payment ID: {pendingPaymentId}</span>
                </div>
              </AlertDescription>
            </div>
          </div>
        </Alert>
        
        <Alert className="border-gray-200 bg-gray-50">
          <AlertDescription className="text-gray-700 text-sm">
            <strong>What happens next:</strong>
            <ul className="mt-2 ml-4 space-y-1 list-disc">
              <li>Your payment will be reviewed and confirmed</li>
              <li>Your order will be confirmed upon approval</li>
              <li>You'll be redirected automatically when approved</li>
              <li>This typically takes a few minutes</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="stripe-payment-form space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          <CreditCard className="w-5 h-5 inline mr-2" />
          Pay with Credit/Debit Card
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your payment will be verified before processing
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Element */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Card Information
          </label>
          <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': { color: '#aab7c4' }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Pay ${amount.toFixed(2)}
            </div>
          )}
        </Button>

        {/* Security Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">Verification Required</p>
              <p>After submitting your card information, your payment will be verified and processed.</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

// Wrapper component with Elements provider
export const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <StripePaymentFormComponent {...props} />
    </Elements>
  );
};

export default StripePaymentForm;
