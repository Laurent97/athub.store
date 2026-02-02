import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Building, Save, Edit, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface BankDetails {
  id?: string;
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
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const AdminBankDetails: React.FC = () => {
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bank_details')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching bank details:', error);
        setError('Failed to fetch bank details');
        return;
      }

      if (data) {
        setBankDetails(data);
      } else {
        // Set default values for new bank details
        setBankDetails({
          recipient_name: '',
          recipient_address: '',
          bank_name: '',
          bank_address: '',
          swift_bic: '',
          iban: '',
          routing_number: '',
          sort_code: '',
          ifsc: '',
          account_number: '',
          account_type: 'checking',
          currency: 'USD',
          is_active: true
        });
      }
    } catch (error) {
      console.error('Error in fetchBankDetails:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!bankDetails) return;

    // Validation
    if (!bankDetails.recipient_name.trim()) {
      setError('Recipient name is required');
      return;
    }
    if (!bankDetails.recipient_address.trim()) {
      setError('Recipient address is required');
      return;
    }
    if (!bankDetails.bank_name.trim()) {
      setError('Bank name is required');
      return;
    }
    if (!bankDetails.bank_address.trim()) {
      setError('Bank address is required');
      return;
    }
    if (!bankDetails.swift_bic.trim()) {
      setError('SWIFT/BIC code is required');
      return;
    }
    if (!bankDetails.account_number.trim()) {
      setError('Account number is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error } = await supabase
        .from('bank_details')
        .upsert({
          ...bankDetails,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving bank details:', error);
        setError('Failed to save bank details');
        return;
      }

      setBankDetails(data);
      setSuccess('Bank details saved successfully');
      setEditing(false);
    } catch (error) {
      console.error('Error in handleSave:', error);
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof BankDetails, value: string | boolean) => {
    if (!bankDetails) return;
    setBankDetails({
      ...bankDetails,
      [field]: value
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2">Loading bank details...</span>
      </div>
    );
  }

  if (!bankDetails) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Failed to load bank details. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bank Transfer Details Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configure bank details for international wire transfers
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={bankDetails.is_active ? 'default' : 'secondary'}>
            {bankDetails.is_active ? 'Active' : 'Inactive'}
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
            <Building className="h-5 w-5" />
            Recipient Information
          </CardTitle>
          <CardDescription>
            Details of the person or business receiving the funds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recipient_name">Full Name *</Label>
              <Input
                id="recipient_name"
                value={bankDetails.recipient_name}
                onChange={(e) => handleInputChange('recipient_name', e.target.value)}
                disabled={!editing}
                placeholder="John Smith or Company Name Ltd"
              />
            </div>
            <div>
              <Label htmlFor="account_type">Account Type</Label>
              <select
                id="account_type"
                value={bankDetails.account_type}
                onChange={(e) => handleInputChange('account_type', e.target.value)}
                disabled={!editing}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="business">Business</option>
                <option value="current">Current</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="recipient_address">Complete Address *</Label>
            <Textarea
              id="recipient_address"
              value={bankDetails.recipient_address}
              onChange={(e) => handleInputChange('recipient_address', e.target.value)}
              disabled={!editing}
              placeholder="123 Business Street, City, State, Country, Postal Code"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank Information</CardTitle>
          <CardDescription>
            Details of the receiving bank
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank_name">Bank Name *</Label>
              <Input
                id="bank_name"
                value={bankDetails.bank_name}
                onChange={(e) => handleInputChange('bank_name', e.target.value)}
                disabled={!editing}
                placeholder="International Business Bank"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                value={bankDetails.currency}
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
          </div>

          <div>
            <Label htmlFor="bank_address">Bank Address *</Label>
            <Textarea
              id="bank_address"
              value={bankDetails.bank_address}
              onChange={(e) => handleInputChange('bank_address', e.target.value)}
              disabled={!editing}
              placeholder="456 Banking Avenue, City, Country"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank Identifier Codes</CardTitle>
          <CardDescription>
            Required codes for international transfers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="swift_bic">SWIFT/BIC Code *</Label>
              <Input
                id="swift_bic"
                value={bankDetails.swift_bic}
                onChange={(e) => handleInputChange('swift_bic', e.target.value)}
                disabled={!editing}
                placeholder="IBBKUS33XXX"
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="account_number">Account Number *</Label>
              <Input
                id="account_number"
                value={bankDetails.account_number}
                onChange={(e) => handleInputChange('account_number', e.target.value)}
                disabled={!editing}
                placeholder="1234567890"
                className="font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="iban">IBAN (Europe)</Label>
              <Input
                id="iban"
                value={bankDetails.iban || ''}
                onChange={(e) => handleInputChange('iban', e.target.value)}
                disabled={!editing}
                placeholder="DE89 3704 0044 0532 0130 00"
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="routing_number">Routing Number (USA)</Label>
              <Input
                id="routing_number"
                value={bankDetails.routing_number || ''}
                onChange={(e) => handleInputChange('routing_number', e.target.value)}
                disabled={!editing}
                placeholder="021000021"
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="sort_code">Sort Code (UK)</Label>
              <Input
                id="sort_code"
                value={bankDetails.sort_code || ''}
                onChange={(e) => handleInputChange('sort_code', e.target.value)}
                disabled={!editing}
                placeholder="00-00-00"
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="ifsc">IFSC Code (India)</Label>
              <Input
                id="ifsc"
                value={bankDetails.ifsc || ''}
                onChange={(e) => handleInputChange('ifsc', e.target.value)}
                disabled={!editing}
                placeholder="SBIN0000001"
                className="font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>
            Control whether these bank details are visible to customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={bankDetails.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              disabled={!editing}
            />
            <Label htmlFor="is_active">Active - Show to customers</Label>
          </div>
        </CardContent>
      </Card>

      {editing && (
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setEditing(false);
              fetchBankDetails(); // Reset to original values
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

export default AdminBankDetails;
