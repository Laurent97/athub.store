interface VerificationEmailData {
  to: string;
  name: string;
  verificationCode: string;
  verificationLink?: string;
}

interface WelcomeEmailData {
  to: string;
  name: string;
}

interface PasswordResetEmailData {
  to: string;
  name: string;
  resetLink: string;
}

export const authEmailService = {
  // Send email verification code
  async sendVerificationEmail(data: VerificationEmailData): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/email/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: 'Verification email sent successfully!'
        };
      } else {
        throw new Error(result.error || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      return {
        success: false,
        message: 'Failed to send verification email. Please try again.'
      };
    }
  },

  // Send welcome email after successful verification
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/email/welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: 'Welcome email sent successfully!'
        };
      } else {
        throw new Error(result.error || 'Failed to send welcome email');
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return {
        success: false,
        message: 'Failed to send welcome email.'
      };
    }
  },

  // Send password reset email
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/email/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: 'Password reset email sent successfully!'
        };
      } else {
        throw new Error(result.error || 'Failed to send password reset email');
      }
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return {
        success: false,
        message: 'Failed to send password reset email. Please try again.'
      };
    }
  },

  // Generate verification code
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Generate verification link
  generateVerificationLink(email: string, code: string): string {
    return `${window.location.origin}/verify-email?email=${encodeURIComponent(email)}&code=${code}`;
  },

  // Generate password reset link
  generatePasswordResetLink(email: string, token: string): string {
    return `${window.location.origin}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;
  }
};
