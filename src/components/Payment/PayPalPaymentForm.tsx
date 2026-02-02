import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, CheckCircle, Clock, Mail, AlertCircle } from 'lucide-react';
import { usePayment } from '@/contexts/PaymentContext';
import { useAuth } from '@/contexts/AuthContext';

interface PayPalPaymentFormProps {
  orderId: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const PayPalPaymentForm: React.FC<PayPalPaymentFormProps> = ({
  orderId,
  amount,
  onSuccess,
  onError
}) => {
  const { user } = useAuth();
  const { recordPendingPayment, getPayPalDetails } = usePayment();
  const [step, setStep] = useState<'instructions' | 'confirming' | 'submitted'>('instructions');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPaymentId, setCreatedPaymentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paypalDetails, setPayPalDetails] = useState({
    email: 'payments@autotradehub.com',
    business_name: 'Auto Trade Hub',
    currency: 'USD'
  });

  // Fetch PayPal details when component mounts
  useEffect(() => {
    const fetchPayPalDetails = async () => {
      try {
        const details = await getPayPalDetails();
        if (details) {
          setPayPalDetails({
            email: details.paypal_email || 'payments@autotradehub.com',
            business_name: details.business_name || 'Auto Trade Hub',
            currency: details.currency || 'USD'
          });
        }
      } catch (error) {
        console.error('Error fetching PayPal details:', error);
        // Keep using default values if fetch fails
      }
    };

    fetchPayPalDetails();
  }, [getPayPalDetails]);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(paypalDetails.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handlePaymentSent = async () => {
    if (!transactionId.trim()) {
      setError('Please enter the PayPal transaction ID');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Recording PayPal payment:', {
        order_id: orderId,
        customer_id: user?.id || 'anonymous',
        payment_method: 'paypal',
        amount,
        paypal_email: paypalDetails.email,
        paypal_transaction_id: transactionId
      });

      // Record payment attempt
      const paymentId = await recordPendingPayment({
        order_id: orderId,
        customer_id: user?.id || 'anonymous',
        payment_method: 'paypal',
        amount,
        currency: paypalDetails.currency || 'USD',
        paypal_email: paypalDetails.email,
        paypal_transaction_id: transactionId
      });

      console.log('Payment recorded successfully with ID:', paymentId);

      setCreatedPaymentId(paymentId);
      setStep('submitted');
      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      console.error('Error recording PayPal payment:', err);
      setError('Failed to record payment. Please try again.');
      if (onError) {
        onError('Failed to record payment. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInstructions = () => (
    <div className="paypal-instructions space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">Send Payment via PayPal</h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">PayPal Email:</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input 
                value={paypalDetails.email} 
                readOnly 
                className="font-mono bg-white dark:bg-gray-800 dark:border-gray-600"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyEmail}
                className="shrink-0"
              >
                {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount:</Label>
            <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm font-semibold">
              {amount.toFixed(2)} {paypalDetails.currency}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Business Name:</Label>
            <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
              {paypalDetails.business_name}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Order ID:</Label>
            <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
              {orderId}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Payment Instructions:</h4>
        <ol className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-decimal list-inside">
          <li>Log into your PayPal account</li>
          <li>Click "Send & Request" → "Send"</li>
          <li>Enter the email: <strong>{paypalDetails.email}</strong></li>
          <li>Enter amount: <strong>{amount.toFixed(2)} {paypalDetails.currency}</strong></li>
          <li>Add Order ID <strong>{orderId}</strong> in the notes</li>
          <li>Complete the payment</li>
          <li>Come back here and enter your transaction ID</li>
        </ol>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">What happens next?</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Admin will review your payment details</li>
          <li>• You'll receive an email notification once approved</li>
          <li>• Your order will be processed after payment verification</li>
          <li>• You can check your order status in your account</li>
        </ul>
      </div>

      <Button 
        onClick={() => setStep('confirming')}
        className="w-full"
        size="lg"
      >
        I Have Sent the Payment
      </Button>
    </div>
  );

  const renderConfirming = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Confirming Payment
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Please wait while we verify your PayPal transaction...
      </p>

      <div className="max-w-md mx-auto space-y-3 text-left">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">PayPal Transaction ID</Label>
        <Input
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="Enter PayPal transaction ID"
          className="font-mono bg-white dark:bg-gray-800 dark:border-gray-600"
        />

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handlePaymentSent}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Transaction ID'}
          </Button>

          <Button
            variant="ghost"
            onClick={() => setStep('instructions')}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSubmitted = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
        <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Payment Submitted for Approval
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Your PayPal payment has been submitted and is pending admin verification.
        You will be notified once the payment has been reviewed and approved.
      </p>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <Mail className="w-4 h-4" />
          <span className="text-sm">
            <strong>Transaction ID:</strong> {transactionId}
          </span>
        </div>
        {createdPaymentId && (
          <div className="text-sm text-green-700 dark:text-green-300">
            <strong>Recorded Payment ID:</strong> {createdPaymentId}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="paypal-payment-form space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          <Mail className="w-5 h-5 inline mr-2" />
          Pay with PayPal
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your payment will be verified before processing
        </p>
      </div>

      {step === 'instructions' && renderInstructions()}
      {step === 'confirming' && renderConfirming()}
      {step === 'submitted' && renderSubmitted()}
    </div>
  );
};

export default PayPalPaymentForm;
