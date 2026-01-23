import { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { paymentService } from '../../lib/supabase/payment-service';
import { useAuth } from '../../contexts/AuthContext';

interface PayPalPaymentProps {
  amount: number;
  orderId?: string;
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
}

export default function PayPalPayment({ amount, orderId, onSuccess, onError }: PayPalPaymentProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test';

  useEffect(() => {
    const htmlElement = document.documentElement;
    setIsDarkMode(htmlElement.classList.contains('dark'));
  }, []);

  const createOrder = async () => {
    setLoading(true);
    try {
      const transactionId = `order_${Date.now()}_${user?.id || 'guest'}`;
      
      const { data, error } = await paymentService.createPayPalTransaction({
        orderId: transactionId,
        amount,
        currency: 'USD'
      });

      if (error) throw error;
      
      return transactionId;
    } catch (error: any) {
      onError(error.message);
      return '';
    } finally {
      setLoading(false);
    }
  };

  const onApprove = async (data: any) => {
    setLoading(true);
    try {
      // Update transaction status
      await paymentService.updatePayPalTransaction(
        data.orderID,
        'completed',
        data.paymentID
      );

      // Link to order if exists
      if (orderId) {
        await paymentService.linkOrderToPayment(
          orderId,
          'paypal',
          amount,
          data.orderID
        );
      }

      onSuccess({
        orderId: data.orderID,
        amount,
        method: 'paypal'
      });
    } catch (error: any) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
        <PayPalScriptProvider
          options={{
            clientId: paypalClientId,
            currency: "USD",
            intent: "capture"
          }}
        >
          <PayPalButtons
            style={{
              layout: "vertical",
              color: "blue",
              shape: "rect",
              label: "paypal"
            }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={(err) => onError(typeof err === 'string' ? err : err?.message || 'PayPal payment error')}
            disabled={loading}
          />
        </PayPalScriptProvider>
      </div>

      <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-yellow-900/40 border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
        <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>PayPal Information:</h4>
        <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
          <li>• You'll be redirected to PayPal to complete payment</li>
          <li>• Use sandbox account for testing: sb-4a1dq39276485@personal.example.com</li>
          <li>• Password: K5L=fP2+</li>
          <li>• Orders are processed after payment confirmation</li>
        </ul>
      </div>
    </div>
  );
}
