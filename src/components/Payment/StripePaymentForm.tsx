import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CreditCard, Shield, Clock } from 'lucide-react';
import { usePayment } from '@/contexts/PaymentContext';
import { useAuth } from '@/contexts/AuthContext';

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
  const { recordPendingPayment } = usePayment();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPending, setShowPending] = useState(false);
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);

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

      // Record the card payment as pending for admin approval
      const paymentId = await recordPendingPayment({
        order_id: orderId,
        customer_id: user?.id || '',
        payment_method: 'stripe',
        amount,
        currency: 'USD',
        // Store card details securely for admin verification
        stripe_payment_method_id: paymentMethod?.id,
        card_last4: paymentMethod?.card?.last4,
        card_brand: paymentMethod?.card?.brand,
        card_country: paymentMethod?.card?.country,
        card_exp_month: paymentMethod?.card?.exp_month,
        card_exp_year: paymentMethod?.card?.exp_year
      });

      // Show pending status to customer
      setPendingPaymentId(paymentId);
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
      <div className="pending-payment-message">
        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-2">
              <p className="font-semibold">
                Payment Submitted for Approval
              </p>
              <p>
                Your card payment request has been submitted and is pending admin verification.
                You will be notified once the payment has been reviewed and approved.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4" />
                <span>Payment ID: {pendingPaymentId}</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>What happens next:</strong>
          </p>
          <ul className="text-sm text-gray-600 mt-1 space-y-1">
            <li>• Admin will review your payment details</li>
            <li>• You'll receive an email notification once approved</li>
            <li>• Your order will be processed after payment verification</li>
          </ul>
        </div>
      </div>
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
