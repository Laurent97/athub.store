import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, CheckCircle, Clock, Bitcoin, AlertCircle, ExternalLink } from 'lucide-react';
import { usePayment } from '@/contexts/PaymentContext';
import { useAuth } from '@/contexts/AuthContext';

interface CryptoPaymentFormProps {
  orderId: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface CryptoOption {
  symbol: string;
  name: string;
  address: string;
  icon: string;
  color: string;
}

export const CryptoPaymentForm: React.FC<CryptoPaymentFormProps> = ({
  orderId,
  amount,
  onSuccess,
  onError
}) => {
  const { user } = useAuth();
  const { recordPendingPayment } = usePayment();
  const [step, setStep] = useState<'selection' | 'payment' | 'confirmation' | 'submitted'>('selection');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoOption | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cryptoOptions: CryptoOption[] = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      icon: '₿',
      color: 'text-orange-600',
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      icon: 'Ξ',
      color: 'text-blue-600',
    },
    {
      symbol: 'USDT',
      name: 'Tether (ERC20)',
      address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      icon: '₮',
      color: 'text-green-600',
    }
  ];

  const handleCryptoSelect = (crypto: CryptoOption) => {
    setSelectedCrypto(crypto);
    setStep('payment');
  };

  const handleCopyAddress = async () => {
    if (!selectedCrypto) return;
    try {
      await navigator.clipboard.writeText(selectedCrypto.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleCopyAmount = async () => {
    try {
      await navigator.clipboard.writeText(amount.toString());
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } catch (err) {
      console.error('Failed to copy amount:', err);
    }
  };

  const handleTransactionSubmit = async () => {
    if (!transactionId.trim()) {
      setError('Please enter a valid transaction ID');
      return;
    }

    if (!selectedCrypto) {
      setError('Please select a cryptocurrency');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Record crypto payment with TX ID
      await recordPendingPayment({
        order_id: orderId,
        customer_id: user?.id || '',
        payment_method: 'crypto',
        amount,
        crypto_address: selectedCrypto.address,
        crypto_transaction_id: transactionId,
        crypto_type: selectedCrypto.symbol
      });

      setStep('submitted');
      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      console.error('Error recording crypto payment:', err);
      setError('Failed to record payment. Please try again.');
      if (onError) {
        onError('Failed to record payment. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSelection = () => (
    <div className="crypto-payment-form space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          <Bitcoin className="w-5 h-5 inline mr-2" />
          Pay with Cryptocurrency
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose your preferred cryptocurrency and send the payment
        </p>
      </div>

      {step === 'selection' && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Select Cryptocurrency:</h4>
          <div className="grid gap-3">
            {cryptoOptions.map((crypto) => (
              <button
                key={crypto.symbol}
                onClick={() => setSelectedCrypto(crypto)}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  selectedCrypto?.symbol === crypto.symbol
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl ${crypto.color}`}>{crypto.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{crypto.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{crypto.symbol}</div>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedCrypto?.symbol === crypto.symbol
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedCrypto?.symbol === crypto.symbol && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <Button
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Enter the transaction hash from your wallet"
            className="font-mono"
          />
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              By confirming, you verify that you have sent the cryptocurrency. 
              An admin will verify the transaction on the blockchain and process your order within 1-24 hours.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={() => setStep('payment')}
            variant="outline"
            className="flex-1"
          >
            Back
          </Button>
          <Button 
            onClick={handleTransactionSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </div>
            ) : (
              'Submit Transaction ID'
            )}
          </Button>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const renderSubmitted = () => (
    <div className="crypto-submitted space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">Transaction Submitted</h3>
        
        <div className="space-y-2 text-sm text-green-800">
          <p>Your crypto payment has been recorded successfully.</p>
          <p>Transaction ID: <code className="bg-white px-1 rounded">{transactionId}</code></p>
          <p>An admin will verify the transaction on blockchain within 24 hours.</p>
        </div>

        <div className="mt-4 p-3 bg-white rounded border border-green-200">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-semibold text-yellow-600">Awaiting Admin Verification</span>
            </div>
            <div className="flex justify-between">
              <span>Order Status:</span>
              <span className="font-semibold text-yellow-600">Pending Confirmation</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Admin will verify your transaction on the blockchain</li>
          <li>• Transaction amount and confirmation will be checked</li>
          <li>• You'll receive a confirmation email once verified</li>
          <li>• Your order will be processed immediately after verification</li>
        </ul>
      </div>

      {selectedCrypto && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ExternalLink className="h-4 w-4" />
            <span>
              You can track your transaction on any {selectedCrypto.name} block explorer using the TX ID
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="crypto-payment-form">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Bitcoin className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold">Pay with Cryptocurrency</h3>
        </div>
      </div>

      {step === 'selection' && renderSelection()}
      {step === 'payment' && renderPayment()}
      {step === 'confirmation' && renderConfirmation()}
      {step === 'submitted' && renderSubmitted()}
    </div>
  );
};

export default CryptoPaymentForm;
