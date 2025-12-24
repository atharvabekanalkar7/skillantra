-- ============================================
-- SkillAntra: Create All Required Triggers
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Function: Auto-create profile on email confirmation
-- ============================================
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
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Function: Cascade delete profile on user deletion
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
  -- When auth user is deleted (deleted_at is set), cascade delete profile
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    DELETE FROM public.profiles WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. Drop existing triggers (if any) to avoid conflicts
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_auth_user_deleted ON auth.users;
DROP TRIGGER IF EXISTS trigger_handle_new_user ON auth.users;

-- ============================================
-- 4. Create Trigger: Profile creation on email confirmation
-- ============================================
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. Create Trigger: Profile creation on user insert (if already confirmed)
-- ============================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 6. Create Trigger: Cascade delete profile on user deletion
-- ============================================
CREATE TRIGGER trigger_auth_user_deleted
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
  EXECUTE FUNCTION public.handle_auth_user_deleted();

-- ============================================
-- Verification
-- ============================================
-- To verify triggers were created, run:
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_schema = 'auth' AND event_object_table = 'users';

-- Expected triggers:
-- 1. on_auth_user_confirmed (UPDATE on email_confirmed_at)
-- 2. on_auth_user_created (INSERT)
-- 3. trigger_auth_user_deleted (UPDATE on deleted_at)

-- ============================================
-- Migration Complete!
-- ============================================

