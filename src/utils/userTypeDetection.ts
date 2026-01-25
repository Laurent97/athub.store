import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/lib/types/database';

/**
 * Enhanced user type detection utility
 * Provides automatic detection and logging of user types for payment system
 */

export const useUserTypeDetection = () => {
  const { user, userProfile } = useAuth();

  /**
   * Get the current user's type with enhanced logging
   */
  const getUserType = (): UserType => {
    if (!user) {
      console.log('🔍 UserTypeDetection: No user logged in');
      return 'customer'; // Default fallback
    }

    if (!userProfile) {
      console.log('🔍 UserTypeDetection: User logged in but no profile data, defaulting to customer', {
        userId: user.id,
        email: user.email
      });
      return 'customer'; // Default fallback
    }

    const userType = userProfile.user_type;
    console.log('🔍 UserTypeDetection: User type detected', {
      userId: user.id,
      email: user.email,
      userType: userType,
      userProfile: {
        id: userProfile.id,
        user_type: userProfile.user_type,
        full_name: userProfile.full_name,
        partner_status: userProfile.partner_status
      }
    });

    return userType || 'customer';
  };

  /**
   * Check if the current user is a customer
   */
  const isCustomer = (): boolean => {
    return getUserType() === 'customer';
  };

  /**
   * Check if the current user is a partner
   */
  const isPartner = (): boolean => {
    return getUserType() === 'partner';
  };

  /**
   * Check if the current user is an admin
   */
  const isAdmin = (): boolean => {
    return getUserType() === 'admin';
  };

  /**
   * Get user type display information
   */
  const getUserTypeInfo = () => {
    const userType = getUserType();
    
    const typeInfo = {
      type: userType,
      label: userType.charAt(0).toUpperCase() + userType.slice(1),
      description: '',
      color: '',
      icon: ''
    };

    switch (userType) {
      case 'customer':
        typeInfo.description = 'Regular customer with access to PayPal, Crypto, and Stripe (auto-rejected)';
        typeInfo.color = 'text-blue-600';
        typeInfo.icon = '👤';
        break;
      case 'partner':
        typeInfo.description = 'Partner with access to all payment methods including immediate wallet processing';
        typeInfo.color = 'text-green-600';
        typeInfo.icon = '🤝';
        break;
      case 'admin':
        typeInfo.description = 'Administrator with full access to all payment methods and admin tools';
        typeInfo.color = 'text-purple-600';
        typeInfo.icon = '👑';
        break;
      default:
        typeInfo.description = 'Unknown user type';
        typeInfo.color = 'text-gray-600';
        typeInfo.icon = '❓';
        break;
    }

    return typeInfo;
  };

  /**
   * Log payment method access for debugging
   */
  const logPaymentMethodAccess = (method: string, canAccess: boolean, reason?: string) => {
    const userType = getUserType();
    
    console.log('🔍 UserTypeDetection: Payment method access check', {
      userType,
      userEmail: user?.email,
      method,
      canAccess,
      reason: reason || 'Based on user role configuration',
      timestamp: new Date().toISOString()
    });
  };

  return {
    getUserType,
    isCustomer,
    isPartner,
    isAdmin,
    getUserTypeInfo,
    logPaymentMethodAccess
  };
};

/**
 * Utility function to check if a user type can access a payment method
 */
export const canUserAccessPaymentMethod = (
  userType: UserType,
  method: string,
  paymentConfigs: Record<string, any>
): boolean => {
  if (!paymentConfigs[method] || !paymentConfigs[method].enabled) {
    return false;
  }

  switch (userType) {
    case 'customer':
      return paymentConfigs[method].customer_access;
    case 'partner':
      return paymentConfigs[method].partner_access;
    case 'admin':
      return paymentConfigs[method].admin_access;
    default:
      return false;
  }
};

/**
 * Get payment method restrictions for a user type
 */
export const getPaymentMethodRestrictions = (userType: UserType) => {
  const restrictions = {
    customer: {
      canUseWallet: false,
      stripeAutoReject: true,
      adminConfirmationRequired: ['paypal', 'crypto'],
      immediatePayment: []
    },
    partner: {
      canUseWallet: true,
      stripeAutoReject: false,
      adminConfirmationRequired: ['paypal', 'crypto', 'stripe'],
      immediatePayment: ['wallet']
    },
    admin: {
      canUseWallet: true,
      stripeAutoReject: false,
      adminConfirmationRequired: ['paypal', 'crypto', 'stripe'],
      immediatePayment: ['wallet']
    }
  };

  return restrictions[userType] || restrictions.customer;
};
