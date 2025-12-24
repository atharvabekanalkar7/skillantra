-- ============================================
-- SkillAntra Complete Database Migration
-- Run this file in Supabase SQL Editor
-- ============================================

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT,
  skills TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Add user_type column to profiles (if not exists)
-- Using direct ALTER TABLE for reliability
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT CHECK (user_type IN ('SkillSeeker', 'SkillHolder', 'Both'));

-- Step 4: Add college column to profiles (if not exists)
-- Using direct ALTER TABLE for reliability
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS college TEXT;

-- Step 5: Create collaboration_requests table
CREATE TABLE IF NOT EXISTS collaboration_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT no_self_request CHECK (sender_id != receiver_id),
  CONSTRAINT unique_pending_request UNIQUE (sender_id, receiver_id) WHERE status = 'pending'
);

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_requests_sender_status ON collaboration_requests(sender_id, status);
CREATE INDEX IF NOT EXISTS idx_collaboration_requests_receiver_status ON collaboration_requests(receiver_id, status);

-- Step 7: Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_requests ENABLE ROW LEVEL SECURITY;

-- Step 8: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS profiles_select_policy ON profiles;
DROP POLICY IF EXISTS profiles_insert_policy ON profiles;
DROP POLICY IF EXISTS profiles_update_policy ON profiles;
DROP POLICY IF EXISTS profiles_delete_policy ON profiles;

DROP POLICY IF EXISTS requests_select_policy ON collaboration_requests;
DROP POLICY IF EXISTS requests_insert_policy ON collaboration_requests;
DROP POLICY IF EXISTS requests_update_policy ON collaboration_requests;
DROP POLICY IF EXISTS requests_delete_policy ON collaboration_requests;

-- Step 9: Create RLS Policies for profiles
CREATE POLICY profiles_select_policy ON profiles
  FOR SELECT
  USING (true); -- Anyone can read all profiles

CREATE POLICY profiles_insert_policy ON profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY profiles_update_policy ON profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY profiles_delete_policy ON profiles
  FOR DELETE
  USING (user_id = auth.uid());

-- Step 10: Create RLS Policies for collaboration_requests
CREATE POLICY requests_select_policy ON collaboration_requests
  FOR SELECT
  USING (
    sender_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
    OR
    receiver_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY requests_insert_policy ON collaboration_requests
  FOR INSERT
  WITH CHECK (
    sender_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY requests_update_policy ON collaboration_requests
  FOR UPDATE
  USING (
    receiver_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
    OR
    sender_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    receiver_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
    OR
    sender_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY requests_delete_policy ON collaboration_requests
  FOR DELETE
  USING (
    sender_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
    OR
    receiver_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Step 11: Create function to auto-create profile from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    -- Create profile with data from user metadata
    INSERT INTO public.profiles (user_id, name, college)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
      COALESCE(NEW.raw_user_meta_data->>'college', NULL)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 13: Create triggers for automatic profile creation
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Migration Complete!
-- ============================================
-- Verify tables were created:
-- 1. Go to Supabase Dashboard → Table Editor
-- 2. You should see: profiles, collaboration_requests
-- 3. Try signing up - the error should be gone!
-- ============================================

