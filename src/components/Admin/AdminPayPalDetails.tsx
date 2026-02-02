import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Mail, Save, Edit, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface PayPalDetails {
  id?: string;
  paypal_email: string;
  business_name: string;
  business_description: string;
  currency: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const AdminPayPalDetails: React.FC = () => {
  const [paypalDetails, setPayPalDetails] = useState<PayPalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchPayPalDetails();
  }, []);

  const fetchPayPalDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('paypal_details')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching PayPal details:', error);
        setError('Failed to fetch PayPal details');
        return;
      }

      if (data) {
        setPayPalDetails(data);
      } else {
        // Set default values for new PayPal details
        setPayPalDetails({
          paypal_email: '',
          business_name: '',
          business_description: '',
          currency: 'USD',
          is_active: true
        });
      }
    } catch (error) {
      console.error('Error in fetchPayPalDetails:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!paypalDetails) return;

    // Validation
    if (!paypalDetails.paypal_email.trim()) {
      setError('PayPal email is required');
      return;
    }
    if (!paypalDetails.business_name.trim()) {
      setError('Business name is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(paypalDetails.paypal_email)) {
      setError('Please enter a valid PayPal email address');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error } = await supabase
        .from('paypal_details')
        .upsert({
          ...paypalDetails,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving PayPal details:', error);
        setError('Failed to save PayPal details');
        return;
      }

      setPayPalDetails(data);
      setSuccess('PayPal details saved successfully');
      setEditing(false);
    } catch (error) {
      console.error('Error in handleSave:', error);
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof PayPalDetails, value: string | boolean) => {
    if (!paypalDetails) return;
    setPayPalDetails({
      ...paypalDetails,
      [field]: value
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2">Loading PayPal details...</span>
      </div>
    );
  }

  if (!paypalDetails) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Failed to load PayPal details. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            PayPal Payment Configuration
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configure PayPal email details for customer payments
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={paypalDetails.is_active ? 'default' : 'secondary'}>
            {paypalDetails.is_active ? 'Active' : 'Inactive'}
          </Badge>
          {!editing && (
            <Button
              onClick={() => setEditing(true)}
              variant="outline"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            PayPal Configuration
          </CardTitle>
          <CardDescription>
            Set up the PayPal email address where customers will send payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paypal_email">PayPal Email Address *</Label>
              <Input
                id="paypal_email"
                type="email"
                value={paypalDetails.paypal_email}
                onChange={(e) => handleInputChange('paypal_email', e.target.value)}
                disabled={!editing}
                placeholder="payments@yourbusiness.com"
                className="font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                This is the PayPal email address customers will send money to
              </p>
            </div>
            <div>
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                value={paypalDetails.business_name}
                onChange={(e) => handleInputChange('business_name', e.target.value)}
                disabled={!editing}
                placeholder="Your Business Name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              value={paypalDetails.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              disabled={!editing}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="JPY">JPY - Japanese Yen</option>
              <option value="CNY">CNY - Chinese Yuan</option>
              <option value="INR">INR - Indian Rupee</option>
            </select>
          </div>

          <div>
            <Label htmlFor="business_description">Business Description</Label>
            <Textarea
              id="business_description"
              value={paypalDetails.business_description}
              onChange={(e) => handleInputChange('business_description', e.target.value)}
              disabled={!editing}
              placeholder="Brief description of your business for PayPal transactions"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={paypalDetails.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              disabled={!editing}
            />
            <Label htmlFor="is_active">Active - Show to customers</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Instructions</CardTitle>
          <CardDescription>
            Information that will be shown to customers when they select PayPal payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              How customers will pay:
            </h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>Customer selects PayPal payment method</li>
              <li>They are redirected to PayPal with your email: <strong>{paypalDetails.paypal_email || 'Not configured'}</strong></li>
              <li>Customer logs into their PayPal account and sends payment</li>
              <li>Payment is recorded and sent for admin verification</li>
              <li>You approve the payment in the admin dashboard</li>
            </ol>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              Important Notes:
            </h4>
            <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
              <li>Make sure your PayPal account can receive payments</li>
              <li>Verify the email address is correct and active</li>
              <li>Test the payment flow before going live</li>
              <li>Keep your PayPal account secure with 2FA</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {editing && (
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setEditing(false);
              fetchPayPalDetails(); // Reset to original values
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </div>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminPayPalDetails;
