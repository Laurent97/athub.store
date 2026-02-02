import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { paymentService } from '../../lib/supabase/payment-service';
import WalletBalance from './WalletBalance';
import PayPalPayment from './PayPalPayment';
import CryptoPayment from './CryptoPayment';
import StripePayment from './StripePayment';
import BankAccountPaymentForm from './BankAccountPaymentForm';

interface PaymentOptionsProps {
  amount: number;
  orderId?: string;
  onPaymentSuccess: (data: any) => void;
  onPaymentError: (error: string) => void;
}

export default function PaymentOptions({
  amount,
  orderId,
  onPaymentSuccess,
  onPaymentError
}: PaymentOptionsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<string>('wallet');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  
  // Check for dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const htmlElement = document.documentElement;
    setIsDarkMode(htmlElement.classList.contains('dark'));
  }, []);

  // Load wallet balance if user is logged in
  useEffect(() => {
    if (user) {
      loadWalletBalance();
    } else {
      setLoadingBalance(false);
    }
  }, [user]);

  const loadWalletBalance = async () => {
    if (!user) return;
    
    setLoadingBalance(true);
    try {
      const { data } = await paymentService.getWalletBalance(user.id);
      if (data && typeof data.balance === 'number') {
        setWalletBalance(data.balance);
      } else {
        setWalletBalance(0);
      }
    } catch (error) {
      console.error('Error loading wallet balance:', error);
      setWalletBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleWalletPayment = async () => {
    if (!user) {
      onPaymentError('Please login to use wallet balance');
      return;
    }

    if (walletBalance < amount) {
      onPaymentError(`Insufficient balance. You have $${walletBalance.toFixed(2)}, need $${amount.toFixed(2)}`);
      navigate('/payment/crypto-deposit', { state: { amount: amount - walletBalance, orderId } });
      return;
    }

    try {
      // Process wallet payment
      if (orderId) {
        await paymentService.linkOrderToPayment(
          orderId,
          'wallet',
          amount,
          `wallet_${Date.now()}`
        );
      }

      onPaymentSuccess({
        orderId: orderId || `ORD-${Date.now()}`,
        amount,
        method: 'wallet',
        paymentIntentId: `wallet_${Date.now()}`
      });
    } catch (error: any) {
      onPaymentError(error.message || 'Payment failed');
    }
  };

  const handleCryptoContinue = () => {
    const params = new URLSearchParams();
    if (amount) params.set('amount', amount.toString());
    if (orderId) params.set('orderId', orderId);
    navigate(`/payment/crypto-deposit?${params.toString()}`, { 
      state: { amount, orderId }
    });
  };

  const paymentMethods = [
    {
      id: 'wallet',
      name: 'Wallet Balance',
      icon: '💰',
      available: user && walletBalance >= amount,
      description: user 
        ? `Pay from your wallet (Balance: $${walletBalance.toFixed(2)})`
        : 'Login to use wallet balance'
    },
    {
      id: 'stripe',
      name: 'Credit/Debit Card',
      icon: '💳',
      available: true,
      description: 'Visa, Mastercard, Amex, and more'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: '🔵',
      available: true,
      description: 'Pay with your PayPal account'
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      icon: '₿',
      available: true,
      description: 'BTC, ETH, USDT, XRP and more'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: '🏦',
      available: true,
      description: 'International wire transfer'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Wallet Balance Display */}
      {user && (
        <div className="mb-6">
          <WalletBalance />
        </div>
      )}

      {/* Payment Method Selection */}
      <div>
        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Select Payment Method
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              disabled={!method.available}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${selectedMethod === method.id
                  ? isDarkMode
                    ? 'border-blue-500 bg-blue-900/40 text-white shadow-lg'
                    : 'border-blue-500 bg-blue-50 text-gray-900 shadow-lg'
                  : isDarkMode
                    ? 'border-gray-600 hover:border-blue-500 bg-gray-800 hover:bg-gray-750 text-gray-200 hover:text-white'
                    : 'border-gray-200 hover:border-blue-500 bg-white hover:bg-blue-50 text-gray-700 hover:text-gray-900'
                }
                ${!method.available 
                  ? isDarkMode 
                    ? 'opacity-50 cursor-not-allowed bg-gray-900/50 border-gray-700 text-gray-500'
                    : 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300 text-gray-400'
                  : 'cursor-pointer hover:shadow-md'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{method.icon}</span>
                    <span className={`font-semibold ${
                      selectedMethod === method.id
                        ? isDarkMode ? 'text-white' : 'text-gray-900'
                        : isDarkMode ? 'text-gray-100' : 'text-gray-700'
                    }`}>
                      {method.name}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    selectedMethod === method.id
                      ? isDarkMode ? 'text-blue-200' : 'text-blue-600'
                      : isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {method.description}
                  </p>
                </div>
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                  ${selectedMethod === method.id
                    ? 'border-blue-500 bg-blue-500'
                    : isDarkMode
                      ? 'border-gray-500 bg-gray-600'
                      : 'border-gray-300 bg-gray-100'
                  }
                `}>
                  {selectedMethod === method.id && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Form for Selected Method */}
      <div className={`rounded-lg shadow-lg p-6 ${
        isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        {selectedMethod === 'wallet' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border ${
              isDarkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'
            }`}>
              <h3 className={`font-semibold mb-2 ${
                isDarkMode ? 'text-blue-300' : 'text-blue-800'
              }`}>
                Pay with Wallet
              </h3>
              {user ? (
                <>
                  <p className={`mb-4 ${
                    isDarkMode ? 'text-blue-200' : 'text-blue-700'
                  }`}>
                    You have <strong className={
                      isDarkMode ? 'text-blue-300' : 'text-blue-800'
                    }>${walletBalance.toFixed(2)}</strong> available.
                    {walletBalance < amount && (
                      <span className={`block mt-2 ${
                        isDarkMode ? 'text-yellow-300' : 'text-yellow-700'
                      }`}>
                        ⚠️ You need ${(amount - walletBalance).toFixed(2)} more. 
                        <button
                          onClick={() => navigate('/payment/crypto-deposit', { state: { amount: amount - walletBalance, orderId } })}
                          className={`ml-1 hover:underline ${
                            isDarkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-800'
                          }`}
                        >
                          Deposit now
                        </button>
                      </span>
                    )}
                  </p>
                  <button
                    onClick={handleWalletPayment}
                    disabled={walletBalance < amount || loadingBalance}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                      walletBalance < amount || loadingBalance
                        ? isDarkMode
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isDarkMode
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {loadingBalance ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Loading...
                      </span>
                    ) : (
                      `Pay $${amount.toFixed(2)}`
                    )}
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <p className={isDarkMode ? 'text-blue-200' : 'text-blue-700'}>
                    Please login to use wallet balance.
                  </p>
                  <button
                    onClick={() => navigate('/auth', { state: { from: window.location.pathname } })}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                      isDarkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    Login to Continue
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedMethod === 'stripe' && (
          <StripePayment
            amount={amount}
            orderId={orderId}
            onSuccess={onPaymentSuccess}
            onError={onPaymentError}
          />
        )}

        {selectedMethod === 'paypal' && (
          <PayPalPayment
            amount={amount}
            orderId={orderId}
            onSuccess={onPaymentSuccess}
            onError={onPaymentError}
          />
        )}

        {selectedMethod === 'crypto' && (
          <CryptoPayment
            amount={amount}
            onContinue={handleCryptoContinue}
          />
        )}

        {selectedMethod === 'bank' && (
          <BankAccountPaymentForm
            amount={amount}
            orderId={orderId || ''}
            onSuccess={onPaymentSuccess}
            onError={onPaymentError}
          />
        )}
      </div>

      {/* Payment Security Info */}
      <div className={`rounded-lg border p-4 ${
        isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
          }`}>
            <span className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>🔒</span>
          </div>
          <p className={`font-medium ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Secure Payment
          </p>
        </div>
        <p className={`text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Your payment information is encrypted and secure. We never store your credit card details.
        </p>
      </div>
    </div>
  );
}