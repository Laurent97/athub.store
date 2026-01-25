// Referral system type definitions

export type ReferralTierLevel = 'bronze' | 'silver' | 'gold' | 'platinum';
export type BenefitType = 'commission_bonus' | 'rate_reduction' | 'credit' | 'extended_trial';
export type BenefitStatus = 'pending' | 'active' | 'expired' | 'revoked';
export type InvitationLogStatus = 'used' | 'expired' | 'invalid' | 'blocked';

export interface ReferralBenefit {
  id: string;
  referrer_id: string;
  referred_id: string;
  benefit_type: BenefitType;
  benefit_value: number;
  benefit_description?: string;
  status: BenefitStatus;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface InvitationLog {
  id: string;
  invitation_code: string;
  referrer_id?: string;
  applicant_email?: string;
  applicant_ip?: string;
  user_agent?: string;
  status: InvitationLogStatus;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface ReferralTier {
  id: string;
  tier_name: ReferralTierLevel;
  min_referrals: number;
  commission_bonus_percent: number;
  commission_reduction_percent: number;
  monthly_credit: number;
  benefits: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PartnerReferralStats {
  invitation_code?: string;
  referral_count: number;
  referral_earnings: number;
  referral_tier: ReferralTierLevel;
  referred_partners: Array<{
    id: string;
    store_name: string;
    store_id?: string;
    created_at: string;
    partner_status: string;
  }>;
  benefits: ReferralBenefit[];
  tier_benefits: {
    tier_name: ReferralTierLevel;
    commission_bonus_percent: number;
    commission_reduction_percent: number;
    monthly_credit: number;
  };
}

export interface ReferralNetworkNode {
  id: string;
  store_name: string;
  store_id?: string;
  invitation_code?: string;
  referral_count: number;
  referral_tier: ReferralTierLevel;
  level: number;
  children: ReferralNetworkNode[];
}

export interface AdminReferralStats {
  total_partners: number;
  total_referrals: number;
  conversion_rate: number;
  top_referrers: Array<{
    id: string;
    store_name: string;
    referral_count: number;
    referral_earnings: number;
    referral_tier: ReferralTierLevel;
  }>;
  tier_distribution: Record<ReferralTierLevel, number>;
  monthly_referrals: Array<{
    month: string;
    count: number;
  }>;
  benefits_issued: {
    total: number;
    active: number;
    expired: number;
    total_value: number;
  };
}

export interface InvitationValidation {
  valid: boolean;
  referrer_id?: string;
  referrer_name?: string;
  error?: string;
}

export interface ReferralBenefitCalculation {
  benefit_type: BenefitType;
  benefit_value: number;
  description: string;
  expires_at?: string;
}
