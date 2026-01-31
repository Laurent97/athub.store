import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase/client';
import { partnerService } from '../../lib/supabase/partner-service';
import { walletService } from '../../lib/supabase/wallet-service';
import StoreIdBadge from '../../components/ui/StoreIdBadge';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import PartnerSidebar from '../../components/Partner/PartnerSidebar';
import Breadcrumbs from '../../components/Breadcrumbs';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  Star,
  Package,
  ShoppingCart,
  Users,
  Activity,
  Calendar,
  Award,
  Target,
  BarChart3,
  CreditCard,
  Store,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { isDark } = useTheme();
  
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    totalOrders: 0,
    storeVisits: {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      lastMonth: 0,
      allTime: 0
    },
    storeCreditScore: 0,
    storeRating: 0,
    totalProducts: 0,
    activeProducts: 0,
    walletBalance: 0,
    pendingBalance: 0,
    monthlyRevenue: 0,
    lastMonthRevenue: 0,
    commissionRate: 10 // Store as percentage (10% = 10)
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth', { state: { from: '/partner/dashboard' } });
      return;
    }

    const userType = userProfile?.user_type || 'user';
    
    // Only admins and approved partners can access dashboard
    if (userType === 'admin') {
      // Admins redirected to admin dashboard
      navigate('/admin');
      return;
    }
    
    if (userType !== 'partner') {
      // Non-partners redirected to register
      navigate('/partner/register');
      return;
    }

    // Partners must be approved to access dashboard
    if (userProfile?.partner_status !== 'approved') {
      navigate('/partner/pending');
      return;
    }

    loadPartnerData();
  }, [user, userProfile, navigate]);

  const loadPartnerData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Load partner profile
      const { data: partnerData, error: partnerError } = await partnerService.getPartnerProfile(user.id);
      
      if (partnerError) {
        console.warn('Partner profile not found:', partnerError);
        // Don't throw error, just continue with null partner data
        setPartner(null);
      } else {
        setPartner(partnerData);
      }

      if (partnerData) {
        // Load partner analytics
        const { success, data: stats } = await partnerService.getPartnerStats(partnerData.id);
        
        // Get wallet balance
        const { data: walletData } = await walletService.getBalance(user.id);
        
        // Get pending transactions for accurate pending balance
        const { data: pendingTransactions } = await supabase
          .from('wallet_transactions')
          .select('amount, status, type')
          .eq('user_id', user.id)
          .eq('status', 'pending');
        
        // Calculate pending balance from actual pending transactions
        const pendingBalance = pendingTransactions?.reduce((sum, transaction) => {
          if (transaction.type === 'deposit' || transaction.type === 'commission' || transaction.type === 'bonus') {
            return sum + transaction.amount;
          }
          return sum; // Don't include withdrawals in pending balance
        }, 0) || 0;
        
        if (success && stats) {
          setStats({
            totalSales: stats.totalSales || 0,
            pendingOrders: stats.pendingOrders || 0,
            totalEarnings: stats.totalEarnings || 0,
            conversionRate: stats.conversionRate || 0,
            averageOrderValue: stats.averageOrderValue || 0,
            totalOrders: stats.totalOrders || 0,
            storeVisits: {
              today: stats.storeVisits?.today || 0,
              thisWeek: stats.storeVisits?.thisWeek || 0,
              thisMonth: stats.storeVisits?.thisMonth || 0,
              lastMonth: stats.storeVisits?.lastMonth || 0,
              allTime: stats.storeVisits?.allTime || 0
            },
            storeCreditScore: partnerData.store_credit_score || 750,
            storeRating: partnerData.store_rating || 0,
            totalProducts: partnerData.total_products || 0,
            activeProducts: partnerData.active_products || 0,
            walletBalance: walletData?.balance || 0,
            pendingBalance: pendingBalance, // Use calculated pending balance
            monthlyRevenue: stats.thisMonthRevenue || 0,
            lastMonthRevenue: stats.lastMonthRevenue || 0,
            commissionRate: partnerData.commission_rate || 10 // Store as percentage
          });
        }
      } else {
        // Set default stats if no partner data
        setStats({
          totalSales: 0,
          pendingOrders: 0,
          totalEarnings: 0,
          conversionRate: 0,
          averageOrderValue: 0,
          totalOrders: 0,
          storeVisits: {
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
            lastMonth: 0,
            allTime: 0
          },
          storeCreditScore: 0,
          storeRating: 0,
          totalProducts: 0,
          activeProducts: 0,
          walletBalance: 0,
          pendingBalance: 0,
          monthlyRevenue: 0,
          lastMonthRevenue: 0,
          commissionRate: 10 // Store as percentage
        });
      }
    } catch (error) {
      console.error('Failed to load partner data:', error);
      // Set default stats on error
      setStats({
        totalSales: 0,
        pendingOrders: 0,
        totalEarnings: 0,
        conversionRate: 0,
        averageOrderValue: 0,
        totalOrders: 0,
        storeVisits: {
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          lastMonth: 0,
          allTime: 0
        },
        storeCreditScore: 0,
        storeRating: 0,
        totalProducts: 0,
        activeProducts: 0,
        walletBalance: 0,
        pendingBalance: 0,
        monthlyRevenue: 0,
        lastMonthRevenue: 0,
        commissionRate: 0.1
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadPartnerData();
    setRefreshing(false);
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { trend: 'up', percentage: 0 };
    const percentage = ((current - previous) / previous) * 100;
    return {
      trend: percentage >= 0 ? 'up' : 'down',
      percentage: Math.abs(percentage)
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Partner Profile Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please complete your partner registration to access the dashboard.
            </p>
            <button
              onClick={() => navigate('/partner/register')}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              Complete Registration
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex-1">
        {/* Professional Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Store className="w-8 h-8" />
                  <h1 className="text-3xl font-bold">Partner Dashboard</h1>
                </div>
                <p className="text-blue-100 text-lg mb-4">
                  Welcome back, {partner?.store_name || userProfile?.email || 'Partner'}!
                </p>
                <div className="flex items-center gap-4">
                  {partner?.store_id && (
                    <StoreIdBadge storeId={partner.store_id} size="sm" variant="outline" />
                  )}
                  <Badge variant={userProfile?.partner_status === 'approved' ? 'default' : 'secondary'}>
                    {userProfile?.partner_status === 'approved' ? '✅ Verified Partner' : '⏳ Under Review'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshData}
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Partner Metrics Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Total Orders */}
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalOrders}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Orders</div>
              </div>
              
              {/* Available Balance */}
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">${stats.walletBalance.toLocaleString()}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Available Balance</div>
              </div>
              
              {/* Commission Rate */}
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.commissionRate.toFixed(1)}%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Commission Rate</div>
              </div>
              
              {/* Monthly Revenue */}
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">${stats.monthlyRevenue.toLocaleString()}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Monthly Revenue</div>
              </div>
              
              {/* Store Rating */}
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.storeRating.toFixed(1)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Store Rating</div>
              </div>
              
              {/* Active Products */}
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{stats.activeProducts}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Active Products</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Dashboard Content */}

          {/* Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <PartnerSidebar />
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-6">
                  <Breadcrumbs />
                  <div className="mt-6">
                    <Outlet />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
