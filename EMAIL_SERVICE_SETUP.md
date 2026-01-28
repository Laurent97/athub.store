# Email Service Setup for Contact Form

## Current Status
The contact form now uses a Vercel serverless function to send emails. Currently, it will log messages but not send actual emails until you configure an email service.

## Options to Enable Email Sending

### Option 1: Resend (Recommended)
1. **Sign up for Resend**: Go to [resend.com](https://resend.com)
2. **Get API Key**: 
   - Go to Dashboard → API Keys
   - Create a new API key
3. **Add to Vercel Environment**:
   - Go to your Vercel project settings
   - Add Environment Variable: `RESEND_API_KEY`
   - Paste your Resend API key
4. **Verify Domain** (optional but recommended):
   - In Resend, add your domain `athub.store`
   - Add the DNS records they provide to your Namecheap DNS

### Option 2: EmailJS (Free Alternative)
1. **Sign up for EmailJS**: Go to [emailjs.com](https://www.emailjs.com)
2. **Create Email Service**:
   - Add your email service (Gmail, Outlook, etc.)
   - Create an email template
3. **Get Credentials**:
   - Service ID
   - Template ID  
   - Public Key
4. **Add to Vercel Environment**:
   - `EMAILJS_SERVICE_ID`
   - `EMAILJS_TEMPLATE_ID`
   - `EMAILJS_PUBLIC_KEY`

### Option 3: Use Fallback (Current)
The current setup will:
- Log all form submissions to Vercel logs
- Show success message to users
- You can manually check the logs for messages

## Testing the Contact Form

1. Deploy the changes to Vercel
2. Go to `https://autotrade-ochre.vercel.app/contact`
3. Fill out the form and submit
4. Check Vercel Function Logs to see the submission

## Vercel Function Logs
To see logged messages:
1. Go to your Vercel project
2. Click on the "Functions" tab
3. Click on the `api/contact` function
4. View the logs to see form submissions

## Quick Deploy
```bash
git add .
git commit -m "Add serverless email function for contact form"
git push
```

The contact form will work immediately after deployment, but emails will only be sent once you configure one of the email service options above.
