-- Add college column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS college TEXT;

-- Make college NOT NULL for new profiles (but allow NULL for existing ones temporarily)
-- We'll enforce NOT NULL in application logic for new signups

