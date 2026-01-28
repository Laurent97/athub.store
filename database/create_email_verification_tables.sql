-- Email Verification System Tables
-- This SQL adds email verification functionality to the existing users table

-- Add email verification columns to existing users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_verification_email_sent TIMESTAMP,
ADD COLUMN IF NOT EXISTS email_verification_attempts INTEGER DEFAULT 0;

-- Create email verification logs table
CREATE TABLE IF NOT EXISTS email_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    verification_link TEXT,
    email_type VARCHAR(50) NOT NULL, -- 'verification', 'welcome', 'password_reset'
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered BOOLEAN DEFAULT FALSE,
    opened BOOLEAN DEFAULT FALSE,
    clicked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create email templates table for managing email content
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default email templates
INSERT INTO email_templates (template_name, subject, html_content, text_content) VALUES
(
    'email_verification',
    'Verify Your AutoTradeHub Account',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; background: #007bff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                    <span style="color: white; font-size: 24px; font-weight: bold;">A</span>
                </div>
                <h1 style="color: #333; margin: 20px 0 10px;">AutoTradeHub</h1>
                <p style="color: #666; margin: 0;">Verify Your Email Address</p>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h2 style="color: #333; margin: 0 0 15px;">Your Verification Code</h2>
                <div style="background: white; border: 2px dashed #007bff; padding: 20px; border-radius: 8px; display: inline-block;">
                    <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;">{{VERIFICATION_CODE}}</span>
                </div>
                <p style="color: #666; margin: 15px 0 0;">This code will expire in 10 minutes</p>
            </div>
            {{#if verification_link}}
            <div style="text-align: center; margin: 20px 0;">
                <p style="color: #666; margin: 0 0 15px;">Or click the link below:</p>
                <a href="{{VERIFICATION_LINK}}" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Verify Email Address
                </a>
            </div>
            {{/if}}
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #666; font-size: 14px; margin: 0;">
                    If you didn''t request this verification, please ignore this email.
                </p>
                <p style="color: #666; font-size: 14px; margin: 10px 0 0;">
                    For security, never share this code with anyone.
                </p>
            </div>
        </div>
    </div>',
    'AutoTradeHub - Verify Your Email Address\n\nYour verification code: {{VERIFICATION_CODE}}\n\nThis code will expire in 10 minutes.\n\nIf you didn''t request this verification, please ignore this email.'
),
(
    'welcome_email',
    'Welcome to AutoTradeHub!',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; background: #007bff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                    <span style="color: white; font-size: 24px; font-weight: bold;">A</span>
                </div>
                <h1 style="color: #333; margin: 20px 0 10px;">AutoTradeHub</h1>
                <p style="color: #666; margin: 0;">Welcome to AutoTradeHub!</p>
            </div>
            <div style="margin: 30px 0;">
                <h2 style="color: #333; margin: 0 0 15px;">Hi {{USER_NAME}},</h2>
                <p style="color: #666; line-height: 1.6; margin: 0 0 15px;">
                    Thank you for verifying your email address! Your AutoTradeHub account is now active and ready to use.
                </p>
                <p style="color: #666; line-height: 1.6; margin: 0 0 15px;">
                    You can now:
                </p>
                <ul style="color: #666; line-height: 1.6; margin: 0 0 20px; padding-left: 20px;">
                    <li>Browse thousands of automotive products</li>
                    <li>Connect with verified suppliers</li>
                    <li>Place orders and track shipments</li>
                    <li>Manage your account settings</li>
                </ul>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{{APP_URL}}" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Get Started
                    </a>
                </div>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #666; font-size: 14px; margin: 0;">
                    If you have any questions, feel free to contact our support team at support@athub.store
                </p>
            </div>
        </div>
    </div>',
    'Welcome to AutoTradeHub!\n\nHi {{USER_NAME}},\n\nThank you for verifying your email address! Your AutoTradeHub account is now active.\n\nVisit {{APP_URL}} to get started.\n\nQuestions? Contact us at support@athub.store'
),
(
    'password_reset',
    'Reset Your AutoTradeHub Password',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; background: #007bff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                    <span style="color: white; font-size: 24px; font-weight: bold;">A</span>
                </div>
                <h1 style="color: #333; margin: 20px 0 10px;">AutoTradeHub</h1>
                <p style="color: #666; margin: 0;">Reset Your Password</p>
            </div>
            <div style="margin: 30px 0;">
                <h2 style="color: #333; margin: 0 0 15px;">Hi {{USER_NAME}},</h2>
                <p style="color: #666; line-height: 1.6; margin: 0 0 20px;">
                    We received a request to reset your password. Click the button below to create a new password:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{{RESET_LINK}}" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #666; font-size: 14px; margin: 20px 0 0;">
                    This link will expire in 1 hour for security reasons.
                </p>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #666; font-size: 14px; margin: 0;">
                    If you didn''t request this password reset, please ignore this email or contact support at support@athub.store
                </p>
            </div>
        </div>
    </div>',
    'AutoTradeHub - Reset Your Password\n\nHi {{USER_NAME}},\n\nClick here to reset your password: {{RESET_LINK}}\n\nThis link expires in 1 hour.\n\nIf you didn''t request this, please ignore this email.'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_verification_code ON users(verification_code);
CREATE INDEX IF NOT EXISTS idx_users_verification_expires ON users(verification_expires_at);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_expires ON users(reset_expires_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email ON email_verification_logs(email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_verification_logs(sent_at);

-- Create function to clean up expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS void AS $$
BEGIN
    -- Clean up expired verification codes older than 24 hours
    UPDATE users 
    SET verification_code = NULL, 
        verification_expires_at = NULL
    WHERE verification_expires_at < CURRENT_TIMESTAMP - INTERVAL '24 hours';
    
    -- Clean up expired reset tokens older than 24 hours
    UPDATE users 
    SET reset_token = NULL, 
        reset_expires_at = NULL
    WHERE reset_expires_at < CURRENT_TIMESTAMP - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at 
    BEFORE UPDATE ON email_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE email_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for email verification logs (users can only see their own logs)
CREATE POLICY "Users can view their own email logs" ON email_verification_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy for email templates (only authenticated users can view)
CREATE POLICY "Authenticated users can view email templates" ON email_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for email templates (only service role can modify)
CREATE POLICY "Service role can manage email templates" ON email_templates
    FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE users IS 'Extended with email verification columns';
COMMENT ON TABLE email_verification_logs IS 'Logs all email verification activities';
COMMENT ON TABLE email_templates IS 'Email templates for different email types';

COMMENT ON COLUMN users.email_verified IS 'Whether the user email has been verified';
COMMENT ON COLUMN users.verification_code IS '6-digit code for email verification';
COMMENT ON COLUMN users.verification_expires_at IS 'Expiration time for verification code';
COMMENT ON COLUMN users.reset_token IS 'Token for password reset';
COMMENT ON COLUMN users.reset_expires_at IS 'Expiration time for reset token';
COMMENT ON COLUMN users.last_verification_email_sent IS 'Timestamp of last verification email sent';
COMMENT ON COLUMN users.email_verification_attempts IS 'Number of verification attempts made';
