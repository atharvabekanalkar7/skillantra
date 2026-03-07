-- ============================================
-- Internships Feature Schema Migration
-- SkillAntra - Internships and Applications updates
-- ============================================

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Update profiles table
-- ============================================

-- 1. Safely update the user_type check constraint to include 'recruiter'
DO $$
DECLARE
    con_name text;
BEGIN
    SELECT conname INTO con_name
    FROM pg_constraint
    WHERE conrelid = 'profiles'::regclass
      AND pg_get_constraintdef(oid) LIKE '%user_type%';
      
    IF con_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT ' || quote_ident(con_name);
    END IF;
END $$;

ALTER TABLE profiles ADD CONSTRAINT profiles_user_type_check 
  CHECK (user_type IN ('SkillSeeker', 'SkillHolder', 'Both', 'recruiter'));

-- 2. Add is_verified boolean
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 3. Add company details
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_name') THEN
    ALTER TABLE profiles ADD COLUMN company_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_website') THEN
    ALTER TABLE profiles ADD COLUMN company_website TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_logo_url') THEN
    ALTER TABLE profiles ADD COLUMN company_logo_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'designation') THEN
    ALTER TABLE profiles ADD COLUMN designation TEXT;
  END IF;
END $$;

-- ============================================
-- Create internships table
-- ============================================
CREATE TABLE IF NOT EXISTS internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  role_title TEXT NOT NULL,
  description TEXT NOT NULL,
  skills_required TEXT[] DEFAULT '{}',
  duration_weeks INTEGER NOT NULL,
  stipend_amount INTEGER NOT NULL,
  work_mode TEXT CHECK (work_mode IN ('remote', 'hybrid', 'onsite')) DEFAULT 'remote',
  apply_by_date TIMESTAMPTZ,
  seats INTEGER DEFAULT 1,
  status TEXT CHECK (status IN ('open', 'closed', 'filled')) DEFAULT 'open',
  is_cross_campus BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Update task_applications table
-- ============================================

-- Drop NOT NULL on task_id to allow for internship applications
ALTER TABLE task_applications ALTER COLUMN task_id DROP NOT NULL;

-- Remove old unique constraint that forces task_id
ALTER TABLE task_applications DROP CONSTRAINT IF EXISTS unique_task_application;

-- Safely add new columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_applications' AND column_name = 'payment_status') THEN
    ALTER TABLE task_applications ADD COLUMN payment_status TEXT CHECK (payment_status IN ('unpaid', 'paid')) DEFAULT 'unpaid';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_applications' AND column_name = 'razorpay_order_id') THEN
    ALTER TABLE task_applications ADD COLUMN razorpay_order_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_applications' AND column_name = 'internship_id') THEN
    ALTER TABLE task_applications ADD COLUMN internship_id UUID REFERENCES internships(id);
  END IF;
END $$;

-- Replace the old constraint with partial unique indexes to support both tasks and internships
CREATE UNIQUE INDEX IF NOT EXISTS unique_task_application_idx ON task_applications (task_id, applicant_profile_id) WHERE task_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unique_internship_application_idx ON task_applications (internship_id, applicant_profile_id) WHERE internship_id IS NOT NULL;

-- ============================================
-- Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_internships_created_by ON internships(created_by);
CREATE INDEX IF NOT EXISTS idx_internships_status ON internships(status);
CREATE INDEX IF NOT EXISTS idx_internships_created_at ON internships(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_applications_internship_id ON task_applications(internship_id);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for internships
-- ============================================

DROP POLICY IF EXISTS internships_select_policy ON internships;
DROP POLICY IF EXISTS internships_insert_policy ON internships;
DROP POLICY IF EXISTS internships_update_policy ON internships;
DROP POLICY IF EXISTS internships_delete_policy ON internships;

-- SELECT: Anyone can read open internships, and creators can read all their own internships
CREATE POLICY internships_select_policy ON internships
  FOR SELECT
  USING (
    status = 'open' 
    OR 
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- INSERT: Only verified recruiters can insert
CREATE POLICY internships_insert_policy ON internships
  FOR INSERT
  WITH CHECK (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()) 
    AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND is_verified = true 
      AND user_type = 'recruiter'
    )
  );

-- UPDATE: Only the recruiter who created it can update it
CREATE POLICY internships_update_policy ON internships
  FOR UPDATE
  USING (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- DELETE: Only the recruiter who created it can delete it
CREATE POLICY internships_delete_policy ON internships
  FOR DELETE
  USING (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================
-- Migration Complete!
-- ============================================
