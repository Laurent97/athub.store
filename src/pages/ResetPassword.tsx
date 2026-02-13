import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from '../hooks/use-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Key
} from 'lucide-react';
import { supabase } from '../lib/supabase/client';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
    color: 'bg-muted'
  });

  useEffect(() => {
    if (!token) {
      setError('Invalid password reset link. Please request a new one.');
      setValidatingToken(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const { data: resetData, error: resetError } = await supabase
        .from('password_reset_requests')
        .select(`
          *,
          users!password_reset_requests_user_id_fkey (
            id, 
            email, 
            full_name
          )
        `)
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (resetError || !resetData) {
        setError('Invalid or expired reset link. Please request a new one.');
        setTokenValid(false);
        return;
      }

      // Check if token has expired
      const expiresAt = new Date(resetData.expires_at);
      if (expiresAt < new Date()) {
        setError('Reset link has expired. Please request a new one.');
        setTokenValid(false);
        return;
      }

      setTokenValid(true);
      setError('');
    } catch (error) {
      console.error('Error validating token:', error);
      setError('Failed to validate reset link. Please try again.');
      setTokenValid(false);
    } finally {
      setValidatingToken(false);
    }
  };

  const checkPasswordStrength = (password: string) => {
    let score = 0;
    const feedback = [];
    
    if (password.length >= 8) score += 1;
    else feedback.push('Use at least 8 characters');
    
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score += 1;
    else feedback.push('Include uppercase and lowercase letters');
    
    if (password.match(/[0-9]/)) score += 1;
    else feedback.push('Include numbers');
    
    if (password.match(/[^a-zA-Z0-9]/)) score += 1;
    else feedback.push('Include special characters');
    
    let color = 'bg-red-500';
    if (score >= 3) color = 'bg-green-500';
    else if (score >= 2) color = 'bg-yellow-500';
    else if (score >= 1) color = 'bg-orange-500';
    
    setPasswordStrength({ score, feedback, color });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!passwordData.newPassword) {
      toast({
        title: 'Password required',
        description: 'Please enter a new password.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (passwordStrength.score < 2) {
      toast({
        title: 'Weak password',
        description: 'Please choose a stronger password.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      // Get reset request details with user email
      const { data: resetData, error: resetError } = await supabase
        .from('password_reset_requests')
        .select(`
          user_id,
          users!password_reset_requests_user_id_fkey (
            email
          )
        `)
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (resetError || !resetData) {
        setError('Invalid reset token. Please request a new one.');
        setLoading(false);
        return;
      }

      // Access the email from the joined users data
      const userEmail = (resetData as any).users?.email;
      if (!userEmail) {
        setError('User email not found. Please contact support.');
        setLoading(false);
        return;
      }

      // Use Supabase's built-in password reset with OTP
      // This will send a new reset link that allows password change without session
      const { error: resetError2 } = await supabase.auth.resetPasswordForEmail(
        userEmail,
        {
          redirectTo: `${window.location.origin}/reset-password?token=${token}&direct=true`
        }
      );

      if (resetError2) {
        console.error('Error sending reset email:', resetError2);
        setError('Failed to send reset email. Please try again.');
        setLoading(false);
        return;
      }

      // Mark the original reset request as used
      await supabase
        .from('password_reset_requests')
        .update({ 
          status: 'used',
          used_at: new Date().toISOString()
        })
        .eq('token', token);

      setSuccess(true);
      toast({
        title: 'Reset Email Sent!',
        description: 'A new password reset link has been sent to your email. Please check your inbox and click the link to set your new password.',
      });

    } catch (error: any) {
      console.error('Error resetting password:', error);
      setError('An unexpected error occurred. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to reset password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />
        <main className="pt-24 pb-16 min-h-screen flex items-center">
          <div className="container-wide max-w-2xl mx-auto px-4">
            <div className="w-full max-w-md mx-auto">
              <Card className="shadow-2xl border-0">
                <CardContent className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Validating reset link...</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />
        <main className="pt-24 pb-16 min-h-screen flex items-center">
          <div className="container-wide max-w-2xl mx-auto px-4">
            <div className="w-full max-w-md mx-auto">
              <Card className="shadow-2xl border-0">
                <CardHeader className="text-center pb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    Invalid Reset Link
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {error || 'This password reset link is invalid or has expired.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8 text-center space-y-4">
                  <Link to="/forgot-password">
                    <Button className="w-full">
                      Request New Reset Link
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button variant="ghost" className="w-full">
                      Back to Sign In
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />
        <main className="pt-24 pb-16 min-h-screen flex items-center">
          <div className="container-wide max-w-2xl mx-auto px-4">
            <div className="w-full max-w-md mx-auto">
              <Card className="shadow-2xl border-0">
                <CardHeader className="text-center pb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    Reset Email Sent!
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    A new password reset link has been sent to your email. Please check your inbox and click the link to set your new password.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8 text-center space-y-4">
                  <Link to="/auth">
                    <Button className="w-full">
                      Back to Sign In
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      
      <main className="pt-24 pb-16 min-h-screen flex items-center">
        <div className="container-wide max-w-2xl mx-auto px-4">
          <div className="w-full max-w-md mx-auto">
            
            {/* Back to Forgot Password */}
            <div className="mb-6">
              <Link 
                to="/forgot-password" 
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Forgot Password
              </Link>
            </div>

            <Card className="shadow-2xl border-0">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Reset Your Password
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter your new password below
                </CardDescription>
              </CardHeader>
              
              <CardContent className="px-8 pb-8">
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm font-medium text-foreground">
                      New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your new password"
                        value={passwordData.newPassword}
                        onChange={(e) => {
                          setPasswordData({ ...passwordData, newPassword: e.target.value });
                          checkPasswordStrength(e.target.value);
                        }}
                        className="pl-10 pr-10 h-12 border-border focus:border-blue-500 focus:ring-blue-500"
                        required
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-2 h-8 w-8 p-0"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {passwordData.newPassword && (
                      <div className="space-y-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full ${
                                level <= passwordStrength.score
                                  ? passwordStrength.color
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        {passwordStrength.feedback.length > 0 && (
                          <p className="text-xs text-gray-500">
                            {passwordStrength.feedback[0]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your new password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        className="pl-10 pr-10 h-12 border-border focus:border-blue-500 focus:ring-blue-500"
                        required
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-2 h-8 w-8 p-0"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Resetting Password...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Reset Password
                      </div>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Remember your password?{' '}
                    <Link to="/auth" className="text-primary hover:text-blue-800 font-medium">
                      Sign In
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Security Tips</p>
                  <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Use a strong, unique password</li>
                    <li>• Don't share your password with anyone</li>
                    <li>• Consider using a password manager</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ResetPassword;
