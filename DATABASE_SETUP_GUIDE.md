# Database Setup Guide - SkillAntra

## Quick Setup Instructions

You need to run SQL migrations in your Supabase project to create the required database tables. Follow these steps:

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### Step 2: Run Migrations in Order

Run each SQL file **in this exact order**:

#### 1. Base Migration (Required)
**File: `supabase-migration.sql`**

This creates the core tables:
- `profiles` table
- `collaboration_requests` table
- Row-Level Security (RLS) policies
- Indexes

**Copy and paste the entire contents of `supabase-migration.sql` into the SQL Editor, then click "Run"**

#### 2. User Type Migration (Required)
**File: `supabase-migration-user-type.sql`**

This adds the `user_type` column to profiles.

**Copy and paste the entire contents of `supabase-migration-user-type.sql` into the SQL Editor, then click "Run"**

#### 3. College Migration (Required)
**File: `supabase-migration-college.sql`**

This adds the `college` column to profiles.

**Copy and paste the entire contents of `supabase-migration-college.sql` into the SQL Editor, then click "Run"**

#### 4. Profile Trigger Migration (Recommended)
**File: `supabase-migration-profile-trigger.sql`**

This creates a database trigger to automatically create profiles when users confirm their email.

**Copy and paste the entire contents of `supabase-migration-profile-trigger.sql` into the SQL Editor, then click "Run"**

#### 5. Tasks Migration (If using tasks feature)
**File: `supabase-migration-tasks.sql`**

This creates tables for tasks and applications (if you're using the tasks feature).

**Copy and paste the entire contents of `supabase-migration-tasks.sql` into the SQL Editor, then click "Run"**

### Step 3: Verify Tables Were Created

1. In Supabase dashboard, go to **"Table Editor"**
2. You should see these tables:
   - ✅ `profiles`
   - ✅ `collaboration_requests`
   - ✅ `tasks` (if you ran tasks migration)
   - ✅ `applications` (if you ran tasks migration)

### Step 4: Test the Application

1. Try signing up with a new account
2. The error should be gone
3. You should be able to create a profile

## Troubleshooting

### Error: "relation already exists"
- This means the table already exists
- You can skip that migration or drop the table first (be careful!)

### Error: "permission denied"
- Make sure you're running the SQL as the database owner
- Check that you have the correct permissions in Supabase

### Error: "column already exists"
- The column was already added
- You can skip that migration

### Still Getting "Database tables not initialized" Error?

1. **Check if tables exist:**
   - Go to Supabase → Table Editor
   - Verify `profiles` table exists

2. **Check RLS policies:**
   - Go to Supabase → Authentication → Policies
   - Verify policies are enabled for `profiles` table

3. **Verify your connection:**
   - Check your `.env.local` file has correct Supabase URL and keys
   - Restart your Next.js dev server after running migrations

4. **Clear browser cache:**
   - Sometimes cached errors persist
   - Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## Migration Files Summary

| File | Purpose | Required |
|------|---------|----------|
| `supabase-migration.sql` | Core tables and RLS | ✅ Yes |
| `supabase-migration-user-type.sql` | Add user_type column | ✅ Yes |
| `supabase-migration-college.sql` | Add college column | ✅ Yes |
| `supabase-migration-profile-trigger.sql` | Auto-create profiles | ⭐ Recommended |
| `supabase-migration-tasks.sql` | Tasks feature | ⚠️ Optional |

## Quick Copy-Paste Commands

If you want to run all migrations at once, you can combine them. However, it's recommended to run them one at a time to catch any errors.

## Need Help?

1. Check Supabase logs: Dashboard → Logs → Postgres Logs
2. Verify your Supabase project is active
3. Make sure you're using the correct project (check your `.env.local`)

After running all migrations, restart your Next.js development server and try again!

