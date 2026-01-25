import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CheckCircle, Package, Mail, Home } from 'lucide-react';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const orderId = location.state?.orderId;
  const paymentData = location.state?.paymentData;

  console.log('=== ORDER SUCCESS DEBUG ===');
  console.log('Received orderId:', orderId);
  console.log('Received paymentData:', paymentData);
  console.log('Location state:', location.state);
  console.log('Has orderData:', !!location.state?.orderData);
  console.log('OrderData:', location.state?.orderData);

  useEffect(() => {
    // Redirect if no order data
    if (!orderId && !location.state) {
      navigate('/');
    }
  }, [orderId, location.state, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              {/* Success Icon */}
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>

              {/* Success Message */}
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Order Confirmed!
              </h1>
              <p className="text-gray-600 mb-8">
                Thank you for your purchase. Your order has been successfully placed.
              </p>

              {/* Order Details */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <div className="space-y-3">
                  {orderId && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-mono font-semibold">{orderId}</span>
                    </div>
                  )}
                  {paymentData?.method && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-semibold capitalize">{paymentData.method}</span>
                    </div>
                  )}
                  {paymentData?.paymentIntentId && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-mono text-sm">{paymentData.paymentIntentId}</span>
                    </div>
                  )}
                  {paymentData?.amount && (
                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-bold text-lg">${paymentData.amount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* What's Next */}
              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-blue-800 mb-4">What's Next?</h3>
                <div className="space-y-3 text-left">
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900">Confirmation Email</div>
                      <div className="text-sm text-blue-700">
                        {user?.email ? `We've sent an order confirmation to ${user.email}` : 'Check your email for order confirmation'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Package className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900">Order Processing</div>
                      <div className="text-sm text-blue-700">
                        Your order is being processed and will be shipped within 2-3 business days
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {location.state?.orderData && (
                  <button
                    onClick={() => navigate(`/orders/${orderId}`)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center"
                  >
                    <Package className="w-5 h-5 mr-2" />
                    View Order Details
                  </button>
                )}
                <button
                  onClick={() => navigate('/')}
                  className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 font-semibold flex items-center justify-center"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
