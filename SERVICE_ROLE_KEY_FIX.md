# Fix: SUPABASE_SERVICE_ROLE_KEY Error

If you're seeing the error "Missing SUPABASE_SERVICE_ROLE_KEY" even though you've set it in `.env.local`, follow these steps:

## Quick Fix

1. **Stop your development server** (Ctrl+C in terminal)
2. **Restart it**: `npm run dev`

Environment variables are only loaded when the server starts. If you added or modified `.env.local` without restarting, the variable won't be available.

## Verify the Key is Set

1. Check your `.env.local` file exists in the root directory (same level as `package.json`)
2. Verify the line:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
3. Make sure:
   - No quotes around the value
   - No spaces around the `=`
   - No trailing spaces
   - The key is on its own line

## Get Your Service Role Key

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **service_role key** (not the anon key!)
5. Paste it into `.env.local` as `SUPABASE_SERVICE_ROLE_KEY=...`

## After Setting the Key

1. **Restart your dev server** (required!)
2. The error should disappear
3. Login should work normally

## Code Changes Made

The login route now handles missing service role key gracefully:
- If the key is missing, login will still work
- Email confirmation will be checked from the login response
- Pre-checks (deleted account, email confirmation) will be skipped if admin client can't be created
- Error is logged but doesn't block login

However, **you should still set the key** for full security features to work properly.

