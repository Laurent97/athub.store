import { useState, useEffect } from 'react';
import { Users, TrendingUp, Gift, Award, Calendar, DollarSign, Copy, Check } from 'lucide-react';
import { ReferralService } from '@/services/referralService';
import type { PartnerReferralStats, ReferralBenefit } from '@/lib/types/referral';
import { cn } from '@/lib/utils';

interface ReferralStatsProps {
  partnerId: string;
  className?: string;
}

const ReferralStats: React.FC<ReferralStatsProps> = ({ partnerId, className }) => {
  const [stats, setStats] = useState<PartnerReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    fetchReferralStats();
  }, [partnerId]);

  const fetchReferralStats = async () => {
    try {
      const data = await ReferralService.getPartnerReferralStats(partnerId);
      setStats(data);
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyInvitationCode = async () => {
    if (stats?.invitation_code) {
      try {
        await navigator.clipboard.writeText(stats.invitation_code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } catch (err) {
        console.error('Failed to copy invitation code:', err);
      }
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'from-purple-600 to-purple-700';
      case 'gold': return 'from-yellow-600 to-yellow-700';
      case 'silver': return 'from-gray-600 to-gray-700';
      default: return 'from-orange-600 to-orange-700';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum': return '💎';
      case 'gold': return '🏆';
      case 'silver': return '🥈';
      default: return '🥉';
    }
  };

  const getTierProgress = (tier: string) => {
    const tiers = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tiers.indexOf(tier);
    return ((currentIndex + 1) / tiers.length) * 100;
  };

  if (loading) {
    return (
      <div className={cn('bg-white rounded-xl shadow-lg p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={cn('bg-white rounded-xl shadow-lg p-6', className)}>
        <div className="text-center text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Referral stats not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Invitation Code */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Referral Program</h2>
            <p className="text-purple-100">Invite partners and earn rewards!</p>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <div className="bg-white/20 backdrop-blur rounded-lg p-3">
              <p className="text-sm text-purple-100 mb-1">Your Invitation Code</p>
              <div className="flex items-center gap-2">
                <code className="text-lg font-mono font-bold">{stats.invitation_code}</code>
                <button
                  onClick={copyInvitationCode}
                  className="p-1 hover:bg-white/30 rounded transition-colors"
                  title={copiedCode ? 'Copied!' : 'Copy code'}
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getTierIcon(stats.referral_tier)}</span>
              <div>
                <p className="text-sm text-purple-100">Current Tier</p>
                <p className="font-bold capitalize">{stats.referral_tier}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-purple-600" />
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.referral_count}</p>
          <p className="text-sm text-gray-600">Referrals</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-green-600" />
            <span className="text-sm text-gray-500">Earned</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">${stats.referral_earnings.toFixed(2)}</p>
          <p className="text-sm text-gray-600">From Referrals</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Gift className="w-8 h-8 text-blue-600" />
            <span className="text-sm text-gray-500">Active</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.benefits.filter(b => b.status === 'active').length}
          </p>
          <p className="text-sm text-gray-600">Benefits</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            <span className="text-sm text-gray-500">Bonus</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            +{stats.tier_benefits.commission_bonus_percent}%
          </p>
          <p className="text-sm text-gray-600">Commission</p>
        </div>
      </div>

      {/* Tier Progress */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Tier Progress</h3>
          <Award className="w-5 h-5 text-gray-500" />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Current Level</span>
            <span className="text-sm font-bold capitalize text-gray-900">{stats.referral_tier}</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={cn(
                'h-3 rounded-full transition-all duration-500',
                `bg-gradient-to-r ${getTierColor(stats.referral_tier)}`
              )}
              style={{ width: `${getTierProgress(stats.referral_tier)}%` }}
            />
          </div>
          
          <div className="grid grid-cols-4 gap-2 text-center">
            {['bronze', 'silver', 'gold', 'platinum'].map((tier, index) => (
              <div 
                key={tier}
                className={cn(
                  'p-2 rounded-lg text-xs font-medium',
                  tier === stats.referral_tier 
                    ? 'bg-gradient-to-r ' + getTierColor(tier) + ' text-white'
                    : 'bg-gray-100 text-gray-600'
                )}
              >
                <div className="text-lg mb-1">
                  {tier === 'bronze' ? '🥉' : tier === 'silver' ? '🥈' : tier === 'gold' ? '🏆' : '💎'}
                </div>
                <div className="capitalize">{tier}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Benefits */}
      {stats.tier_benefits && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Tier Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.tier_benefits.commission_bonus_percent > 0 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Commission Bonus</p>
                  <p className="text-xs text-gray-600">+{stats.tier_benefits.commission_bonus_percent}%</p>
                </div>
              </div>
            )}
            
            {stats.tier_benefits.commission_reduction_percent > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Rate Reduction</p>
                  <p className="text-xs text-gray-600">-{stats.tier_benefits.commission_reduction_percent}%</p>
                </div>
              </div>
            )}
            
            {stats.tier_benefits.monthly_credit > 0 && (
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Gift className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Monthly Credit</p>
                  <p className="text-xs text-gray-600">${stats.tier_benefits.monthly_credit}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Referrals */}
      {stats.referred_partners.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Referrals</h3>
            <Users className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-3">
            {stats.referred_partners.slice(0, 5).map((partner) => (
              <div key={partner.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{partner.store_name}</p>
                  <p className="text-sm text-gray-600">{partner.store_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 capitalize">{partner.partner_status}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(partner.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralStats;
