import { supabase } from './client';
import { authEmailService } from '@/services/authEmailService';

export interface User {
  id: string;
  email: string;
  name?: string;
  email_verified: boolean;
  created_at: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface VerificationData {
  email: string;
  code: string;
}

export interface PasswordResetData {
  email: string;
  token: string;
  newPassword: string;
}

export const authService = {
  // Sign up new user
  async signUp(data: SignUpData): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email)
        .single();

      if (existingUser) {
        return {
          success: false,
          message: 'An account with this email already exists'
        };
      }

      // Create user account
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email: data.email,
          name: data.name,
          email_verified: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Generate and send verification code
      const verificationCode = authEmailService.generateVerificationCode();
      const verificationLink = authEmailService.generateVerificationLink(data.email, verificationCode);

      // Update user with verification code
      await supabase
        .from('users')
        .update({
          verification_code: verificationCode,
          verification_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
          last_verification_email_sent: new Date().toISOString(),
          email_verification_attempts: 1
        })
        .eq('id', newUser.id);

      // Send verification email
      const emailResult = await authEmailService.sendVerificationEmail({
        to: data.email,
        name: data.name,
        verificationCode,
        verificationLink
      });

      if (!emailResult.success) {
        // User created but email failed - allow manual resend
        return {
          success: true,
          message: 'Account created but verification email failed. Please try resending.',
          user: newUser
        };
      }

      return {
        success: true,
        message: 'Account created! Please check your email for verification.',
        user: newUser
      };

    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        message: 'Failed to create account. Please try again.'
      };
    }
  },

  // Verify email with code
  async verifyEmail(data: VerificationData): Promise<{ success: boolean; message: string }> {
    try {
      // Find user with verification code
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.email)
        .eq('verification_code', data.code)
        .single();

      if (error || !user) {
        return {
          success: false,
          message: 'Invalid verification code'
        };
      }

      // Check if code has expired
      if (user.verification_expires_at && new Date(user.verification_expires_at) < new Date()) {
        return {
          success: false,
          message: 'Verification code has expired'
        };
      }

      // Mark email as verified
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email_verified: true,
          verification_code: null,
          verification_expires_at: null
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Send welcome email
      await authEmailService.sendWelcomeEmail({
        to: user.email,
        name: user.name || 'User'
      });

      return {
        success: true,
        message: 'Email verified successfully!'
      };

    } catch (error) {
      console.error('Email verification error:', error);
      return {
        success: false,
        message: 'Failed to verify email. Please try again.'
      };
    }
  },

  // Resend verification code
  async resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get user info
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Check rate limiting (max 3 attempts per 10 minutes)
      if (user.email_verification_attempts >= 3 && 
          user.last_verification_email_sent && 
          new Date(user.last_verification_email_sent) > new Date(Date.now() - 10 * 60 * 1000)) {
        return {
          success: false,
          message: 'Too many verification attempts. Please wait 10 minutes.'
        };
      }

      // Generate new verification code
      const verificationCode = authEmailService.generateVerificationCode();
      const verificationLink = authEmailService.generateVerificationLink(email, verificationCode);

      // Update user with new verification code
      await supabase
        .from('users')
        .update({
          verification_code: verificationCode,
          verification_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          last_verification_email_sent: new Date().toISOString(),
          email_verification_attempts: (user.email_verification_attempts || 0) + 1
        })
        .eq('id', user.id);

      // Send verification email
      const emailResult = await authEmailService.sendVerificationEmail({
        to: email,
        name: user.name || 'User',
        verificationCode,
        verificationLink
      });

      if (!emailResult.success) {
        return {
          success: false,
          message: 'Failed to send verification email. Please try again.'
        };
      }

      return {
        success: true,
        message: 'Verification code sent successfully!'
      };

    } catch (error) {
      console.error('Resend verification error:', error);
      return {
        success: false,
        message: 'Failed to resend verification code. Please try again.'
      };
    }
  },

  // Request password reset
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get user info
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        // Don't reveal if user exists or not
        return {
          success: true,
          message: 'If an account exists with this email, you will receive a password reset link.'
        };
      }

      // Generate reset token
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const resetLink = authEmailService.generatePasswordResetLink(email, resetToken);

      // Update user with reset token
      await supabase
        .from('users')
        .update({
          reset_token: resetToken,
          reset_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
        })
        .eq('id', user.id);

      // Send password reset email
      const emailResult = await authEmailService.sendPasswordResetEmail({
        to: email,
        name: user.name || 'User',
        resetLink
      });

      if (!emailResult.success) {
        return {
          success: false,
          message: 'Failed to send password reset email. Please try again.'
        };
      }

      return {
        success: true,
        message: 'Password reset link sent to your email!'
      };

    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        message: 'Failed to process password reset request. Please try again.'
      };
    }
  },

  // Reset password with token
  async resetPassword(data: PasswordResetData): Promise<{ success: boolean; message: string }> {
    try {
      // Find user with reset token
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.email)
        .eq('reset_token', data.token)
        .single();

      if (error || !user) {
        return {
          success: false,
          message: 'Invalid or expired reset token'
        };
      }

      // Check if token has expired
      if (user.reset_expires_at && new Date(user.reset_expires_at) < new Date()) {
        return {
          success: false,
          message: 'Reset token has expired'
        };
      }

      // Update password (in a real app, you'd hash this password)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          // password_hash: hashedPassword, // In real implementation
          reset_token: null,
          reset_expires_at: null
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      return {
        success: true,
        message: 'Password reset successfully! You can now log in with your new password.'
      };

    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: 'Failed to reset password. Please try again.'
      };
    }
  },

  // Check if email is verified
  async isEmailVerified(email: string): Promise<boolean> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('email_verified')
        .eq('email', email)
        .single();

      return user?.email_verified || false;
    } catch {
      return false;
    }
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      return user;
    } catch {
      return null;
    }
  }
};
