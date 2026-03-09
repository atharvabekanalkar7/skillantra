-- Add is_resume_public column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_resume_public BOOLEAN DEFAULT true;
