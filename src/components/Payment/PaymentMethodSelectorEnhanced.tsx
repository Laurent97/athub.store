import React, { useState, useEffect } from 'react';
import { CreditCard, BanknoteIcon, Wallet, DollarSign } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_account' | 'paypal' | 'crypto';
  provider: string;
  displayName: string;
  icon: React.ReactNode;
  isDefault?: boolean;
}

interface PaymentMethodSelectorProps {
  onPaymentMethodSelect: (method: PaymentMethod) => void;
  selectedMethod?: PaymentMethod;
  className?: string;
}

export default function PaymentMethodSelector({ 
  onPaymentMethodSelect, 
  selectedMethod, 
  className = '' 
}: PaymentMethodSelectorProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load customer's saved payment methods
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch('/api/customer/payment-methods');
      if (response.ok) {
        const methods = await response.json();
        setPaymentMethods(methods);
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    onPaymentMethodSelect(method);
  };

  const addNewPaymentMethod = (type: PaymentMethod['type']) => {
    // Open modal or navigate to add payment method page
    console.log(`Adding new ${type} payment method`);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-20 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-20 bg-gray-200 rounded-lg mb-4"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
      
      {/* Credit Card Option */}
      <div 
        className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-blue-500 hover:shadow-md ${
          selectedMethod?.type === 'credit_card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
        }`}
        onClick={() => handleMethodSelect({
          id: 'credit-card',
          type: 'credit_card',
          provider: 'stripe',
          displayName: 'Credit/Debit Card',
          icon: <CreditCard className="w-5 h-5" />
        })}
      >
        <div className="flex items-center space-x-3">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <div>
            <div className="font-medium">Credit/Debit Card</div>
            <div className="text-sm text-gray-500">Visa, Mastercard, Amex, Discover</div>
          </div>
        </div>
      </div>

      {/* Bank Account Option */}
      <div 
        className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-green-500 hover:shadow-md ${
          selectedMethod?.type === 'bank_account' ? 'border-green-500 bg-green-50' : 'border-gray-200'
        }`}
        onClick={() => handleMethodSelect({
          id: 'bank-account',
          type: 'bank_account',
          provider: 'bank_transfer',
          displayName: 'Bank Account',
          icon: <BanknoteIcon className="w-5 h-5" />
        })}
      >
        <div className="flex items-center space-x-3">
          <BanknoteIcon className="w-5 h-5 text-green-600" />
          <div>
            <div className="font-medium">Bank Account</div>
            <div className="text-sm text-gray-500">Direct bank transfer, ACH</div>
          </div>
        </div>
      </div>

      {/* PayPal Option */}
      <div 
        className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-blue-600 hover:shadow-md ${
          selectedMethod?.type === 'paypal' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
        }`}
        onClick={() => handleMethodSelect({
          id: 'paypal',
          type: 'paypal',
          provider: 'paypal',
          displayName: 'PayPal',
          icon: <DollarSign className="w-5 h-5" />
        })}
      >
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">P</span>
          </div>
          <div>
            <div className="font-medium">PayPal</div>
            <div className="text-sm text-gray-500">Pay with PayPal balance or account</div>
          </div>
        </div>
      </div>

      {/* Cryptocurrency Option */}
      <div 
        className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-orange-500 hover:shadow-md ${
          selectedMethod?.type === 'crypto' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
        }`}
        onClick={() => handleMethodSelect({
          id: 'crypto',
          type: 'crypto',
          provider: 'crypto_wallet',
          displayName: 'Cryptocurrency',
          icon: <Wallet className="w-5 h-5" />
        })}
      >
        <div className="flex items-center space-x-3">
          <Wallet className="w-5 h-5 text-orange-600" />
          <div>
            <div className="font-medium">Cryptocurrency</div>
            <div className="text-sm text-gray-500">Bitcoin, Ethereum, USDT, more</div>
          </div>
        </div>
      </div>

      {/* Saved Payment Methods */}
      {paymentMethods.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-3">Saved Payment Methods</h4>
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <div 
                key={method.id}
                className={`border rounded-lg p-3 cursor-pointer transition-all hover:border-blue-500 ${
                  selectedMethod?.id === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => handleMethodSelect(method)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {method.icon}
                    <div>
                      <div className="font-medium">{method.displayName}</div>
                      <div className="text-sm text-gray-500">{method.provider}</div>
                    </div>
                  </div>
                  {method.isDefault && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Payment Method */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => addNewPaymentMethod('credit_card')}
          className="px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
        >
          + Add Credit Card
        </button>
        <button
          onClick={() => addNewPaymentMethod('bank_account')}
          className="px-4 py-2 border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
        >
          + Add Bank Account
        </button>
        <button
          onClick={() => addNewPaymentMethod('paypal')}
          className="px-4 py-2 border border-blue-600 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
        >
          + Add PayPal
        </button>
        <button
          onClick={() => addNewPaymentMethod('crypto')}
          className="px-4 py-2 border border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
        >
          + Add Crypto Wallet
        </button>
      </div>
    </div>
  );
}
