-- ============================================
-- Phase 7: Profile Completion Enforcement
-- Run this file in Supabase SQL Editor
-- ============================================

-- Step 1: Add new boolean column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT false;

-- Step 2: Backfill existing complete profiles
-- A profile is deemed complete if it has a non-empty name, phone_number, and user_type.
UPDATE profiles
SET is_profile_complete = true
WHERE name IS NOT NULL AND name != ''
  AND phone_number IS NOT NULL AND phone_number != ''
  AND user_type IS NOT NULL;
