# Email Verification System Setup

## Overview
The Resend email service can be used for user authentication, including:
- Email verification during sign-up
- Welcome emails after verification
- Password reset emails
- Account notifications

## How It Works

### 1. Email Verification Flow
1. User signs up with email
2. System generates 6-digit verification code
3. Email sent with verification code and optional link
4. User enters code or clicks link
5. System verifies and activates account

### 2. Available Email Services

#### Verification Email (`/api/email/verify`)
- Sends 6-digit verification code
- Optional verification link
- Professional HTML template
- 10-minute expiration

#### Welcome Email (`/api/email/welcome`)
- Sent after successful verification
- Welcome message and getting started info

#### Password Reset (`/api/email/reset-password`)
- Secure password reset link
- Token-based authentication
- Expiration handling

## Implementation Example

### Sign-up Component
```typescript
import { authEmailService } from '@/services/authEmailService';

const handleSignup = async (email: string, name: string) => {
  // Generate verification code
  const verificationCode = authEmailService.generateVerificationCode();
  const verificationLink = authEmailService.generateVerificationLink(email, verificationCode);
  
  // Send verification email
  const result = await authEmailService.sendVerificationEmail({
    to: email,
    name: name,
    verificationCode,
    verificationLink
  });
  
  if (result.success) {
    // Store verification code in database with expiration
    // Show verification UI to user
  }
};
```

### Verification Component
```typescript
const handleVerify = async (email: string, code: string) => {
  // Check code against database
  const isValid = await verifyCode(email, code);
  
  if (isValid) {
    // Activate user account
    await activateUser(email);
    
    // Send welcome email
    await authEmailService.sendWelcomeEmail({
      to: email,
      name: userName
    });
  }
};
```

## Database Schema Updates

### Users Table Addition
```sql
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN verification_code VARCHAR(6);
ALTER TABLE users ADD COLUMN verification_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_expires_at TIMESTAMP;
```

## Security Features

### Verification Codes
- 6-digit random codes
- 10-minute expiration
- One-time use
- Rate limiting

### Password Reset
- Secure token generation
- 1-hour expiration
- Single-use tokens
- Email verification required

## Email Templates

All emails include:
- Professional AutoTradeHub branding
- Responsive design
- Security warnings
- Clear call-to-action buttons
- Proper HTML formatting

## Configuration

### Environment Variables
- `RESEND_API_KEY`: Your Resend API key
- `NEXT_PUBLIC_APP_URL`: Your application URL for verification links

### Rate Limiting
Consider implementing rate limiting for:
- Verification requests (3 per 10 minutes)
- Password reset requests (3 per hour)
- General email sending

## Testing

### Test Email Sending
1. Create test account
2. Check email delivery
3. Verify code functionality
4. Test link verification

### Test Security
1. Try expired codes
2. Test invalid codes
3. Check rate limiting
4. Verify token uniqueness

## Benefits

### User Experience
- Professional email templates
- Fast delivery via Resend
- Multiple verification methods
- Clear instructions

### Security
- Secure code generation
- Expiration handling
- Rate limiting
- Email validation

### Reliability
- Fallback logging system
- Error handling
- Delivery tracking
- Professional appearance

## Next Steps

1. **Set up Resend API key** in Vercel environment
2. **Update database schema** for verification fields
3. **Implement sign-up flow** with email verification
4. **Add verification UI** components
5. **Test the complete flow** end-to-end

This system provides a professional, secure email verification experience for your users using the same Resend service you already set up for contact forms.
