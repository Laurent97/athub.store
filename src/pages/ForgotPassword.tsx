import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from '../hooks/use-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  Mail, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle,
  Send,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase/client';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!email.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      // Check if user exists in our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        // Don't reveal if user exists or not for security
        setSubmitted(true);
        toast({
          title: 'Reset link sent',
          description: 'If an account exists with this email, you will receive a password reset link.',
        });
        setLoading(false);
        return;
      }

      // Generate a secure token
      const generateSecureToken = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 32; i++) {
          token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
      };

      const token = generateSecureToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      // Create password reset request - simplified for anonymous access
      const { data: resetResponse, error: resetError } = await supabase
        .from('password_reset_requests')
        .insert({
          user_id: userData.id,
          email: email,
          token: token,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        })
        .select();

      if (resetError) {
        console.error('Error creating password reset request:', resetError);
        setError('Failed to create password reset request. Please try again.');
        setLoading(false);
        return;
      }

      // Create the reset link
      const resetLink = `${window.location.origin}/reset-password?token=${token}`;

      // For now, show the reset link to the user (in production, this would be emailed)
      setSubmitted(true);
      setError(`Password reset link: ${resetLink}\n\nIn production, this link would be sent to your email. For now, please copy and use this link to reset your password.`);

      toast({
        title: 'Reset link generated',
        description: 'Your password reset link has been generated. See below for details.',
      });

    } catch (error: any) {
      console.error('Error in forgot password:', error);
      setError('An unexpected error occurred. Please try again later.');
      toast({
        title: 'Error',
        description: 'Failed to process your request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetAnother = () => {
    setEmail('');
    setSubmitted(false);
    setError('');
  };

  const copyToClipboard = async (text: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast({
          title: 'Copied to clipboard',
          description: 'Reset link copied to clipboard',
        });
      } else {
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          toast({
            title: 'Copied to clipboard',
            description: 'Reset link copied to clipboard',
          });
        } catch (err) {
          console.error('Failed to copy text: ', err);
          toast({
            title: 'Copy failed',
            description: 'Please manually copy the reset link',
            variant: 'destructive',
          });
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Clipboard error:', err);
      toast({
        title: 'Copy failed',
        description: 'Please manually copy the reset link',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      
      <main className="pt-24 pb-16 min-h-screen flex items-center">
        <div className="container-wide max-w-2xl mx-auto px-4">
          <div className="w-full max-w-md mx-auto">
            
            {/* Back to Login */}
            <div className="mb-6">
              <Link 
                to="/auth" 
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>

            <Card className="shadow-2xl border-0">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Forgot Your Password?
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter your email address and we'll send you a link to reset your password
                </CardDescription>
              </CardHeader>
              
              <CardContent className="px-8 pb-8">
                {!submitted ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-foreground">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-12 border-border focus:border-blue-500 focus:ring-blue-500"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {error && !error.includes('Password reset link:') && (
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
                          Sending reset link...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4" />
                          Send Reset Link
                        </div>
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Reset Link Generated!
                        </h3>
                        <p className="text-muted-foreground">
                          We've generated a password reset link for you. In production, this would be sent to your email.
                        </p>
                      </div>
                    </div>

                    {error && error.includes('Password reset link:') && (
                      <Alert>
                        <AlertDescription className="whitespace-pre-wrap">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-3">
                      <Button
                        onClick={async () => await copyToClipboard(error.split('\n\n')[0].replace('Password reset link: ', ''))}
                        className="w-full"
                        variant="outline"
                      >
                        Copy Reset Link
                      </Button>
                      
                      <Button
                        onClick={handleResetAnother}
                        className="w-full"
                        variant="outline"
                      >
                        Reset Another Password
                      </Button>
                      
                      <Link to="/auth" className="block">
                        <Button className="w-full" variant="ghost">
                          Back to Sign In
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Remember your password?{' '}
                    <Link to="/auth" className="text-primary hover:text-blue-800 font-medium">
                      Sign In
                    </Link>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Are you an administrator?{' '}
                    <Link to="/admin/password-reset" className="text-primary hover:text-blue-800 font-medium">
                      Admin Password Reset
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
                  <p className="font-medium mb-1">Security Notice</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Password reset links expire after 24 hours for your security. 
                    If you don't receive the link, please check your spam folder or try again.
                  </p>
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

export default ForgotPassword;
