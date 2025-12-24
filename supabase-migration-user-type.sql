-- Migration: Add user_type column to profiles table
-- This migration adds the "I am a" field to user profiles

-- Add user_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'user_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN user_type TEXT CHECK (user_type IN ('SkillSeeker', 'SkillHolder', 'Both'));
  END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN profiles.user_type IS 'User type: SkillSeeker, SkillHolder, or Both';

