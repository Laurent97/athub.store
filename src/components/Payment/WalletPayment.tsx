import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Wallet, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  Clock,
  CreditCard,
  ArrowRight,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePayment } from '@/contexts/PaymentContext';

interface WalletPaymentProps {
  orderId: string;
  amount: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

interface WalletBalance {
  available_balance: number;
  currency: string;
  last_updated: string;
}

const WalletPayment: React.FC<WalletPaymentProps> = ({
  orderId,
  amount,
  onSuccess,
  onError
}) => {
  const { user } = useAuth();
  const { recordPendingPayment } = usePayment();
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    try {
      console.log('🔍 WalletPayment: Fetching wallet balance for user:', user?.id);
      
      // Mock wallet balance - in production, this would come from your database
      const mockBalance: WalletBalance = {
        available_balance: 1250.75,
        currency: 'USD',
        last_updated: new Date().toISOString()
      };
      
      console.log('🔍 WalletPayment: Wallet balance loaded:', mockBalance);
      setWalletBalance(mockBalance);
    } catch (error) {
      console.error('🔍 WalletPayment: Error fetching wallet balance:', error);
      onError('Failed to fetch wallet balance');
    }
  };

  // Load wallet balance on component mount
  useState(() => {
    fetchWalletBalance();
  });

  const handleWalletPayment = async () => {
    if (!walletBalance) {
      onError('Wallet balance not available');
      return;
    }

    if (walletBalance.available_balance < amount) {
      onError(`Insufficient balance. Available: $${walletBalance.available_balance.toFixed(2)}, Required: $${amount.toFixed(2)}`);
      return;
    }

    setIsProcessing(true);

    try {
      console.log('🔍 WalletPayment: Processing wallet payment', {
        orderId,
        amount,
        userId: user?.id,
        currentBalance: walletBalance.available_balance
      });

      // In a real implementation, you would:
      // 1. Deduct amount from wallet
      // 2. Create order record
      // 3. Update order status
      // 4. Send confirmation

      // For now, we'll simulate the payment
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing

      // Record the payment as completed (no admin confirmation needed for wallet)
      await recordPendingPayment({
        order_id: orderId,
        customer_id: user?.id || '',
        payment_method: 'wallet',
        amount: amount,
        currency: 'USD'
      });

      console.log('🔍 WalletPayment: Wallet payment completed successfully');

      if (onSuccess) {
        onSuccess({
          method: 'wallet',
          amount,
          orderId,
          status: 'completed',
          transactionId: `wallet_${Date.now()}`,
          remainingBalance: walletBalance.available_balance - amount
        });
      }

    } catch (error) {
      console.error('🔍 WalletPayment: Error processing wallet payment:', error);
      onError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isProcessing) {
    return (
      <div className="wallet-payment">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
              <p className="text-gray-600">Please wait while we process your wallet payment...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="wallet-payment space-y-6">
      {/* Wallet Balance Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-600" />
            Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {walletBalance ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Available Balance:</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(walletBalance.available_balance)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {walletBalance.currency}
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                Last updated: {new Date(walletBalance.last_updated).toLocaleString()}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchWalletBalance}
                className="w-full"
              >
                Refresh Balance
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-8 h-8 border-2 border-gray-300 rounded-full mx-auto mb-2 animate-pulse"></div>
              <p className="text-gray-500">Loading wallet balance...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Order Amount:</span>
              <span className="font-semibold">{formatCurrency(amount)}</span>
            </div>
            
            {walletBalance && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Remaining Balance:</span>
                <span className={`font-semibold ${
                  walletBalance.available_balance >= amount 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatCurrency(walletBalance.available_balance - amount)}
                </span>
              </div>
            )}
            
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total:</span>
                <span className="text-lg font-bold">{formatCurrency(amount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> This payment will be processed immediately using your wallet balance. 
          No additional confirmation is required for wallet payments.
        </AlertDescription>
      </Alert>

      {/* Payment Button */}
      <div className="space-y-4">
        {walletBalance && walletBalance.available_balance < amount && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Insufficient Balance:</strong> You need {formatCurrency(amount - walletBalance.available_balance)} more to complete this payment.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleWalletPayment}
          disabled={isProcessing || !walletBalance || walletBalance.available_balance < amount}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Pay {formatCurrency(amount)}
            </div>
          )}
        </Button>
      </div>

      {/* Benefits */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Wallet Benefits
        </h4>
        <ul className="text-sm text-green-700 space-y-1">
          <li>✅ Instant processing - No waiting required</li>
          <li>✅ No admin confirmation needed</li>
          <li>✅ Secure and encrypted transactions</li>
          <li>✅ Automatic order confirmation</li>
        </ul>
      </div>

      {/* User Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-gray-600" />
          <div>
            <div className="font-medium text-gray-900">
              {user?.email || 'Unknown User'}
            </div>
            <div className="text-sm text-gray-500">
              Order ID: #{orderId}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPayment;
