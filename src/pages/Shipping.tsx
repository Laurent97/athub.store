import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Truck, Clock, MapPin, Package, Shield, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { orderService } from '../lib/supabase/order-service';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';

export default function Shipping() {
  const location = useLocation();
  const queryOrderNumber = new URLSearchParams(location.search).get('order');
  const [orderNumber, setOrderNumber] = useState(queryOrderNumber || '');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (queryOrderNumber) {
      handleSearch(queryOrderNumber);
    }
  }, [queryOrderNumber]);

  const handleSearch = async (searchTerm?: string) => {
    const term = searchTerm || orderNumber;
    if (!term.trim()) {
      setError('Please enter an order number');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);
    
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(term);
      const looksLikeOrderNumber = /^ORD-/i.test(term);

      let result;
      if (isUUID) {
        result = await orderService.getOrderById(term);
      } else if (looksLikeOrderNumber) {
        result = await orderService.getOrderByNumber(term);
      } else {
        // Try order number first (in case user pasted a number without prefix),
        // then fall back to tracking number lookup.
        result = await orderService.getOrderByNumber(term);
        if (!result.data) {
          result = await orderService.getOrderByTrackingNumber(term);
        }
      }

      if (result.data) {
        setOrder(result.data);
      } else {
        setError('Order not found. Please check your order number and try again.');
        setOrder(null);
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to fetch order details. Please try again.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white rounded-b-2xl pt-12 pb-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Shipping Information</h1>
          <p className="text-blue-100 dark:text-blue-200">Track your order and learn about our shipping process</p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl py-12 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-12 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Track Your Order</h2>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter your order number..."
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
            <button 
              onClick={() => handleSearch()}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </div>
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {order && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Order #{order.order_number}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Placed on {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                  order.status === 'processing' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                }`}>
                  {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">${order.total_amount?.toFixed(2)}</p>
                </div>
                {order.tracking_number && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Tracking Number</p>
                    <p className="text-xl font-mono font-bold text-blue-600 dark:text-blue-400">{order.tracking_number}</p>
                  </div>
                )}
              </div>
            </div>

            {order.shipping_address && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Shipping Address</h3>
                </div>
                <div className="space-y-1 text-gray-700 dark:text-gray-300">
                  <p className="font-medium">{order.shipping_address.full_name}</p>
                  <p>{order.shipping_address.address_line1}</p>
                  {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                  <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                  <p>{order.shipping_address.country}</p>
                  {order.shipping_address.phone && <p className="pt-2 text-sm">Phone: {order.shipping_address.phone}</p>}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Delivery Status
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600 my-2"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Order Placed</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      order.status === 'processing' || order.status === 'shipped' || order.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <Package className={`w-5 h-5 ${
                        order.status === 'processing' || order.status === 'shipped' || order.status === 'completed'
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600 my-2"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Processing</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Your order is being prepared</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      order.status === 'shipped' || order.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <Truck className={`w-5 h-5 ${
                        order.status === 'shipped' || order.status === 'completed'
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600 my-2"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Shipped</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.tracking_number ? `Tracking: ${order.tracking_number}` : 'En route to your location'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      order.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <CheckCircle className={`w-5 h-5 ${
                        order.status === 'completed'
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-400'
                      }`} />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Delivered</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.status === 'completed' ? 'Your order has been delivered' : 'Awaiting delivery'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Order Items ({order.order_items?.length || 0})
              </h3>
              <div className="space-y-3">
                {order.order_items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="flex items-center gap-3 flex-1">
                      {item.product?.images?.[0] && (
                        <img 
                          src={item.product.images[0]} 
                          alt={item.product?.title} 
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.product?.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">${(item.unit_price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {searched && !order && !loading && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">No Order Found</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
              We couldn't find an order with that number. Please check and try again.
            </p>
            <button
              onClick={() => {
                setOrderNumber('');
                setOrder(null);
                setSearched(false);
                setError(null);
              }}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              ← Try Another Order
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fast Shipping</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Standard shipping takes 5-10 business days. Express options available.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fully Insured</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All packages are fully insured against damage and loss during transit.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Real-Time Tracking</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track your package 24/7 with real-time updates and notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
