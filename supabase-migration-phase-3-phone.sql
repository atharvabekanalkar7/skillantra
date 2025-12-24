-- ============================================
-- Phase 3: Add phone_number column to profiles
-- Run this file in Supabase SQL Editor
-- ============================================

-- Add phone_number column to profiles table (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add a check constraint for phone number format (10-15 digits, numeric only)
-- Note: This allows NULL values (phone number is optional but required for tasks)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_phone_number_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_phone_number_check 
  CHECK (phone_number IS NULL OR (phone_number ~ '^[0-9]{10,15}$'));

-- ============================================
-- Migration Complete!
-- ============================================


