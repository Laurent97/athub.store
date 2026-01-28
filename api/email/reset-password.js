export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, name, resetLink } = req.body;

    if (!to || !name || !resetLink) {
      return res.status(400).json({ error: 'Missing required fields: to, name, resetLink' });
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background: #007bff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
              <span style="color: white; font-size: 24px; font-weight: bold;">A</span>
            </div>
            <h1 style="color: #333; margin: 20px 0 10px;">AutoTradeHub</h1>
            <p style="color: #666; margin: 0;">Reset Your Password</p>
          </div>
          
          <div style="margin: 30px 0;">
            <h2 style="color: #333; margin: 0 0 15px;">Hi ${name},</h2>
            <p style="color: #666; line-height: 1.6; margin: 0 0 20px;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px; margin: 20px 0 0;">
              This link will expire in 1 hour for security reasons.
            </p>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              If you didn't request this password reset, please ignore this email or contact support at support@athub.store
            </p>
          </div>
        </div>
      </div>
    `;

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'noreply@athub.store',
          to: [to],
          subject: 'Reset Your AutoTradeHub Password',
          html: emailHtml,
        }),
      });

      if (response.ok) {
        return res.status(200).json({ message: 'Password reset email sent successfully!' });
      } else {
        throw new Error('Failed to send password reset email via Resend');
      }
    }

    // Fallback - log the password reset email
    console.log('Password reset email:', { to, name, resetLink });
    return res.status(200).json({ 
      message: 'Password reset email logged successfully!',
      note: 'Email service not configured. Check logs for reset link.'
    });

  } catch (error) {
    console.error('Password reset email error:', error);
    return res.status(500).json({ error: 'Failed to send password reset email' });
  }
}
