# Delete Account Troubleshooting

## Error: "Failed to initialize admin client"

This error occurs when the `SUPABASE_SERVICE_ROLE_KEY` environment variable is missing or not accessible.

### Solution Steps

1. **Verify `.env.local` file exists and contains the key:**
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
   - Make sure there are NO spaces around the `=` sign
   - Make sure there are NO quotes around the value
   - The key should start with `eyJ...` (it's a JWT token)

2. **Restart your development server:**
   - Stop the server (Ctrl+C)
   - Start it again: `npm run dev`
   - Environment variables are only loaded when the server starts

3. **Verify the key is correct:**
   - Go to Supabase Dashboard → Settings → API
   - Copy the "service_role" key (NOT the "anon" key)
   - It should be a long JWT token starting with `eyJ`

4. **Check for typos:**
   - Variable name must be exactly: `SUPABASE_SERVICE_ROLE_KEY`
   - Case-sensitive
   - No trailing spaces

5. **If using production:**
   - Make sure the environment variable is set in your hosting platform (Vercel, etc.)
   - Restart the deployment after adding the variable

### Common Issues

- **"Missing SUPABASE_SERVICE_ROLE_KEY"**: The key is not set in `.env.local`
- **"Failed to initialize admin client"**: The key is set but invalid or server wasn't restarted
- **Empty error object `{}`**: The error message isn't being passed correctly (should be fixed now)

### Testing

After fixing, try deleting your account again. You should now see:
- A specific error message if the key is missing
- Successful deletion if everything is configured correctly

