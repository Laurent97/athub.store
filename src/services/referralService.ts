import { supabase } from '@/lib/supabase/client';
import type {
  ReferralBenefit,
  InvitationLog,
  ReferralTier,
  PartnerReferralStats,
  ReferralNetworkNode,
  AdminReferralStats,
  InvitationValidation,
  ReferralBenefitCalculation,
  ReferralTierLevel,
  BenefitType
} from '@/lib/types/referral';

export class ReferralService {
  // Generate invitation code
  static async generateInvitationCode(): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_invitation_code');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating invitation code:', error);
      throw error;
    }
  }

  // Validate invitation code
  static async validateInvitationCode(code: string): Promise<InvitationValidation> {
    try {
      // First validate format
      const { data: isValid, error: validationError } = await supabase
        .rpc('validate_invitation_code', { code });

      if (validationError) throw validationError;

      if (!isValid) {
        return { valid: false, error: 'Invalid invitation code format' };
      }

      // Check if code exists and get referrer info
      const { data: partner, error: partnerError } = await supabase
        .from('partner_profiles')
        .select('id, store_name, store_id, user_id')
        .eq('invitation_code', code)
        .eq('partner_status', 'approved')
        .single();

      if (partnerError || !partner) {
        return { valid: false, error: 'Invitation code not found or invalid' };
      }

      return {
        valid: true,
        referrer_id: partner.id,
        referrer_name: partner.store_name
      };
    } catch (error) {
      console.error('Error validating invitation code:', error);
      return { valid: false, error: 'Validation failed' };
    }
  }

  // Log invitation usage
  static async logInvitationUsage(
    invitationCode: string,
    applicantEmail: string,
    referrerId?: string,
    status: 'used' | 'invalid' | 'blocked' = 'used'
  ): Promise<void> {
    try {
      const metadata = {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      await supabase
        .from('invitation_logs')
        .insert({
          invitation_code: invitationCode,
          referrer_id: referrerId,
          applicant_email: applicantEmail,
          applicant_ip: null, // You might want to get this from a server endpoint
          user_agent: navigator.userAgent,
          status,
          metadata
        });
    } catch (error) {
      console.error('Error logging invitation usage:', error);
      // Don't throw error for logging
    }
  }

  // Create referral benefit
  static async createReferralBenefit(
    referrerId: string,
    referredId: string,
    benefitType: BenefitType,
    benefitValue: number,
    benefitDescription?: string,
    expiresDays: number = 365
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('create_referral_benefit', {
        referrer_id: referrerId,
        referred_id: referredId,
        benefit_type: benefitType,
        benefit_value: benefitValue,
        benefit_description: benefitDescription,
        expires_days: expiresDays
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating referral benefit:', error);
      throw error;
    }
  }

  // Get partner referral stats
  static async getPartnerReferralStats(partnerId: string): Promise<PartnerReferralStats> {
    try {
      // Get partner basic info
      const { data: partner, error: partnerError } = await supabase
        .from('partner_profiles')
        .select('invitation_code, referral_count, referral_earnings, referral_tier')
        .eq('id', partnerId)
        .single();

      if (partnerError) throw partnerError;

      // Get referred partners
      const { data: referredPartners, error: referredError } = await supabase
        .from('partner_profiles')
        .select('id, store_name, store_id, created_at, partner_status')
        .eq('referred_by', partnerId)
        .order('created_at', { ascending: false });

      if (referredError) throw referredError;

      // Get referral benefits
      const { data: benefits, error: benefitsError } = await supabase
        .from('referral_benefits')
        .select('*')
        .eq('referrer_id', partnerId)
        .order('created_at', { ascending: false });

      if (benefitsError) throw benefitsError;

      // Get tier benefits
      const { data: tierBenefits, error: tierError } = await supabase
        .rpc('calculate_referral_benefits', { partner_id: partnerId });

      if (tierError) throw tierError;

      return {
        invitation_code: partner.invitation_code,
        referral_count: partner.referral_count,
        referral_earnings: partner.referral_earnings,
        referral_tier: partner.referral_tier as ReferralTierLevel,
        referred_partners: referredPartners || [],
        benefits: benefits || [],
        tier_benefits: tierBenefits?.[0] || {
          tier_name: 'bronze' as ReferralTierLevel,
          commission_bonus_percent: 0,
          commission_reduction_percent: 0,
          monthly_credit: 0
        }
      };
    } catch (error) {
      console.error('Error getting partner referral stats:', error);
      throw error;
    }
  }

  // Get referral network tree
  static async getReferralNetwork(partnerId: string, maxDepth: number = 3): Promise<ReferralNetworkNode[]> {
    try {
      const buildNetwork = async (currentId: string, depth: number): Promise<ReferralNetworkNode[]> => {
        if (depth > maxDepth) return [];

        const { data: partners, error } = await supabase
          .from('partner_profiles')
          .select('id, store_name, store_id, invitation_code, referral_count, referral_tier')
          .eq('referred_by', currentId)
          .eq('partner_status', 'approved');

        if (error) throw error;

        const nodes: ReferralNetworkNode[] = [];
        
        for (const partner of partners || []) {
          const children = await buildNetwork(partner.id, depth + 1);
          
          nodes.push({
            id: partner.id,
            store_name: partner.store_name,
            store_id: partner.store_id,
            invitation_code: partner.invitation_code,
            referral_count: partner.referral_count,
            referral_tier: partner.referral_tier as ReferralTierLevel,
            level: depth,
            children
          });
        }

        return nodes;
      };

      return await buildNetwork(partnerId, 0);
    } catch (error) {
      console.error('Error getting referral network:', error);
      throw error;
    }
  }

  // Get admin referral statistics
  static async getAdminReferralStats(): Promise<AdminReferralStats> {
    try {
      // Get total partners and referrals
      const { data: partners, error: partnersError } = await supabase
        .from('partner_profiles')
        .select('id, store_name, referral_count, referral_earnings, referral_tier, partner_status, created_at, referred_by');

      if (partnersError) throw partnersError;

      const approvedPartners = partners?.filter(p => p.partner_status === 'approved') || [];
      const totalReferrals = approvedPartners.reduce((sum, p) => sum + p.referral_count, 0);

      // Get top referrers
      const topReferrers = approvedPartners
        .sort((a, b) => b.referral_count - a.referral_count)
        .slice(0, 10)
        .map(p => ({
          id: p.id,
          store_name: p.store_name || 'Unknown',
          referral_count: p.referral_count,
          referral_earnings: p.referral_earnings,
          referral_tier: p.referral_tier as ReferralTierLevel
        }));

      // Get tier distribution
      const tierDistribution: Record<ReferralTierLevel, number> = {
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum: 0
      };

      approvedPartners.forEach(p => {
        const tier = p.referral_tier as ReferralTierLevel;
        if (tier in tierDistribution) {
          tierDistribution[tier]++;
        }
      });

      // Get monthly referrals (last 6 months)
      const monthlyReferrals = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = month.toISOString();
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0).toISOString();
        
        const count = approvedPartners.filter(p => 
          p.created_at >= monthStart && p.created_at < monthEnd && p.referred_by
        ).length;
        
        monthlyReferrals.push({
          month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          count
        });
      }

      // Get benefits statistics
      const { data: benefits, error: benefitsError } = await supabase
        .from('referral_benefits')
        .select('status, benefit_value');

      if (benefitsError) throw benefitsError;

      const benefitsStats = {
        total: benefits?.length || 0,
        active: benefits?.filter(b => b.status === 'active').length || 0,
        expired: benefits?.filter(b => b.status === 'expired').length || 0,
        total_value: benefits?.reduce((sum, b) => sum + b.benefit_value, 0) || 0
      };

      return {
        total_partners: approvedPartners.length,
        total_referrals: totalReferrals,
        conversion_rate: approvedPartners.length > 0 ? (totalReferrals / approvedPartners.length) * 100 : 0,
        top_referrers,
        tier_distribution: tierDistribution,
        monthly_referrals,
        benefits_issued: benefitsStats
      };
    } catch (error) {
      console.error('Error getting admin referral stats:', error);
      throw error;
    }
  }

  // Get referral tiers
  static async getReferralTiers(): Promise<ReferralTier[]> {
    try {
      const { data, error } = await supabase
        .from('referral_tiers')
        .select('*')
        .order('min_referrals', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting referral tiers:', error);
      throw error;
    }
  }

  // Calculate referral benefits for a partner
  static async calculateReferralBenefits(partnerId: string, referredPartnerId: string): Promise<ReferralBenefitCalculation[]> {
    try {
      // Get referrer's current tier
      const { data: referrer, error: referrerError } = await supabase
        .from('partner_profiles')
        .select('referral_tier')
        .eq('id', partnerId)
        .single();

      if (referrerError) throw referrerError;

      // Get tier benefits
      const { data: tierBenefits, error: tierError } = await supabase
        .from('referral_tiers')
        .select('*')
        .eq('tier_name', referrer.referral_tier)
        .single();

      if (tierError) throw tierError;

      const benefits: ReferralBenefitCalculation[] = [];

      // Add commission bonus benefit
      if (tierBenefits.commission_bonus_percent > 0) {
        benefits.push({
          benefit_type: 'commission_bonus',
          benefit_value: tierBenefits.commission_bonus_percent,
          description: `${tierBenefits.commission_bonus_percent}% commission bonus on referred partner sales`,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      // Add rate reduction benefit
      if (tierBenefits.commission_reduction_percent > 0) {
        benefits.push({
          benefit_type: 'rate_reduction',
          benefit_value: tierBenefits.commission_reduction_percent,
          description: `${tierBenefits.commission_reduction_percent}% reduced commission rate`,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      // Add monthly credit benefit
      if (tierBenefits.monthly_credit > 0) {
        benefits.push({
          benefit_type: 'credit',
          benefit_value: tierBenefits.monthly_credit,
          description: `$${tierBenefits.monthly_credit} monthly credit`,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      return benefits;
    } catch (error) {
      console.error('Error calculating referral benefits:', error);
      throw error;
    }
  }

  // Update partner invitation code
  static async updatePartnerInvitationCode(partnerId: string): Promise<string> {
    try {
      const newCode = await this.generateInvitationCode();
      
      const { error } = await supabase
        .from('partner_profiles')
        .update({ invitation_code: newCode })
        .eq('id', partnerId);

      if (error) throw error;
      return newCode;
    } catch (error) {
      console.error('Error updating partner invitation code:', error);
      throw error;
    }
  }

  // Get invitation logs
  static async getInvitationLogs(partnerId: string, limit: number = 50): Promise<InvitationLog[]> {
    try {
      const { data, error } = await supabase
        .from('invitation_logs')
        .select('*')
        .eq('referrer_id', partnerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting invitation logs:', error);
      throw error;
    }
  }
}

export default ReferralService;
