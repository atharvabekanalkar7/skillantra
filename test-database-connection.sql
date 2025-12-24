-- ============================================
-- Test Database Connection and Tables
-- Run this in Supabase SQL Editor to verify tables exist
-- ============================================

-- Test 1: Check if profiles table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles'
    ) 
    THEN '✅ profiles table EXISTS'
    ELSE '❌ profiles table DOES NOT EXIST'
  END AS profiles_table_status;

-- Test 2: Check if collaboration_requests table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'collaboration_requests'
    ) 
    THEN '✅ collaboration_requests table EXISTS'
    ELSE '❌ collaboration_requests table DOES NOT EXIST'
  END AS collaboration_requests_table_status;

-- Test 3: Check profiles table columns
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Test 4: Check if RLS is enabled on profiles
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- Test 5: Check if policies exist
SELECT 
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- Test 6: Try a simple SELECT (should work if everything is set up)
SELECT COUNT(*) as profile_count FROM profiles;

-- ============================================
-- If you see errors, run supabase-migration-complete.sql
-- ============================================


