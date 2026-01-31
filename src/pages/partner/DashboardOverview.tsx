import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { partnerService } from '../../lib/supabase/partner-service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Activity, Package, Users, Eye } from 'lucide-react';

export default function DashboardOverview() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    profitTrend: 0,
    monthlyRevenue: 0,
    lastMonthRevenue: 0,
    pendingOrders: 0,
    conversionRate: 0,
    storeVisits: 0
  });

  useEffect(() => {
    const loadOverviewStats = async () => {
      if (!user || !userProfile) return;
      
      try {
        const { data: partnerData } = await partnerService.getPartnerProfile(user.id);
        
        if (partnerData) {
          const { data: partnerStats } = await partnerService.getPartnerStats(partnerData.id);
          if (partnerStats) {
            const profitTrend = partnerStats.lastMonthRevenue > 0 
              ? ((partnerStats.thisMonthRevenue - partnerStats.lastMonthRevenue) / partnerStats.lastMonthRevenue) * 100 
              : 0;
              
            setStats({
              totalRevenue: partnerStats.totalRevenue || 0,
              totalOrders: partnerStats.totalOrders || 0,
              avgOrderValue: partnerStats.averageOrderValue || 0,
              profitTrend,
              monthlyRevenue: partnerStats.thisMonthRevenue || 0,
              lastMonthRevenue: partnerStats.lastMonthRevenue || 0,
              pendingOrders: partnerStats.pendingOrders || 0,
              conversionRate: partnerStats.conversionRate || 0,
              storeVisits: partnerStats.storeVisits?.allTime || 0
            });
          }
        }
      } catch (error) {
        console.error('Error loading overview stats:', error);
      }
    };

    loadOverviewStats();
  }, [user, userProfile]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Compact Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Total Revenue */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-blue-100 text-xs font-medium mb-1">Total Revenue</div>
                <div className="text-xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-100 text-xs font-medium mb-1">Total Orders</div>
                <div className="text-xl font-bold">{stats.totalOrders.toLocaleString()}</div>
                {stats.pendingOrders > 0 && (
                  <Badge className="mt-1 bg-yellow-400 text-yellow-900 text-xs">
                    {stats.pendingOrders} pending
                  </Badge>
                )}
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-purple-100 text-xs font-medium mb-1">Avg Order Value</div>
                <div className="text-xl font-bold">{formatCurrency(stats.avgOrderValue)}</div>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profit Trend */}
        <Card className={`bg-gradient-to-br ${
          stats.profitTrend >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'
        } text-white border-0 shadow-lg`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/80 text-xs font-medium mb-1">Profit Trend</div>
                <div className="text-xl font-bold flex items-center gap-1">
                  {stats.profitTrend >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {formatPercentage(stats.profitTrend)}
                </div>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-amber-100 text-xs font-medium mb-1">Monthly Revenue</div>
                <div className="text-xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
                {stats.lastMonthRevenue > 0 && (
                  <Badge className={`mt-1 ${
                    stats.monthlyRevenue >= stats.lastMonthRevenue 
                      ? 'bg-green-400 text-green-900' 
                      : 'bg-red-400 text-red-900'
                  } text-xs`}>
                    {formatPercentage(((stats.monthlyRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100)}
                  </Badge>
                )}
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Visits */}
        <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-teal-100 text-xs font-medium mb-1">Store Visits</div>
                <div className="text-xl font-bold">{stats.storeVisits.toLocaleString()}</div>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - More Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => navigate('/partner/dashboard/products')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 transition-colors"
        >
          <Package className="w-4 h-4 text-blue-600" />
          <span className="font-medium">Products</span>
        </button>
        <button
          onClick={() => navigate('/partner/dashboard/orders')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 transition-colors"
        >
          <ShoppingCart className="w-4 h-4 text-green-600" />
          <span className="font-medium">Orders</span>
        </button>
        <button
          onClick={() => navigate('/partner/dashboard/earnings')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 transition-colors"
        >
          <DollarSign className="w-4 h-4 text-amber-600" />
          <span className="font-medium">Earnings</span>
        </button>
        <button
          onClick={() => navigate('/partner/dashboard/analytics')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 transition-colors"
        >
          <Activity className="w-4 h-4 text-purple-600" />
          <span className="font-medium">Analytics</span>
        </button>
      </div>

      {/* Recent Activity - Minimal */}
      <Card className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h4>
            <Badge variant="outline" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              Live
            </Badge>
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            <p>📈 Dashboard is actively monitoring your performance</p>
            <p className="mt-1">🎯 All metrics are up-to-date</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
