# Environment Variable Debugging Guide

## Quick Test

To verify your `SUPABASE_SERVICE_ROLE_KEY` is being loaded, check the server console logs when you try to delete your account. You should see a log like:

```
Environment check: {
  hasSupabaseUrl: true,
  hasServiceRoleKey: true,
  serviceRoleKeyLength: 200+,
  ...
}
```

## Common Issues and Fixes

### 1. Server Not Restarted
**Problem**: Environment variables are only loaded when the server starts.

**Fix**:
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. Wrong File Location
**Problem**: `.env.local` must be in the root directory (same level as `package.json`).

**Fix**: Check the file location:
```
skillantra/
├── .env.local          ← Should be here
├── package.json
├── src/
└── ...
```

### 3. Wrong Variable Name
**Problem**: Typo in variable name.

**Fix**: Check your `.env.local` file has exactly:
```
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```
- No `NEXT_PUBLIC_` prefix (this is server-side only)
- No spaces around `=`
- No quotes

### 4. Whitespace Issues
**Problem**: Extra spaces or newlines in the value.

**Fix**: 
```
# ❌ Wrong:
SUPABASE_SERVICE_ROLE_KEY= eyJ...
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY=eyJ... 

# ✅ Correct:
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 5. Next.js Cache
**Problem**: Next.js cached the old environment.

**Fix**:
```bash
# Delete .next folder and restart
rm -rf .next
npm run dev
```

## Verify the Key

1. Go to Supabase Dashboard → Settings → API
2. Copy the **service_role** key (NOT anon key)
3. It should be a long JWT token starting with `eyJ`
4. Paste it into `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. Restart your dev server

## Test It

After fixing, try deleting your account again. Check the server console for the environment check log to see if the key is being detected.

