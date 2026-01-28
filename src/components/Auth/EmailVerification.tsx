import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft, CheckCircle, Clock } from 'lucide-react';

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export default function EmailVerification({ email, onVerified, onBack }: EmailVerificationProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);

  // Countdown timer
  useState(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  });

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Email verified successfully!');
        setTimeout(() => {
          onVerified();
        }, 1500);
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (error) {
      setError('Failed to verify email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Verification code resent successfully!');
        setTimeLeft(600);
        setCanResend(false);
      } else {
        setError(data.error || 'Failed to resend verification code');
      }
    } catch (error) {
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Verify Your Email
            </h1>
            <p className="text-muted-foreground">
              We've sent a verification code to<br />
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Verification Code
              </label>
              <div className="flex justify-center gap-2 mb-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={verificationCode[index] || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.match(/^[0-9]$/)) {
                        const newCode = verificationCode.split('');
                        newCode[index] = value;
                        setVerificationCode(newCode.join(''));
                        
                        // Focus next input
                        if (index < 5) {
                          const nextInput = e.target.parentElement?.querySelectorAll('input')[index + 1];
                          nextInput?.focus();
                        }
                      } else if (value === '') {
                        const newCode = verificationCode.split('');
                        newCode[index] = '';
                        setVerificationCode(newCode.join(''));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && index > 0 && !verificationCode[index]) {
                        const prevInput = e.target.parentElement?.querySelectorAll('input')[index - 1];
                        prevInput?.focus();
                      }
                    }}
                    className="w-12 h-12 text-center text-lg font-semibold border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                ))}
              </div>
              <input
                type="hidden"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>

            {/* Timer */}
            {timeLeft > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Code expires in {formatTime(timeLeft)}</span>
              </div>
            )}

            {/* Error/Success Messages */}
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-success/10 text-success rounded-lg text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {success}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || verificationCode.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Button>

            {/* Resend Code */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || isResending}
                className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
              >
                {isResending
                  ? 'Resending...'
                  : canResend
                  ? "Didn't receive the code? Resend"
                  : `Resend code in ${formatTime(timeLeft)}`}
              </button>
            </div>
          </form>

          {/* Back Button */}
          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
