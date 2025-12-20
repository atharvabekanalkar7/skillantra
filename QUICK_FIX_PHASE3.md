# Quick Fix for Phase 3 Issues

## Issue 1: "Could not find the 'phone_number' column"

**Solution:** Run the migration to add the phone_number column.

### Steps:
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the entire contents of `supabase-migration-phase-3-phone.sql`
4. Click "Run"
5. You should see: "Success. No rows returned"

### Verify:
- Go to Table Editor → profiles table
- You should see a `phone_number` column (TEXT type, nullable)

---

## Issue 2: "Profile not found. Please create your profile first"

This happens when:
- You're logged in but haven't created a profile yet
- The profile lookup is failing

### Solution:
1. Make sure you're logged in
2. Go to `/profile/edit` or `/settings`
3. Fill out and save your profile
4. Try applying to tasks again

---

## If issues persist:

1. **Check if profile exists:**
   - Go to Supabase Dashboard → Table Editor → profiles
   - Look for a row with your `user_id` (from auth.users table)

2. **Check authentication:**
   - Make sure you're logged in
   - Check browser console for auth errors

3. **Run complete migration:**
   - If profiles table doesn't exist, run `supabase-migration-complete.sql` first
   - Then run `supabase-migration-phase-3-phone.sql`

---

## Migration File Location:
- `supabase-migration-phase-3-phone.sql` (in project root)

