import { useState } from 'react';
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
  const { recordPendingPayment } = usePayment();
  const [step, setStep] = useState<'instructions' | 'confirming' | 'submitted'>('instructions');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paypalDetails = {
    email: 'payments@autotradehub.com',
    instructions: `Send ${amount.toFixed(2)} USD to payments@autotradehub.com with Order ID: ${orderId} in the notes`
  };

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
      // Record payment attempt
      await recordPendingPayment({
        order_id: orderId,
        customer_id: user?.id || '',
        payment_method: 'paypal',
        amount,
        paypal_email: paypalDetails.email,
        paypal_transaction_id: transactionId
      });

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
                variant="outline"
                size="icon"
                onClick={handleCopyEmail}
                className="shrink-0 dark:border-gray-600 dark:text-gray-300"
              >
                {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount:</Label>
            <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              ${amount.toFixed(2)} USD
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reference:</Label>
            <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
              Order #{orderId}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">What happens next?</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Payment will be verified for confirmation</li>
          <li>• You'll receive a confirmation email once verified</li>
          <li>• Your order will be processed immediately after verification</li>
          <li>• You can check your order status in your account</li>
        </ul>
      </div>
    </div>
  );

  const renderConfirming = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Confirming Payment
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Please wait while we verify your PayPal transaction...
      </p>
    </div>
  );

  const renderSubmitted = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Payment Submitted Successfully
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Your PayPal payment has been submitted and is awaiting confirmation.
      </p>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <Clock className="w-4 h-4" />
          <span className="text-sm">
            <strong>Transaction ID:</strong> {transactionId}
          </span>
        </div>
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
          Send payment via PayPal and enter the transaction ID for confirmation
        </p>
      </div>

      {step === 'instructions' && renderInstructions()}
      {step === 'confirming' && renderConfirming()}
      {step === 'submitted' && renderSubmitted()}
    </div>
  );
};

export default PayPalPaymentForm;
