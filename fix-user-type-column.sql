-- ============================================
-- Fix: Add user_type column to profiles table
-- Run this in Supabase SQL Editor if you get "Could not find the 'user_type' column"
-- ============================================

-- Add user_type column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT CHECK (user_type IN ('SkillSeeker', 'SkillHolder', 'Both'));

-- Verify the column was added
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'user_type';

-- ============================================
-- If you see the user_type column in the results above, you're good!
-- ============================================

