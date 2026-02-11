import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  partner: {
    store_name: string;
    contact_email: string;
    contact_phone: string;
  } | null;
  logistics: {
    tracking_number: string;
    shipping_provider: string;
    estimated_delivery: string;
  } | null;
}

export default function OrderSuccessStore() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          partner:partner_profiles!orders_partner_id_fkey (store_name, contact_email, contact_phone),
          logistics:logistics_tracking (*)
        `)
        .eq('id', orderId)
        .single();

      if (error || !data) {
        navigate('/not-found');
        return;
      }

      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
      navigate('/not-found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">Order not found</h2>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Success Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-8 text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h1 className="text-3xl font-bold mb-3">Order Successful!</h1>
                <p className="text-green-100">
                  Thank you for your purchase from {order.partner?.store_name || 'our store'}
                </p>
              </div>

              {/* Order Details */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Order Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-500">Order Number</div>
                        <div className="font-mono font-bold text-gray-900">{order.order_number}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Date & Time</div>
                        <div className="font-medium">
                          {new Date(order.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Total Amount</div>
                        <div className="text-2xl font-bold text-green-600">
                          ${order.total_amount.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Status</div>
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                          {order.status}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Store Information
                    </h3>
                    {order.partner && (
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm text-gray-500">Store Name</div>
                          <div className="font-medium">{order.partner.store_name}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Contact Email</div>
                          <div className="font-medium">{order.partner.contact_email}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Contact Phone</div>
                          <div className="font-medium">{order.partner.contact_phone}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Information */}
                {order.logistics && (
                  <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Shipping Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Shipping Provider</div>
                        <div className="font-medium">{order.logistics.shipping_provider}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Tracking Number</div>
                        <div className="font-mono font-medium">{order.logistics.tracking_number}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Estimated Delivery</div>
                        <div className="font-medium">
                          {new Date(order.logistics.estimated_delivery).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 mb-8">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                    What happens next?
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center mr-3 mt-1">
                        1
                      </div>
                      <div>
                        <div className="font-medium text-yellow-800">Order Processing</div>
                        <div className="text-sm text-yellow-700">
                          The store will prepare your order for shipping
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center mr-3 mt-1">
                        2
                      </div>
                      <div>
                        <div className="font-medium text-yellow-800">Shipping</div>
                        <div className="text-sm text-yellow-700">
                          You'll receive tracking information once shipped
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center mr-3 mt-1">
                        3
                      </div>
                      <div>
                        <div className="font-medium text-yellow-800">Delivery</div>
                        <div className="text-sm text-yellow-700">
                          Your order will be delivered to your address
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    to="/orders"
                    className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 text-center"
                  >
                    View All Orders
                  </Link>
                  <Link
                    to="/manufacturers"
                    className="bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 text-center"
                  >
                    Browse More Stores
                  </Link>
                  <button
                    onClick={() => window.print()}
                    className="bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50"
                  >
                    Print Receipt
                  </button>
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
