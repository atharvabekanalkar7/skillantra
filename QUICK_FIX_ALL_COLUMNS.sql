-- ============================================
-- Quick Fix: Add Missing Columns to Profiles Table
-- Run this in Supabase SQL Editor to fix all missing columns
-- ============================================

-- Add user_type column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT CHECK (user_type IN ('SkillSeeker', 'SkillHolder', 'Both'));

-- Add college column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS college TEXT;

-- Verify both columns were added
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('user_type', 'college')
ORDER BY column_name;

-- ============================================
-- If you see both columns in the results above, you're good!
-- Restart your Next.js server and try again.
-- ============================================

