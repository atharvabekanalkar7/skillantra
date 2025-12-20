# Supabase Email Configuration Guide

## Problem: Users Not Receiving Authentication Emails

If users are not receiving authentication emails after signup, you need to configure email settings in your Supabase project.

## Step-by-Step Setup

### 1. Enable Email Confirmation in Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Settings** (or **Auth** → **Settings**)
3. Scroll down to **Email Auth** section
4. Find **"Enable email confirmations"** toggle
5. **Turn it ON** ✅

### 2. Configure Email Provider

You have two options:

#### Option A: Use Supabase's Built-in Email Service (Recommended for Development)

1. In **Authentication** → **Settings** → **Email Auth**
2. Under **SMTP Settings**, you can use Supabase's default email service
3. For production, you should configure custom SMTP

#### Option B: Configure Custom SMTP (Recommended for Production)

1. In **Authentication** → **Settings** → **SMTP Settings**
2. Enable **"Enable Custom SMTP"**
3. Fill in your SMTP provider details:
   - **Host**: Your SMTP server (e.g., `smtp.gmail.com`, `smtp.sendgrid.net`)
   - **Port**: Usually `587` for TLS or `465` for SSL
   - **Username**: Your SMTP username/email
   - **Password**: Your SMTP password
   - **Sender email**: The email address that will send emails
   - **Sender name**: Display name for emails

**Popular SMTP Providers:**
- **SendGrid**: Free tier available (100 emails/day)
- **Mailgun**: Free tier available (5,000 emails/month)
- **AWS SES**: Very affordable, pay-as-you-go
- **Gmail**: Can use App Password for personal Gmail accounts

### 3. Customize Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. You can customize:
   - **Confirm signup** - Email sent for email confirmation
   - **Magic Link** - For passwordless login
   - **Change Email Address** - When user changes email
   - **Reset Password** - Password reset emails

3. Make sure the **Confirm signup** template is enabled and has the correct redirect URL:
   ```
   {{ .ConfirmationURL }}
   ```

### 4. Set Site URL and Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your app URL:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
3. Add **Redirect URLs**:
   - `http://localhost:3000/**` (for development)
   - `https://yourdomain.com/**` (for production)

### 5. Test Email Configuration

1. Try signing up with a test email
2. Check the email inbox (and spam folder)
3. If using Supabase's default email, check:
   - Emails might go to spam initially
   - Rate limits apply (check Supabase dashboard for limits)

### 6. Verify Email Confirmation is Working

After configuration:
1. Sign up with a new email
2. You should see "Check your email" message
3. Check your email inbox for confirmation email
4. Click the confirmation link
5. You should be able to log in

## Troubleshooting

### Emails Still Not Arriving?

1. **Check Spam/Junk Folder**: Supabase emails often go to spam initially
2. **Check Supabase Dashboard** → **Logs**: Look for email sending errors
3. **Verify SMTP Settings**: Double-check all SMTP credentials
4. **Check Rate Limits**: Free tier has email sending limits
5. **Test with Different Email**: Some email providers block automated emails
6. **Check Email Templates**: Ensure templates are enabled and configured

### Common Issues

- **"Email rate limit exceeded"**: You've hit Supabase's email sending limit
- **"SMTP connection failed"**: Check your SMTP credentials
- **"Email template not found"**: Enable email templates in dashboard
- **Emails going to spam**: Configure SPF/DKIM records (for custom domains)

## Quick Checklist

- [ ] Email confirmations enabled in Auth settings
- [ ] SMTP configured (or using Supabase default)
- [ ] Site URL set correctly
- [ ] Redirect URLs configured
- [ ] Email templates enabled
- [ ] Tested with a real email address

## Additional Resources

- [Supabase Auth Email Docs](https://supabase.com/docs/guides/auth/auth-email)
- [Supabase SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

