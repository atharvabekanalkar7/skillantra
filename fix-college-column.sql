-- ============================================
-- Fix: Add college column to profiles table
-- Run this in Supabase SQL Editor if you get "column profiles.college does not exist"
-- ============================================

-- Add college column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'college'
  ) THEN
    ALTER TABLE profiles ADD COLUMN college TEXT;
    RAISE NOTICE 'College column added successfully';
  ELSE
    RAISE NOTICE 'College column already exists';
  END IF;
END $$;

-- Verify the column was added
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'college';

-- ============================================
-- If you see the college column in the results above, you're good!
-- ============================================


