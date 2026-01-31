import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { partnerService } from '../../lib/supabase/partner-service';

export default function DashboardOverview() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    conversionRate: 0
  });

  useEffect(() => {
    const loadOverviewStats = async () => {
      if (!user || !userProfile) return;
      
      try {
        const { data: partnerData } = await partnerService.getPartnerProfile(user.id);
        
        if (partnerData) {
          const { data: stats } = await partnerService.getPartnerStats(partnerData.id);
          if (stats) {
            setStats({
              totalSales: stats.totalOrders || 0,
              pendingOrders: stats.pendingOrders || 0,
              totalEarnings: stats.totalEarnings || 0,
              conversionRate: stats.totalOrders > 0 ? (stats.completedOrders / stats.totalOrders * 100) : 0
            });
          }
        }
      } catch (error) {
        console.error('Error loading overview stats:', error);
      }
    };

    loadOverviewStats();
  }, [user, userProfile]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-card rounded-lg shadow p-4 sm:p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-sm mb-2">Total Sales</div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalSales}</div>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-lg sm:text-xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-4 sm:p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-sm mb-2">Pending Orders</div>
              <div className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingOrders}</div>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 dark:text-yellow-400 text-lg sm:text-xl">🛒</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-4 sm:p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-sm mb-2">Total Earnings</div>
              <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">${stats.totalEarnings.toFixed(2)}</div>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-lg sm:text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-4 sm:p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-sm mb-2">Conversion Rate</div>
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.conversionRate.toFixed(1)}%</div>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 text-lg sm:text-xl">📈</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Quick Actions</h4>
          <div className="space-y-2">
                  <button
                    onClick={() => navigate('/partner/dashboard/products')}
                    className="w-full text-left px-4 py-2 bg-white dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
                  >
                    📦 Browse Products
                  </button>
                  <button
                    onClick={() => navigate('/partner/dashboard/orders')}
                    className="w-full text-left px-4 py-2 bg-white dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
                  >
                    🛒 View Orders
                  </button>
                  <button
                    onClick={() => navigate('/partner/dashboard/wallet')}
                    className="w-full text-left px-4 py-2 bg-white dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
                  >
                    💰 Check Earnings
                  </button>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Recent Activity</h4>
          <div className="text-gray-600 dark:text-gray-400 text-sm space-y-2">
            <p>No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  );
}
