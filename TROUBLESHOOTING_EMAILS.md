# Troubleshooting: Email Confirmations Not Working

## Quick Diagnostic Steps

### 1. Check Browser Console
After clicking "Create Account", open browser DevTools (F12) and check the Console tab. You should see:
- `Signing up with: { email: "...", emailRedirectUrl: "..." }`
- `Signup response: { user: "exists", session: "null", error: undefined }`

**If you see `user: "null"`**: Email confirmations might be disabled in Supabase.

### 2. Verify Supabase Dashboard Settings

#### Step 1: Enable Email Confirmations
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Settings**
4. Scroll to **"Email Auth"** section
5. **CRITICAL**: Toggle **"Enable email confirmations"** to **ON** ✅
6. Click **"Save"**

#### Step 2: Configure URLs
In the same **Authentication** → **Settings** page:

1. **Site URL**:
   - Development: `http://localhost:3000`
   - Production: Your production URL

2. **Redirect URLs** (add both):
   - `http://localhost:3000/**` (for development)
   - `http://localhost:3000/auth/callback` (specific callback)
   - For production: `https://yourdomain.com/**` and `https://yourdomain.com/auth/callback`

3. Click **"Save"**

#### Step 3: Check Email Templates
1. Go to **Authentication** → **Email Templates**
2. Ensure **"Confirm signup"** template is enabled
3. Template should include: `{{ .ConfirmationURL }}`

### 3. Check Supabase Logs

1. Go to **Logs** → **Auth Logs** in Supabase dashboard
2. Look for entries when you sign up
3. Check for any errors related to email sending

### 4. Test Email Configuration

#### Option A: Use Supabase Default Email (Development)
- Works out of the box
- May go to spam initially
- Has rate limits on free tier

#### Option B: Configure Custom SMTP (Production Recommended)
1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Enable **"Enable Custom SMTP"**
3. Configure with provider:
   - **SendGrid**: Free tier (100 emails/day)
   - **Mailgun**: Free tier (5,000 emails/month)
   - **AWS SES**: Very affordable
4. Test configuration

### 5. Common Issues and Solutions

#### Issue: "User created but no email sent"
**Solution**: 
- Email confirmations are disabled → Enable in dashboard
- SMTP not configured → Set up SMTP or use Supabase default
- Email in spam → Check spam folder, whitelist sender

#### Issue: "No user returned from signup"
**Solution**:
- Email confirmations disabled → Enable in dashboard
- Check browser console for errors
- Verify Supabase project is active

#### Issue: "Email arrives but link doesn't work"
**Solution**:
- Redirect URL not whitelisted → Add to Supabase redirect URLs
- Callback route issue → Verify `/auth/callback` route exists
- Check URL format in email template

#### Issue: "Emails go to spam"
**Solution**:
- Use custom SMTP with proper SPF/DKIM records
- Whitelist sender email address
- Check email provider's spam filters

### 6. Verify Code is Correct

The code should:
- ✅ Call `supabase.auth.signUp()` with email and password
- ✅ Include `emailRedirectTo` in options
- ✅ Store user metadata (name, college)
- ✅ Handle case where `user` exists but `session` is null (email confirmation required)
- ✅ Have `/auth/callback` route to handle email confirmation

### 7. Manual Test Checklist

- [ ] Email confirmations enabled in Supabase dashboard
- [ ] Site URL configured correctly
- [ ] Redirect URLs added (including `/auth/callback`)
- [ ] Email templates enabled
- [ ] Browser console shows user created
- [ ] Check email inbox (and spam)
- [ ] Click confirmation link
- [ ] Verify redirect to dashboard works
- [ ] Check Supabase Auth Logs for errors

### 8. Still Not Working?

1. **Check Supabase Status**: https://status.supabase.com
2. **Verify Environment Variables**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```
3. **Test with Different Email**: Some providers block automated emails
4. **Check Rate Limits**: Free tier has email sending limits
5. **Review Supabase Documentation**: https://supabase.com/docs/guides/auth/auth-email

### 9. Debug Mode

Add this to your signup handler to see what's happening:

```typescript
console.log('Signup response:', { 
  user: signUpData?.user ? 'exists' : 'null',
  session: signUpData?.session ? 'exists' : 'null',
  error: signUpError?.message 
});
```

**Expected output when email confirmation is enabled:**
```
Signup response: { user: "exists", session: "null", error: undefined }
```

**If you see `session: "exists"`**: Email confirmations are disabled.

### 10. Quick Fix Command

If you have Supabase CLI, you can check settings:

```bash
supabase status
```

Or check via API:
```bash
curl -X GET 'https://your-project.supabase.co/rest/v1/' \
  -H "apikey: your-anon-key"
```

## Still Having Issues?

1. Check the browser console for errors
2. Check Supabase dashboard logs
3. Verify all settings in Supabase dashboard
4. Test with a different email provider
5. Ensure you're using the latest code with callback route

The most common issue is **email confirmations not being enabled** in the Supabase dashboard. Double-check that setting first!

