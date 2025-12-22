# Fix Email Confirmation Redirects in Production

If email confirmation links are redirecting to `localhost:3000` instead of your production domain (e.g., `skillantra.in`), follow these steps:

## Problem

Supabase uses **two sources** for email redirect URLs:
1. The `emailRedirectTo` parameter in your code (now fixed to auto-detect)
2. The **Site URL** configured in Supabase Dashboard (this can override your parameter)

## Solution

### Step 1: Set Environment Variable (Required)

In your production environment (Vercel, Railway, etc.), set:

```env
NEXT_PUBLIC_SITE_URL=https://skillantra.in
```

**Important:** 
- Use `https://` (not `http://`)
- Include the full domain (no trailing slash)
- Restart/redeploy after setting

### Step 2: Update Supabase Dashboard (Critical)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Set **Site URL** to: `https://skillantra.in`
5. In **Redirect URLs**, add:
   - `https://skillantra.in/**` (wildcard for all paths)
   - `https://skillantra.in/auth/callback` (specific callback)
6. Click **Save**

### Step 3: Verify Configuration

After updating:
1. The **Site URL** in Supabase should match your production domain
2. All **Redirect URLs** should use `https://skillantra.in` (not localhost)
3. Your `NEXT_PUBLIC_SITE_URL` environment variable should be set

### Step 4: Test

1. Sign up a new user
2. Check the confirmation email
3. Click the confirmation link
4. It should redirect to `https://skillantra.in/auth/callback` (not localhost)

## Code Changes Made

The code now automatically detects the production URL from request headers if `NEXT_PUBLIC_SITE_URL` isn't set, but **you should still set the environment variable** for reliability.

## Common Issues

### Issue: Still redirecting to localhost
**Solution:** 
- Check Supabase Dashboard → Authentication → URL Configuration
- Make sure Site URL is `https://skillantra.in` (not localhost)
- Verify Redirect URLs include your production domain

### Issue: Links work but show localhost in email
**Solution:**
- This is normal - Supabase generates the link
- The important part is where it redirects when clicked
- Verify the redirect destination is correct

### Issue: Environment variable not working
**Solution:**
- Make sure variable name is exactly: `NEXT_PUBLIC_SITE_URL`
- Restart/redeploy your application after setting
- Check your hosting platform's environment variable settings

## For Multiple Environments

If you have both development and production:

**Development (.env.local):**
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Production (Vercel/Railway/etc.):**
```env
NEXT_PUBLIC_SITE_URL=https://skillantra.in
```

**Supabase Dashboard:**
- Set Site URL to your **production** domain
- Add both localhost and production to Redirect URLs:
  - `http://localhost:3000/**`
  - `https://skillantra.in/**`

