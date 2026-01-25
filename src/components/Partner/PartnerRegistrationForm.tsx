import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Mail, Phone, MapPin, Gift, CheckCircle, AlertCircle, FileText, Globe, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import StoreIdBadge from '@/components/ui/StoreIdBadge';

interface FormData {
  // Store Information
  storeName: string;
  storeDescription: string;
  
  // Contact Information
  contactEmail: string;
  contactPhone: string;
  website: string;
  
  // Address (for tax purposes)
  country: string;
  city: string;
  
  // Invitation System
  invitationCode: string;
  
  // Terms
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

const PartnerRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    storeName: '',
    storeDescription: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    country: '',
    city: '',
    invitationCode: '',
    agreeToTerms: false,
    agreeToPrivacy: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [generatedStoreId, setGeneratedStoreId] = useState('');
  
  // Invitation validation
  const [invitationValidation, setInvitationValidation] = useState<{
    valid: boolean;
    referrerName?: string;
    referrerId?: string;
    error?: string;
  } | null>(null);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Validate invitation code in real-time
  useEffect(() => {
    const validateCode = async () => {
      if (!formData.invitationCode.trim()) {
        setInvitationValidation(null);
        return;
      }

      try {
        // Check if code exists in partner_profiles (store_id or invitation_code)
        const { data, error } = await supabase
          .from('partner_profiles')
          .select('store_id, store_name, user_id')
          .or(`store_id.eq.${formData.invitationCode},invitation_code.eq.${formData.invitationCode}`)
          .eq('is_approved', true)
          .single();

        if (error || !data) {
          setInvitationValidation({
            valid: false,
            error: 'Invalid or expired invitation code'
          });
          return;
        }

        setInvitationValidation({
          valid: true,
          referrerName: data.store_name,
          referrerId: data.user_id
        });
      } catch (err) {
        setInvitationValidation({
          valid: false,
          error: 'Error validating code'
        });
      }
    };

    const timeoutId = setTimeout(() => {
      validateCode();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.invitationCode]);

  // Validate form before submission
  const validateForm = (): boolean => {
    const errors = [];
    
    if (!formData.storeName.trim()) {
      errors.push('Store name is required');
    }
    
    if (!formData.contactEmail.trim()) {
      errors.push('Contact email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      errors.push('Valid email is required');
    }
    
    if (!formData.invitationCode.trim()) {
      errors.push('Invitation code is required');
    } else if (!invitationValidation?.valid) {
      errors.push('Valid invitation code is required');
    }
    
    if (!formData.agreeToTerms || !formData.agreeToPrivacy) {
      errors.push('You must accept the terms and privacy policy');
    }
    
    if (errors.length > 0) {
      setError(errors.join('. '));
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to apply for a partner account');
      }

      // Check if user is already a partner
      const { data: existingPartner } = await supabase
        .from('partner_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingPartner) {
        throw new Error('You already have a partner account');
      }

      // Create partner profile - SIMPLIFIED!
      const { data, error } = await supabase
        .from('partner_profiles')
        .insert({
          user_id: user.id,
          store_name: formData.storeName,
          store_description: formData.storeDescription,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone,
          website: formData.website,
          country: formData.country,
          city: formData.city,
          status: 'pending',
          is_approved: false,
          referred_by: invitationValidation?.referrerId || null,
          invitation_code_used: formData.invitationCode
        })
        .select()
        .single();

      if (error) throw error;

      // Update user role to partner
      await supabase
        .from('users')
        .update({ 
          user_type: 'partner',
          partner_status: 'pending'
        })
        .eq('id', user.id);

      // Get the generated store ID
      const { data: partnerWithStoreId } = await supabase
        .from('partner_profiles')
        .select('store_id')
        .eq('id', data.id)
        .single();

      setGeneratedStoreId(partnerWithStoreId?.store_id || '');
      setSuccess(true);

    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Application Submitted!
          </h2>
          <p className="text-gray-600 mb-6">
            Your partner application has been received. We'll review it and get back to you within 48 hours.
          </p>
          
          {generatedStoreId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 mb-2">Your Store ID:</p>
              <StoreIdBadge storeId={generatedStoreId} size="md" />
              <p className="text-xs text-blue-600 mt-2">
                This will be your unique identifier on AutoVault
              </p>
            </div>
          )}
          
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <Store className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold mb-2">
                Become an AutoVault Partner
              </h1>
              <p className="text-blue-100">
                Join our platform to sell automotive products from our catalog
              </p>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Store Information - SIMPLIFIED */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                Your Store Information
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Name *
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleChange}
                    required
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., AutoZone Pro"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This name will appear in our Partner Shops section
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    name="storeDescription"
                    value={formData.storeDescription}
                    onChange={handleChange}
                    rows={3}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Briefly describe your store..."
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                Contact Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      required
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website (Optional)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>

            {/* Location - SIMPLIFIED */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                Location Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., United States"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., New York"
                  />
                </div>
              </div>
            </div>

            {/* Invitation Code - CRITICAL */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-purple-600" />
                  Invitation Code *
                </div>
              </h2>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-4">
                  <Info className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-purple-800 font-medium">
                      You need an invitation from an existing partner
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      Ask an approved AutoVault partner for their invitation code
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Invitation Code *
                  </label>
                  <div className="relative">
                    <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="invitationCode"
                      value={formData.invitationCode}
                      onChange={handleChange}
                      required
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="e.g., AUTO1234567"
                      maxLength={20}
                    />
                  </div>
                  
                  {invitationValidation && (
                    <div className={`mt-2 flex items-center gap-2 p-2 rounded text-sm ${
                      invitationValidation.valid 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {invitationValidation.valid ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>
                            Valid code! Invited by: {invitationValidation.referrerName}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          <span>{invitationValidation.error || 'Invalid code'}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Terms - SIMPLIFIED */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                Terms & Agreements
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    required
                    className="mt-1 mr-3"
                  />
                  <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                    I agree to the AutoVault Partner Agreement and Terms of Service
                  </label>
                </div>
                
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="agreeToPrivacy"
                    name="agreeToPrivacy"
                    checked={formData.agreeToPrivacy}
                    onChange={handleChange}
                    required
                    className="mt-1 mr-3"
                  />
                  <label htmlFor="agreeToPrivacy" className="text-sm text-gray-700">
                    I agree to the Privacy Policy and understand how my data will be used
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Section */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                
                <div className="text-center sm:text-right">
                  <p className="text-sm text-gray-600 mb-2">
                    By clicking submit, you agree to become an AutoVault Partner
                  </p>
                  <button
                    type="submit"
                    disabled={loading || !formData.agreeToTerms || !formData.agreeToPrivacy}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PartnerRegistrationForm;