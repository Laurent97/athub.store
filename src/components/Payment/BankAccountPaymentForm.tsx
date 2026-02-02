import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle, Clock, Building, Upload, AlertCircle, FileText } from 'lucide-react';
import { usePayment } from '@/contexts/PaymentContext';
import { useAuth } from '@/contexts/AuthContext';

interface BankDetails {
  recipient_name: string;
  recipient_address: string;
  bank_name: string;
  bank_address: string;
  swift_bic: string;
  iban?: string;
  routing_number?: string;
  sort_code?: string;
  ifsc?: string;
  account_number: string;
  account_type: string;
  currency: string;
}

interface BankAccountPaymentFormProps {
  orderId: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const BankAccountPaymentForm: React.FC<BankAccountPaymentFormProps> = ({
  orderId,
  amount,
  onSuccess,
  onError
}) => {
  const { user } = useAuth();
  const { recordPendingPayment, getBankDetails } = usePayment();
  const [step, setStep] = useState<'details' | 'proof' | 'submitted'>('details');
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofDescription, setProofDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBankDetails();
  }, []);

  const loadBankDetails = async () => {
    try {
      setLoading(true);
      const details = await getBankDetails();
      setBankDetails(details);
    } catch (err) {
      console.error('Error loading bank details:', err);
      setError('Failed to load bank details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyField = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPG, PNG, and PDF files are allowed');
        return;
      }
      setProofFile(file);
      setError(null);
    }
  };

  const handleSubmitProof = async () => {
    if (!proofFile) {
      setError('Please upload payment proof');
      return;
    }

    if (!proofDescription.trim()) {
      setError('Please provide payment details');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // In a real implementation, you would upload the file to a storage service
      // For now, we'll simulate this with a placeholder URL
      const proofUrl = `https://storage.example.com/payment-proofs/${Date.now()}_${proofFile.name}`;

      await recordPendingPayment({
        order_id: orderId,
        customer_id: user?.id || '',
        payment_method: 'bank',
        amount,
        currency: bankDetails?.currency || 'USD',
        // Store bank transfer details
        bank_recipient_name: bankDetails?.recipient_name,
        bank_name: bankDetails?.bank_name,
        bank_swift_bic: bankDetails?.swift_bic,
        bank_account_number: bankDetails?.account_number,
        // Store proof information
        bank_proof_url: proofUrl,
        bank_proof_description: proofDescription,
        bank_proof_filename: proofFile.name
      });

      setStep('submitted');
      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      console.error('Error submitting bank payment proof:', err);
      setError('Failed to submit payment proof. Please try again.');
      if (onError) {
        onError('Failed to submit payment proof. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBankDetails = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading bank details...</p>
        </div>
      );
    }

    if (!bankDetails) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Bank details are not available at the moment. Please contact support or try another payment method.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Bank Transfer Details
            </CardTitle>
            <CardDescription>
              Use these details to make an international wire transfer from your bank account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipient Information */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">Recipient Information</h4>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={bankDetails.recipient_name} 
                    readOnly 
                    className="font-mono bg-white dark:bg-gray-800"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyField(bankDetails.recipient_name)}
                    className="shrink-0"
                  >
                    {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Textarea 
                    value={bankDetails.recipient_address} 
                    readOnly 
                    className="font-mono bg-white dark:bg-gray-800 min-h-[60px]"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyField(bankDetails.recipient_address)}
                    className="shrink-0 mt-1"
                  >
                    {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Bank Information */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">Bank Information</h4>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bank Name</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={bankDetails.bank_name} 
                    readOnly 
                    className="font-mono bg-white dark:bg-gray-800"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyField(bankDetails.bank_name)}
                    className="shrink-0"
                  >
                    {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bank Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Textarea 
                    value={bankDetails.bank_address} 
                    readOnly 
                    className="font-mono bg-white dark:bg-gray-800 min-h-[60px]"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyField(bankDetails.bank_address)}
                    className="shrink-0 mt-1"
                  >
                    {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">SWIFT/BIC Code</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input 
                      value={bankDetails.swift_bic} 
                      readOnly 
                      className="font-mono bg-white dark:bg-gray-800"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopyField(bankDetails.swift_bic)}
                      className="shrink-0"
                    >
                      {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {bankDetails.iban && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">IBAN</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        value={bankDetails.iban} 
                        readOnly 
                        className="font-mono bg-white dark:bg-gray-800"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyField(bankDetails.iban)}
                        className="shrink-0"
                      >
                        {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {bankDetails.routing_number && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Routing Number</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        value={bankDetails.routing_number} 
                        readOnly 
                        className="font-mono bg-white dark:bg-gray-800"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyField(bankDetails.routing_number)}
                        className="shrink-0"
                      >
                        {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {bankDetails.sort_code && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort Code</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        value={bankDetails.sort_code} 
                        readOnly 
                        className="font-mono bg-white dark:bg-gray-800"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyField(bankDetails.sort_code)}
                        className="shrink-0"
                      >
                        {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {bankDetails.ifsc && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">IFSC Code</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        value={bankDetails.ifsc} 
                        readOnly 
                        className="font-mono bg-white dark:bg-gray-800"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyField(bankDetails.ifsc)}
                        className="shrink-0"
                      >
                        {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Number</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={bankDetails.account_number} 
                    readOnly 
                    className="font-mono bg-white dark:bg-gray-800"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyField(bankDetails.account_number)}
                    className="shrink-0"
                  >
                    {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Transfer Details */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">Transfer Details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount</Label>
                  <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    ${amount.toFixed(2)} {bankDetails.currency}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Type</Label>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1 capitalize">
                    {bankDetails.account_type}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Purpose of Payment</Label>
                <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                  Order #{orderId} - Payment for goods/services
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Important Information</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• International transfers typically take 1-5 business days</li>
            <li>• Your bank may charge transfer fees and exchange rate margins</li>
            <li>• Include your Order ID ({orderId}) in the payment reference</li>
            <li>• Keep the payment receipt for proof of transfer</li>
          </ul>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={() => setStep('proof')}
            className="w-full md:w-auto"
            size="lg"
          >
            <FileText className="w-4 h-4 mr-2" />
            I've Made the Payment - Upload Proof
          </Button>
        </div>
      </div>
    );
  };

  const renderProofUpload = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          <Upload className="w-5 h-5 inline mr-2" />
          Upload Payment Proof
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please upload proof of your bank transfer and provide payment details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>
            Order #{orderId} - Amount: ${amount.toFixed(2)} {bankDetails?.currency || 'USD'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="proof-file">Payment Proof Document</Label>
            <Input
              id="proof-file"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Accepted formats: JPG, PNG, PDF (Max size: 5MB)
            </p>
          </div>

          <div>
            <Label htmlFor="proof-description">Payment Details</Label>
            <Textarea
              id="proof-description"
              placeholder="Please provide details about your payment (transaction ID, date sent, amount in local currency, bank name, etc.)"
              value={proofDescription}
              onChange={(e) => setProofDescription(e.target.value)}
              className="mt-1"
              rows={4}
            />
          </div>

          {proofFile && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">
                  <strong>File selected:</strong> {proofFile.name} ({(proofFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => setStep('details')}
          className="flex-1"
        >
          Back to Bank Details
        </Button>
        <Button
          onClick={handleSubmitProof}
          disabled={isSubmitting || !proofFile || !proofDescription.trim()}
          className="flex-1"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Submitting...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Submit for Approval
            </div>
          )}
        </Button>
      </div>
    </div>
  );

  const renderSubmitted = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
        <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Payment Submitted for Approval
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Your bank transfer payment has been submitted and is pending admin verification.
        You will be notified once the payment has been reviewed and approved.
      </p>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <Building className="w-4 h-4" />
          <span className="text-sm">
            <strong>Order ID:</strong> {orderId}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bank-account-payment-form space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {step === 'details' && renderBankDetails()}
      {step === 'proof' && renderProofUpload()}
      {step === 'submitted' && renderSubmitted()}
    </div>
  );
};

export default BankAccountPaymentForm;
