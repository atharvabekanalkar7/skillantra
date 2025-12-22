# Environment Variables Troubleshooting

If you're seeing "supabaseKey is required" error, follow these steps:

## 1. Verify .env.local File

Make sure your `.env.local` file exists in the **root directory** (same level as `package.json`) and contains:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Important:**
- No quotes around values
- No spaces around the `=` sign
- No trailing spaces
- Each variable on its own line

## 2. Restart Development Server

**CRITICAL:** After adding or modifying `.env.local`, you MUST restart your Next.js development server:

1. Stop the server (Ctrl+C)
2. Start it again: `npm run dev`

Environment variables are only loaded when the server starts.

## 3. Verify Variables Are Loaded

To check if variables are being loaded, temporarily add this to any page:

```typescript
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
```

**Note:** Only `NEXT_PUBLIC_*` variables are available in the browser. Server-side variables (without `NEXT_PUBLIC_`) are only available in API routes and server components.

## 4. Check File Location

Your `.env.local` file should be in:
```
skillantra/
  ├── .env.local          ← HERE
  ├── package.json
  ├── next.config.ts
  └── src/
```

## 5. Common Issues

### Issue: Variables are undefined
**Solution:** Restart dev server after creating/modifying `.env.local`

### Issue: "supabaseKey is required" error
**Solution:** 
1. Check variable names are exactly: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Check there are no typos
3. Restart dev server
4. Clear browser cache and hard refresh (Ctrl+Shift+R)

### Issue: Variables work in server but not client
**Solution:** Make sure variable names start with `NEXT_PUBLIC_` for client-side access

### Issue: Still not working after restart
**Solution:**
1. Delete `.next` folder: `rm -rf .next` (or delete it manually)
2. Restart dev server: `npm run dev`
3. Check browser console for any errors

## 6. Get Your Supabase Keys

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## 7. Production Deployment

For production (Vercel, etc.):
- Add environment variables in your hosting platform's dashboard
- Use the same variable names
- Restart/redeploy after adding variables

