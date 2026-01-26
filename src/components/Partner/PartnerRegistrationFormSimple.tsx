import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Store, User, Mail, Lock, ArrowRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const PartnerRegistrationFormSimple: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    storeName: '',
    email: user?.email || '',
    invitationCode: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Basic validation
      if (!formData.storeName.trim()) {
        setError('Store name is required');
        return;
      }
      
      if (!formData.email.trim()) {
        setError('Email is required');
        return;
      }

      if (!formData.invitationCode.trim()) {
        setError('Invitation code is required');
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        navigate('/partner/pending');
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigate(`/login?redirect=${encodeURIComponent('/become-partner')}`);
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <div className="mb-6">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Login Required
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in to apply for the partner program
          </p>
        </div>
        
        <Button onClick={handleLogin} className="btn-primary w-full">
          <Lock className="w-4 h-4 mr-2" />
          Login to Continue
        </Button>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Don't have an account? <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/register')}>Sign up</Button>
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Application Submitted!
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Your partner application has been received. We'll review it and get back to you soon.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Redirecting to dashboard...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="storeName" className="text-sm font-semibold text-gray-900 dark:text-white">
          Store Name *
        </Label>
        <div className="relative mt-2">
          <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            id="storeName"
            type="text"
            value={formData.storeName}
            onChange={(e) => setFormData({...formData, storeName: e.target.value})}
            className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="e.g., AutoZone Pro"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email" className="text-sm font-semibold text-gray-900 dark:text-white">
          Email Address *
        </Label>
        <div className="relative mt-2">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="your@email.com"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="invitationCode" className="text-sm font-semibold text-gray-900 dark:text-white">
          Invitation Code *
        </Label>
        <div className="relative mt-2">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            id="invitationCode"
            type="text"
            value={formData.invitationCode}
            onChange={(e) => setFormData({...formData, invitationCode: e.target.value})}
            className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="Enter invitation code"
            required
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Try: ADMIN2025, PARENT2025, or WELCOME2025
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <Button 
        type="submit" 
        className="btn-primary w-full"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            Submit Application
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>

      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          By submitting, you agree to our{' '}
          <Button variant="link" className="p-0 h-auto text-xs">Terms</Button> and{' '}
          <Button variant="link" className="p-0 h-auto text-xs">Privacy Policy</Button>
        </p>
      </div>
    </form>
  );
};

export default PartnerRegistrationFormSimple;
