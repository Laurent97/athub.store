import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cryptoService } from '@/lib/supabase/crypto-service';
import { depositService } from '@/lib/supabase/deposit-service';
import { 
  CreditCard, 
  Mail, 
  Bitcoin, 
  Wallet, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Banknote,
  Shield,
  Zap,
  Clock,
  Copy,
  ExternalLink
} from 'lucide-react';

interface DepositFormData {
  amount: number;
  paymentMethod: 'stripe' | 'paypal' | 'crypto' | 'bank';
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
  email?: string;
  cryptoType?: string;
  cryptoAddress?: string;
  cryptoTransactionId?: string;
  xrpTag?: string;
  bankAccount?: string;
  bankName?: string;
  routingNumber?: string;
}

export default function DepositFormEnhanced() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [cryptoAddresses, setCryptoAddresses] = useState<any[]>([]);
  const [loadingCrypto, setLoadingCrypto] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<string[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [formData, setFormData] = useState<DepositFormData>({
    amount: 0,
    paymentMethod: 'stripe'
  });

  // Enhanced payment methods matching checkout system
  const paymentMethods = [
    {
      id: 'stripe',
      name: 'Credit/Debit Card',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Visa, Mastercard, Amex, and more',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      available: true
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: <Mail className="w-5 h-5" />,
      description: 'Pay with your PayPal account',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
      available: true
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      icon: <Bitcoin className="w-5 h-5" />,
      description: 'BTC, ETH, USDT, XRP and more',
      color: 'text-orange-500',
      bgColor: 'bg-orange-100',
      available: true
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: <Banknote className="w-5 h-5" />,
      description: 'International wire transfer',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      available: true
    }
  ].filter(method => availablePaymentMethods.includes(method.id));

  // Load crypto addresses and available payment methods from database
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('=== ENHANCED DEPOSIT FORM: Loading payment methods...');
        
        // Load available payment methods
        setLoadingPaymentMethods(true);
        const methodsResult = await depositService.isPaymentMethodAvailable('stripe', 'partner');
        
        // For now, use all available methods as fallback
        setAvailablePaymentMethods(['stripe', 'paypal', 'crypto', 'bank']);
        
        // Load crypto addresses
        console.log('=== ENHANCED DEPOSIT FORM: Loading crypto addresses...');
        setLoadingCrypto(true);
        const cryptoResult = await cryptoService.getActiveCryptoAddresses();
        
        if (cryptoResult.error) {
          console.error('Error loading crypto addresses:', cryptoResult.error);
        } else {
          setCryptoAddresses(cryptoResult.data || []);
        }
        
      } catch (error) {
        console.error('Error loading deposit form data:', error);
        // Fallback to all methods
        setAvailablePaymentMethods(['stripe', 'paypal', 'crypto', 'bank']);
      } finally {
        setLoadingPaymentMethods(false);
        setLoadingCrypto(false);
      }
    };

    loadData();
  }, []);

  const handlePaymentMethodSelect = (method: string) => {
    setFormData({ ...formData, paymentMethod: method as DepositFormData['paymentMethod'] });
    setStep(3);
  };

  const handleAmountSubmit = () => {
    if (formData.amount < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit amount is $10.00",
        variant: "destructive"
      });
      return;
    }
    setStep(2);
  };

  const handlePaymentSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to make a deposit.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('Submitting enhanced deposit request:', {
        user_id: user.id,
        amount: formData.amount,
        payment_method: formData.paymentMethod,
        payment_details: formData
      });

      // Create enhanced deposit request object
      const depositRequest = {
        user_id: user.id,
        amount: formData.amount,
        payment_method: formData.paymentMethod as any,
        payment_details: {
          cardNumber: formData.cardNumber,
          cardExpiry: formData.cardExpiry,
          cardCvc: formData.cardCvc,
          email: formData.email,
          cryptoType: formData.cryptoType,
          cryptoAddress: formData.cryptoType ? 
            cryptoAddresses.find(c => c.crypto_type === formData.cryptoType)?.address : undefined,
          xrpTag: formData.cryptoType === 'XRP' ? 
            cryptoAddresses.find(c => c.crypto_type === formData.cryptoType)?.xrp_tag : undefined,
          cryptoTransactionId: formData.cryptoTransactionId,
          bankName: formData.bankName,
          bankAccount: formData.bankAccount,
          routingNumber: formData.routingNumber
        },
        status: 'pending' as const,
        description: `Enhanced deposit request via ${formData.paymentMethod}`,
        enhanced: true // Mark as enhanced deposit
      };

      let result;
      
      // Process payment using same logic as checkout
      switch (formData.paymentMethod) {
        case 'stripe':
          result = await depositService.processStripePayment(depositRequest);
          break;
        case 'paypal':
          result = await depositService.processPayPalPayment(depositRequest);
          break;
        case 'crypto':
          result = await depositService.processCryptoPayment(depositRequest);
          break;
        case 'bank':
          result = await depositService.processBankTransferPayment(depositRequest);
          break;
        default:
          throw new Error('Unsupported payment method');
      }

      if (result.error) {
        throw result.error;
      }

      console.log('Enhanced deposit request submitted successfully:', result.data);
      
      // Show enhanced success message
      toast({
        title: "Deposit Request Submitted!",
        description: `$${formData.amount.toFixed(2)} deposit request has been submitted for verification.`,
      });
      
      // Navigate back to wallet with enhanced state
      navigate('/partner/dashboard/wallet', {
        state: {
          success: true,
          message: `Enhanced deposit request of $${formData.amount.toFixed(2)} has been submitted for verification. You will be notified once it's processed.`,
          amount: formData.amount,
          pendingApproval: true,
          transactionId: result.data?.transaction?.id,
          enhanced: true
        }
      });
      
    } catch (error: any) {
      console.error('Error submitting enhanced deposit request:', error);
      toast({
        title: "Deposit Request Failed",
        description: error?.message || "There was an error submitting your deposit request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Render payment form based on selected method (same as checkout)
  const renderPaymentForm = () => {
    switch (formData.paymentMethod) {
      case 'stripe':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Card Number</label>
              <Input
                placeholder="1234 5678 9012 3456"
                value={formData.cardNumber || ''}
                onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                maxLength={19}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Expiry Date</label>
                <Input
                  placeholder="MM/YY"
                  value={formData.cardExpiry || ''}
                  onChange={(e) => setFormData({...formData, cardExpiry: e.target.value})}
                  maxLength={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CVC</label>
                <Input
                  placeholder="123"
                  value={formData.cardCvc || ''}
                  onChange={(e) => setFormData({...formData, cardCvc: e.target.value})}
                  maxLength={4}
                />
              </div>
            </div>
          </div>
        );
      
      case 'paypal':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">PayPal Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">PayPal Payment</span>
              </div>
              <p className="text-sm text-blue-700">
                You will be redirected to PayPal to complete your deposit securely.
              </p>
            </div>
          </div>
        );
      
      case 'crypto':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Cryptocurrency Type</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={formData.cryptoType || ''}
                onChange={(e) => setFormData({...formData, cryptoType: e.target.value})}
                aria-label="Select cryptocurrency type"
                title="Select cryptocurrency type"
              >
                <option value="">Select cryptocurrency</option>
                {cryptoAddresses.map((crypto) => (
                  <option key={crypto.crypto_type} value={crypto.crypto_type}>
                    {crypto.crypto_type}
                  </option>
                ))}
              </select>
            </div>
            
            {formData.cryptoType && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bitcoin className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-900">Crypto Payment</span>
                </div>
                <p className="text-sm text-orange-700 mb-2">
                  Send ${formData.amount.toFixed(2)} worth of {formData.cryptoType} to:
                </p>
                <div className="bg-white p-3 rounded border border-orange-300 font-mono text-sm">
                  {cryptoAddresses.find(c => c.crypto_type === formData.cryptoType)?.address}
                </div>
                {formData.cryptoType === 'XRP' && (
                  <p className="text-sm text-orange-700 mt-2">
                    Tag: {cryptoAddresses.find(c => c.crypto_type === formData.cryptoType)?.xrp_tag}
                  </p>
                )}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">Transaction ID</label>
              <Input
                placeholder="Enter transaction hash"
                value={formData.cryptoTransactionId || ''}
                onChange={(e) => setFormData({...formData, cryptoTransactionId: e.target.value})}
              />
            </div>
          </div>
        );
      
      case 'bank':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Bank Name</label>
              <Input
                placeholder="Bank of America"
                value={formData.bankName || ''}
                onChange={(e) => setFormData({...formData, bankName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Account Number</label>
              <Input
                placeholder="123456789"
                value={formData.bankAccount || ''}
                onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Routing Number</label>
              <Input
                placeholder="123456789"
                value={formData.routingNumber || ''}
                onChange={(e) => setFormData({...formData, routingNumber: e.target.value})}
              />
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Banknote className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Bank Transfer</span>
              </div>
              <p className="text-sm text-green-700">
                Bank transfers typically take 1-3 business days to process. You will be notified once the deposit is confirmed.
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Step 1: Amount Entry */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Deposit Amount
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Amount (USD)</label>
              <Input
                type="number"
                placeholder="0.00"
                min="10"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
              />
              <p className="text-sm text-gray-500 mt-1">Minimum deposit: $10.00</p>
            </div>
            
            <Button 
              onClick={handleAmountSubmit}
              disabled={formData.amount < 10 || loading}
              className="w-full"
            >
              Continue to Payment Method
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Payment Method Selection */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => handlePaymentMethodSelect(method.id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-primary ${
                    formData.paymentMethod === method.id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${method.bgColor}`}>
                      {method.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{method.name}</h3>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Payment Form */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {paymentMethods.find(m => m.id === formData.paymentMethod)?.icon}
              {paymentMethods.find(m => m.id === formData.paymentMethod)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderPaymentForm()}
            
            <div className="flex gap-4 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setStep(2)}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handlePaymentSubmit}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Processing...' : `Deposit $${formData.amount.toFixed(2)}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
