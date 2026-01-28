# Vercel Environment Variables Setup

## Required Environment Variables

### 1. Resend API Key
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Supabase Configuration (for email verification)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Application URL (for email links)
```
NEXT_PUBLIC_APP_URL=https://autotrade-ochre.vercel.app
```

## How to Add Environment Variables in Vercel

### Method 1: Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `autotrade-ochre`
3. Go to **Settings** → **Environment Variables**
4. Click **Add New** for each variable:
   - **Name**: `RESEND_API_KEY`
   - **Value**: Your Resend API key
   - **Environments**: Production, Preview, Development
5. Repeat for other variables

### Method 2: Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add RESEND_API_KEY
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_APP_URL

# Redeploy to apply changes
vercel --prod
```

## Getting Your API Keys

### Resend API Key
1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Go to **API Keys** section
3. Click **Create API Key**
4. Give it a name (e.g., "AutoTradeHub Production")
5. Copy the key (starts with `re_`)
6. **Important**: Store this key securely!

### Supabase Keys
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **service_role** key → `VITE_SUPABASE_SERVICE_ROLE_KEY`

## Testing the Setup

### 1. Contact Form Test
After adding the API key:
1. Visit: `https://autotrade-ochre.vercel.app/contact`
2. Fill out the contact form
3. Check if you receive emails at:
   - `support@athub.store`
   - `admin@athub.store`

### 2. Email Verification Test
Once database is set up:
1. Test sign-up flow with email verification
2. Check verification emails are sent
3. Verify welcome emails after successful verification

## Security Notes

### ⚠️ Important Security Practices
- **Never commit API keys** to git
- **Use different keys** for development and production
- **Rotate keys regularly** for security
- **Monitor usage** in Resend dashboard
- **Set up alerts** for unusual activity

### 🔒 Key Permissions
- **RESEND_API_KEY**: Full email sending permissions
- **VITE_SUPABASE_SERVICE_ROLE_KEY**: Admin access to database
- **NEXT_PUBLIC_APP_URL**: Public URL (safe to expose)

## Troubleshooting

### Common Issues
1. **Emails not sending**: Check API key is correct and has permissions
2. **Domain not verified**: Wait for DNS propagation
3. **Environment variables not loading**: Redeploy the application
4. **Supabase connection issues**: Verify URL and service role key

### Debug Steps
1. Check Vercel function logs: `vercel logs`
2. Verify environment variables in Vercel dashboard
3. Test API keys with curl commands
4. Check Resend dashboard for email delivery status

## Next Steps

1. **Add RESEND_API_KEY** to Vercel environment variables
2. **Deploy the application** to apply changes
3. **Test contact form** functionality
4. **Monitor email delivery** in Resend dashboard
5. **Set up database** for email verification system

Once the API key is configured, your email system will be fully functional!
