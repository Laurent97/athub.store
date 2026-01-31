import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase/client';
import { partnerTransactionService, PartnerTransaction } from '../../lib/supabase/partner-transaction-service';
import LoadingSpinner from '../../components/LoadingSpinner';
import ThemeSwitcher from '../../components/ThemeSwitcher';
import { 
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Wallet,
  CreditCard,
  Receipt,
  BarChart3,
  PieChart,
  Target,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TransactionStats {
  totalPayments: number;
  totalPayouts: number;
  totalRefunds: number;
  netProfit: number;
  transactionCount: number;
}

export default function PartnerTransactions() {
  const { userProfile } = useAuth();
  const [transactions, setTransactions] = useState<PartnerTransaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'payment' | 'payout' | 'refund'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (userProfile?.id) {
      loadTransactions();
      loadStats();
    }
  }, [userProfile?.id, filter, statusFilter, period]);

  const loadTransactions = async () => {
    if (!userProfile?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get partner profile ID from user ID
      const { data: partnerProfile, error: profileError } = await supabase
        .from('partner_profiles')
        .select('id')
        .eq('user_id', userProfile.id)
        .single();

      if (profileError) throw profileError;
      if (!partnerProfile) throw new Error('Partner profile not found');

      const options: any = {
        limit: 50
      };

      if (filter !== 'all') {
        options.type = filter;
      }

      if (statusFilter !== 'all') {
        options.status = statusFilter;
      }

      if (period !== 'all') {
        options.dateFrom = getDateFromPeriod(period);
      }

      const { data, error } = await partnerTransactionService.getPartnerTransactions(
        partnerProfile.id,
        options
      );

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!userProfile?.id) return;
    
    try {
      // Get partner profile ID from user ID
      const { data: partnerProfile, error: profileError } = await supabase
        .from('partner_profiles')
        .select('id')
        .eq('user_id', userProfile.id)
        .single();

      if (profileError) throw profileError;
      if (!partnerProfile) throw new Error('Partner profile not found');

      const { data, error } = await partnerTransactionService.getTransactionStats(
        partnerProfile.id,
        period === 'all' ? '1y' : period
      );

      if (error) throw error;
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const getDateFromPeriod = (period: string) => {
    const now = new Date();
    let dateFrom: Date;

    switch (period) {
      case '7d':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return undefined;
    }

    return dateFrom.toISOString();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    await loadStats();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <ArrowDownLeft className="w-4 h-4 text-blue-500" />;
      case 'payout':
        return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      case 'refund':
        return <RefreshCw className="w-4 h-4 text-orange-500" />;
      default:
        return <Receipt className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment':
        return 'text-blue-600 dark:text-blue-400';
      case 'payout':
        return 'text-green-600 dark:text-green-400';
      case 'refund':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Transaction History
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Track your payments, payouts, and refunds
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <ThemeSwitcher />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <ArrowDownLeft className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    Payments
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
                  <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(stats.totalPayments)}
                  </h3>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <ArrowUpRight className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Payouts
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Received</p>
                  <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(stats.totalPayouts)}
                  </h3>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    Profit
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Net Profit</p>
                  <h3 className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(stats.netProfit)}
                  </h3>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    Activity
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
                  <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.transactionCount}
                  </h3>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
              </div>
              
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                  <SelectItem value="payout">Payouts</SelectItem>
                  <SelectItem value="refund">Refunds</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Transactions
            </CardTitle>
            <CardDescription>
              Your transaction history with detailed information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <Button onClick={loadTransactions} className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No transactions found</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Transactions will appear here once you start processing orders
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        transaction.transaction_type === 'payment' 
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : transaction.transaction_type === 'payout'
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-orange-100 dark:bg-orange-900/30'
                      }`}>
                        {getTypeIcon(transaction.transaction_type)}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-medium capitalize ${getTypeColor(transaction.transaction_type)}`}>
                            {transaction.transaction_type}
                          </p>
                          <Badge className={getStatusColor(transaction.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(transaction.status)}
                              <span className="text-xs">{transaction.status}</span>
                            </div>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {transaction.description}
                        </p>
                        {transaction.orders?.order_number && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Order #{transaction.orders.order_number}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        transaction.transaction_type === 'payment'
                          ? 'text-blue-600 dark:text-blue-400'
                          : transaction.transaction_type === 'payout'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {transaction.transaction_type === 'payment' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      {transaction.processed_at && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Processed: {formatDate(transaction.processed_at)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
