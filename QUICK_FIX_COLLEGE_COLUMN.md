# Quick Fix: College Column Missing

## The Error
"column profiles.college does not exist"

## Quick Fix

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** → **"New query"**

### Step 2: Run This SQL

Copy and paste this into the SQL Editor and click **"Run"**:

```sql
-- Add college column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS college TEXT;
```

That's it! The column will be added.

### Step 3: Verify It Worked

Run this to verify:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'college';
```

You should see the `college` column listed.

### Step 4: Restart Your App

1. Stop your Next.js server (Ctrl+C)
2. Start it again: `npm run dev`
3. Try again - the error should be gone!

## Alternative: Use the Fix File

You can also use the `fix-college-column.sql` file I created - it does the same thing with more checks.


