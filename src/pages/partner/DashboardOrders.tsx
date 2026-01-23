import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { partnerService } from '../../lib/supabase/partner-service';
import { partnerTrackingAPI } from '../../services/tracking-api';
import { walletService } from '../../lib/supabase/wallet-service';
import LoadingSpinner from '../../components/LoadingSpinner';
import ThemeSwitcher from '../../components/ThemeSwitcher';
import OrderActionsDropdown from '../../components/Partner/OrderActionsDropdown';
import OrderTrackingBadge from '../../components/Partner/OrderTrackingBadge';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { useOrderRealtime } from '../../hooks/useOrderRealtime';
import { 
  Wallet,
  AlertCircle
} from 'lucide-react';

export default function DashboardOrders() {
  const { user, userProfile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [trackingData, setTrackingData] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'>('all');
  
  // Wallet state
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  
  // Partner profile state
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [partnerLoading, setPartnerLoading] = useState(true);

  useEffect(() => {
    if (user?.id && !partnerProfile) {
      loadPartnerProfile();
    }
  }, [user?.id, partnerProfile]);

  useEffect(() => {
    if (partnerProfile) {
      loadOrders();
      loadWalletBalance();
      loadTrackingData();
    }
  }, [partnerProfile]);

  // Realtime subscription for order updates
  useOrderRealtime({
    enabled: !!partnerProfile,
    onOrderUpdate: (payload) => {
      // Only update if this order is assigned to current partner
      if (payload.new.partner_id === partnerProfile?.id) {
        // Update specific order in state
        setOrders(prev => prev.map(order => 
          order.id === payload.new.id 
            ? { ...order, ...payload.new }
            : order
        ));
      } else {
        // If order was reassigned from this partner, remove it
        if (payload.old?.partner_id === partnerProfile?.id && payload.new.partner_id !== partnerProfile?.id) {
          setOrders(prev => prev.filter(order => order.id !== payload.new.id));
        }
        // If order was assigned to this partner, add it
        if (payload.old?.partner_id !== partnerProfile?.id && payload.new.partner_id === partnerProfile?.id) {
          setOrders(prev => [payload.new, ...prev]);
        }
      }
    },
    onOrderInsert: (payload) => {
      // Only add new order if it's assigned to current partner
      if (payload.new.partner_id === partnerProfile?.id) {
        // Add new order to beginning of list
        setOrders(prev => [payload.new, ...prev]);
      }
    },
    onOrderDelete: (payload) => {
      // Only remove order if it was assigned to current partner
      if (payload.old.partner_id === partnerProfile?.id) {
        // Remove order from state
        setOrders(prev => prev.filter(order => order.id !== payload.old.id));
      }
    }
  });

  const loadPartnerProfile = async () => {
    if (!user?.id) return;
    
    setPartnerLoading(true);
    try {
      const { data: partnerData } = await partnerService.getPartnerProfile(user.id);
      setPartnerProfile(partnerData);
    } catch (err) {
      console.error('Failed to load partner profile:', err);
    } finally {
      setPartnerLoading(false);
    }
  };

  const loadWalletBalance = async () => {
    if (!user?.id) return;
    
    setWalletLoading(true);
    try {
      // Use the same wallet service method as the wallet dashboard
      const { data: statsData } = await walletService.getStats(user.id);
      setWalletBalance(statsData?.availableBalance || 0);
    } catch (err) {
      console.error('Failed to load wallet balance:', err);
    } finally {
      setWalletLoading(false);
    }
  };

  const loadTrackingData = async () => {
    if (!partnerProfile?.id) return;
    
    try {
      const result = await partnerTrackingAPI.getPartnerTracking(partnerProfile.id);
      if (result.success && result.data) {
        const trackingMap: {[key: string]: any} = {};
        result.data.forEach((tracking: any) => {
          trackingMap[tracking.order_id] = tracking;
        });
        setTrackingData(trackingMap);
      }
    } catch (err) {
      console.error('Failed to load tracking data:', err);
    }
  };

  const loadOrders = async () => {
    if (!partnerProfile) return;
    
    setLoading(true);
    try {
      const { data: ordersData } = await partnerService.getPartnerOrders(partnerProfile.id);
      setOrders(ordersData || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await partnerService.updateOrderStatus(
        orderId,
        newStatus as 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'
      );
      
      if (error) throw error;
      
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error('Failed to update order:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  // Action handlers for OrderActionsDropdown
  const handleProcessOrder = async (order: any) => {
    if (!user?.id) {
      alert('Authentication required. Please log in again.');
      return;
    }
    
    // Confirm before processing
    const confirmPayment = window.confirm(
      `Process payment for Order #${order.order_number || order.id}?\n\nAmount: $${order.total_amount?.toFixed(2) || '0.00'}\n\nThis will deduct the amount from your wallet balance.`
    );
    
    if (!confirmPayment) return;
    
    try {
      console.log('Processing payment for order:', order.id);
      const { success, error, message } = await partnerService.processOrderPayment(order.id, user.id);
      
      if (error) {
        console.error('Payment processing failed:', error);
        alert(`❌ Payment Failed: ${error}`);
        return;
      }
      
      console.log('Payment processed successfully');
      alert('✅ Payment processed successfully! Order status updated to "Waiting Confirmation".');
      
      // Refresh data
      await loadOrders();
      await loadWalletBalance();
    } catch (err) {
      console.error('Unexpected error processing payment:', err);
      alert('❌ An unexpected error occurred. Please try again or contact support.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300';
      case 'processing': return 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300';
      case 'waiting_confirmation': return 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300';
      case 'shipped': return 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300';
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300';
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">📦 Your Orders</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Manage and track all customer orders</p>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Data updates in real-time • Last updated: Just now
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Wallet Display */}
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {walletLoading ? 'Loading...' : `$${walletBalance.toFixed(2)}`}
              </span>
            </div>
          </div>
          <ThemeSwitcher />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            filter === 'all' ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All Orders ({orders.length})
        </button>
        {['pending', 'waiting_confirmation', 'processing', 'shipped', 'completed', 'cancelled'].map((status) => {
          const count = orders.filter(o => o.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors capitalize ${
                filter === status ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      {loading || partnerLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">No {filter === 'all' ? '' : filter} orders</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">Orders will appear here when customers make purchases</p>
          <button
            onClick={() => window.location.href = '/partner/products/add'}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg shadow transition-all"
          >
            📝 Add Products
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Order ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Items</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tracking</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-gray-900 dark:text-white">
                    {order.order_number || order.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {order.user?.full_name || order.user?.email || 'Customer'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {order.user?.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    ${order.total_amount?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {order.order_items?.length || 0} item(s)
                      </div>
                      {order.order_items?.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="text-xs text-gray-500">
                          • {item.quantity}x {item.product?.make || item.product?.title || 'Product'}
                          {item.product?.sale_price && (
                            <span className="text-gray-400 ml-1">
                              (${item.product.sale_price} each)
                            </span>
                          )}
                        </div>
                      ))}
                      {order.order_items && order.order_items.length > 2 && (
                        <div className="text-xs text-gray-400">
                          +{order.order_items.length - 2} more items
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <OrderStatusBadge status={order.status} size="sm" />
                  </td>
                  <td className="px-6 py-4">
                    <OrderTrackingBadge 
                      tracking={trackingData[order.order_number] || null} 
                      orderId={order.order_number}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {/* Pay Order Button for pending orders */}
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleProcessOrder(order)}
                          className="px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1"
                          title="Process this order payment"
                        >
                          <Wallet className="w-3 h-3" />
                          Pay Order
                        </button>
                      )}
                       {/* Order Status Display */}
                      {order.status === 'cancelled' && (
                        <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                          ⚠️ Order was cancelled by admin
                        </div>
                      )}
                       {/* Actions Dropdown */}
                      <OrderActionsDropdown
                        order={order}
                        currentUser={user}
                        onProcessOrder={handleProcessOrder}
                        onRefresh={loadOrders}
                        walletBalance={walletBalance}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Footer */}
      {orders.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <div>
              Showing <span className="font-medium">{filteredOrders.length}</span> of <span className="font-medium">{orders.length}</span> orders
            </div>
            <div className="space-x-4">
              <button
                onClick={loadOrders}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => window.location.href = '/partner/products/add'}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg shadow transition-all"
              >
                ➕ Add Products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
