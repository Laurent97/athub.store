import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../lib/supabase/order-service';
import { shippingTaxPaymentService } from '../lib/supabase/shipping-tax-payment-service';
import { supabase } from '../lib/supabase/client';
import PaymentMethodSelector from '../components/Payment/PaymentMethodSelector';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, DollarSign, Truck } from 'lucide-react';

export default function PaymentShippingTax() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const { user } = useAuth();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }

    // Allow access without login for external sharing
    if (!user) {
      console.log('User not logged in, allowing public access to payment page');
      loadOrder();
      return;
    }

    loadOrder();
  }, [user, orderId, navigate, location.pathname]);

  const loadOrder = async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Try to get order by ID first
      const { data: orderData, error: orderError } = await orderService.getOrderById(orderId);
      
      if (orderError || !orderData) {
        // Try public access if user is not logged in
        if (!user) {
          console.log('User not logged in, trying public API access...');
          try {
            const response = await fetch(`/api/public/orders/${orderId}`);
            if (response.ok) {
              const publicOrder = await response.json();
              console.log('Found order via public API:', publicOrder);
              setOrder({
                ...publicOrder,
                isPublicView: true
              });
              return;
            }
          } catch (publicError) {
            console.log('Public API failed, trying direct database access...');
          }
          
          const { data: publicOrder, error: publicError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .maybeSingle();
          
          if (publicOrder && !publicError) {
            console.log('Found order via public access:', publicOrder);
            setOrder({
              ...publicOrder,
              isPublicView: true
            });
            return;
          }
        }
        throw new Error('Failed to load order');
      }

      // Only check authorization if user is logged in
      if (user && orderData.customer_id !== user.id) {
        throw new Error('Unauthorized access to this order');
      }

      // Check if shipping and tax fees are set
      if (!orderData.shipping_fee) {
        throw new Error('No shipping fees set for this order');
      }

      setOrder({
        ...orderData,
        isPublicView: !user
      });
    } catch (err) {
      console.error('Error loading order:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    if (!order || !user) return;

    setPaymentProcessing(true);
    try {
      // Create shipping/tax payment record
      const { data: paymentRecord, error: createError } = await shippingTaxPaymentService.createShippingTaxPayment({
        order_id: order.id,
        shipping_amount: order.shipping_fee || 0,
        tax_amount: order.tax_fee || 0,
        payment_method: paymentData.method || 'unknown',
        payment_intent_id: paymentData.paymentIntentId || `${paymentData.method}-${Date.now()}`,
        customer_id: user.id,
      });

      if (createError) {
        throw createError;
      }

      // Process the payment
      if (paymentRecord) {
        const { error: processError } = await shippingTaxPaymentService.processPayment(
          paymentRecord.id,
          paymentData
        );

        if (processError) {
          throw processError;
        }

        // Confirm payment
        const { error: confirmError } = await shippingTaxPaymentService.confirmPayment(
          paymentRecord.id,
          paymentData.paymentIntentId || `${paymentData.method}-${Date.now()}`
        );

        if (confirmError) {
          throw confirmError;
        }

        // Success - redirect to order details
        navigate(`/orders/${order.order_number || order.id}`, {
          state: {
            message: 'Shipping and tax payment completed successfully!',
          },
        });
      }
    } catch (err) {
      console.error('Payment error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Payment processing failed';
      setError(errorMessage);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handlePaymentError = (errorMsg: string) => {
    setError(errorMsg);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow bg-background flex items-center justify-center">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow bg-background py-8">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-300 mb-2">
                Error
              </h2>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={() => navigate('/my-orders')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Back to My Orders
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow bg-background py-8">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="text-center">
              <p className="text-gray-500">Order not found</p>
              <button
                onClick={() => navigate('/my-orders')}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Back to My Orders
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const shippingAmount = order.shipping_fee || 0;
  const taxAmount = order.tax_fee || 0;
  const totalAmount = shippingAmount + taxAmount;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-background py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Back Button */}
          <button
            onClick={() => navigate('/my-orders')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Orders
          </button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Payment Options */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold mb-2 text-foreground">Pay Shipping & Tax</h1>
              <p className="text-muted-foreground mb-6">
                Order #{order.order_number}
              </p>

              {paymentProcessing && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-3">
                    <LoadingSpinner />
                    <div>
                      <h3 className="font-semibold text-blue-800 dark:text-blue-300">Processing Payment</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-400">Please wait...</p>
                    </div>
                  </div>
                </div>
              )}

              <PaymentMethodSelector
                orderId={order.id}
                amount={totalAmount}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
              />
            </div>

            {/* Right Column - Payment Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg shadow p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-6 text-foreground">Payment Summary</h2>

                {/* Order Item */}
                <div className="mb-6 pb-6 border-b border-border">
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground">Shipping & Tax for Order</h3>
                      <p className="text-sm text-muted-foreground">
                        Order #{order.order_number}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-3 mb-6 pb-6 border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping Fee</span>
                    <span className="font-semibold text-foreground">
                      ${shippingAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-semibold text-foreground">
                      ${taxAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-foreground">Total Due</span>
                  <span className="text-2xl font-bold text-orange-600">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>

                {/* Security Info */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 mb-2">
                    <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <span>✓</span>
                    </div>
                    Secure Payment
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 mb-2">
                    <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <span>✓</span>
                    </div>
                    SSL Encrypted
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <span>✓</span>
                    </div>
                    Multiple Payment Options
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
