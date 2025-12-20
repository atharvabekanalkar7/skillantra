# Quick Fix: Missing Columns (user_type and college)

## The Error
"Could not find the 'user_type' column" or "column profiles.college does not exist"

## Quick Fix - Add Both Columns

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** → **"New query"**

### Step 2: Run This SQL

Copy and paste this into the SQL Editor and click **"Run"**:

```sql
-- Add user_type column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT CHECK (user_type IN ('SkillSeeker', 'SkillHolder', 'Both'));

-- Add college column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS college TEXT;
```

### Step 3: Verify It Worked

Run this to verify both columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('user_type', 'college');
```

You should see both `user_type` and `college` columns listed.

### Step 4: Restart Your App

1. **Stop** your Next.js server (Ctrl+C)
2. **Start** it again: `npm run dev`
3. **Try again** - the error should be gone!

## Alternative: Use the Fix File

You can also use the `QUICK_FIX_ALL_COLUMNS.sql` file - it does the same thing with verification.

## Why This Happened

The migration's `DO $$ BEGIN ... END $$;` blocks sometimes don't execute properly in Supabase. Using `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` is more reliable and will work every time.

