import React, { useState, useEffect } from 'react';
import { X, DollarSign, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { shippingTaxPaymentService } from '@/lib/supabase/shipping-tax-payment-service';
import PaymentOptions from '@/components/Payment/PaymentOptions';
import ShippingTaxBreakdown from '@/components/ShippingTaxBreakdown';

interface ShippingTaxPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderTotal: number;
  shippingFee: number;
  taxFee: number;
  onPaymentSuccess?: () => void;
}

export const ShippingTaxPaymentModal: React.FC<ShippingTaxPaymentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderTotal,
  shippingFee,
  taxFee,
  onPaymentSuccess
}) => {
  const { user } = useAuth();
  const [paymentStep, setPaymentStep] = useState<'overview' | 'payment' | 'success'>('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = shippingFee + taxFee;

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      setIsProcessing(true);
      setError(null);

      // Process the payment
      await shippingTaxPaymentService.processPayment(
        orderId,
        paymentData.method || 'card',
        paymentData.transactionId || paymentData.paymentIntentId || '',
        totalAmount
      );

      setPaymentStep('success');

      // Call callback after a short delay
      if (onPaymentSuccess) {
        setTimeout(onPaymentSuccess, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Payment processing failed. Please try again.');
      setPaymentStep('payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Payment Required
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {paymentStep === 'overview' && (
            <>
              {/* Breakdown */}
              <ShippingTaxBreakdown
                shippingFee={shippingFee}
                taxFee={taxFee}
                orderTotal={orderTotal}
              />

              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    Payment Notice
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                    After payment, the admin will confirm and you'll be able to view tracking information and download your invoice.
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => setPaymentStep('payment')}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Proceed to Payment
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}
            </>
          )}

          {paymentStep === 'payment' && (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  Total Due: <span className="text-lg text-blue-600 dark:text-blue-400">${totalAmount.toFixed(2)}</span>
                </p>
              </div>

              <PaymentOptions
                amount={totalAmount}
                orderId={orderId}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
              />

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              <button
                onClick={() => setPaymentStep('overview')}
                disabled={isProcessing}
                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
              >
                Back
              </button>
            </>
          )}

          {paymentStep === 'success' && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Payment Received!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Your payment of ${totalAmount.toFixed(2)} has been submitted successfully.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                The admin will confirm shortly. You'll be able to view tracking information and invoice once confirmed.
              </p>
              <button
                onClick={onClose}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShippingTaxPaymentModal;
