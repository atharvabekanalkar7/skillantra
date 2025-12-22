-- ============================================
-- SkillAntra Auth Fix Migration
-- Execute this in Supabase SQL Editor
-- ============================================

-- 1. Ensure profiles table exists with all required columns
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT,
  skills TEXT,
  college TEXT,
  user_type TEXT CHECK (user_type IN ('SkillSeeker', 'SkillHolder', 'Both')),
  phone_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS profiles_select_policy ON profiles;
DROP POLICY IF EXISTS profiles_insert_policy ON profiles;
DROP POLICY IF EXISTS profiles_update_policy ON profiles;
DROP POLICY IF EXISTS profiles_delete_policy ON profiles;

-- 4. Create RLS Policies
CREATE POLICY profiles_select_policy ON profiles
  FOR SELECT USING (true);

CREATE POLICY profiles_insert_policy ON profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY profiles_update_policy ON profiles
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY profiles_delete_policy ON profiles
  FOR DELETE USING (user_id = auth.uid());

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- 6. CRITICAL: Function to handle auth user deletion cascade
-- This ensures profiles are deleted when auth.users is deleted
CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
  -- When auth user is deleted (deleted_at is set), cascade delete profile
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    DELETE FROM profiles WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auth_user_deleted ON auth.users;

-- 8. Create trigger to watch for user deletions
CREATE TRIGGER trigger_auth_user_deleted
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
EXECUTE FUNCTION public.handle_auth_user_deleted();

-- 9. Function to auto-create profile on email confirmation
-- This handles the case where profile creation fails during signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_metadata JSONB;
  full_name TEXT;
  college TEXT;
BEGIN
  -- Only create profile if email is confirmed
  IF NEW.email_confirmed_at IS NOT NULL THEN
    user_metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    full_name := user_metadata->>'full_name';
    college := user_metadata->>'college';
    
    -- Only create if name exists in metadata
    IF full_name IS NOT NULL AND full_name != '' THEN
      INSERT INTO public.profiles (user_id, name, college)
      VALUES (NEW.id, full_name, college)
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_handle_new_user ON auth.users;

-- 11. Create trigger to auto-create profile on email confirmation
CREATE TRIGGER trigger_handle_new_user
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.handle_new_user();

-- 12. Verify email confirmation is enabled
-- NOTE: This is a reminder - you must manually enable in Supabase Dashboard:
-- Authentication → Providers → Email → Enable Email Confirmations = ON

-- ============================================
-- Migration Complete
-- ============================================
-- Next steps:
-- 1. Go to Supabase Dashboard → Authentication → Providers → Email
-- 2. Enable "Enable Email Confirmations" toggle
-- 3. Set Site URL to your production domain
-- 4. Add redirect URL: https://yourdomain.com/**
-- ============================================

