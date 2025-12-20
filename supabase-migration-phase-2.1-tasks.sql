-- ============================================
-- Phase 2.1: Tasks and Task Applications Schema
-- SkillAntra - Core Task and Application Database Schema
-- ============================================

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Create tasks table
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  skills_required TEXT,
  stipend_min INTEGER,
  stipend_max INTEGER,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Create task_applications table
-- ============================================
CREATE TABLE IF NOT EXISTS task_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  applicant_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_task_application UNIQUE (task_id, applicant_profile_id)
);

-- ============================================
-- Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tasks_creator_profile_id ON tasks(creator_profile_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_applications_task_id ON task_applications(task_id);
CREATE INDEX IF NOT EXISTS idx_task_applications_applicant_profile_id ON task_applications(applicant_profile_id);
CREATE INDEX IF NOT EXISTS idx_task_applications_status ON task_applications(status);
CREATE INDEX IF NOT EXISTS idx_task_applications_task_applicant ON task_applications(task_id, applicant_profile_id);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_applications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Drop existing policies if they exist (to avoid conflicts)
-- ============================================
DROP POLICY IF EXISTS tasks_select_policy ON tasks;
DROP POLICY IF EXISTS tasks_insert_policy ON tasks;
DROP POLICY IF EXISTS tasks_update_policy ON tasks;
DROP POLICY IF EXISTS tasks_delete_policy ON tasks;

DROP POLICY IF EXISTS task_applications_select_policy ON task_applications;
DROP POLICY IF EXISTS task_applications_insert_policy ON task_applications;
DROP POLICY IF EXISTS task_applications_update_policy ON task_applications;

-- ============================================
-- RLS Policies for tasks
-- ============================================

-- SELECT: Any authenticated user can view tasks
CREATE POLICY tasks_select_policy ON tasks
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT: Only the creator can insert tasks (creator_profile_id must match auth user's profile)
CREATE POLICY tasks_insert_policy ON tasks
  FOR INSERT
  WITH CHECK (
    creator_profile_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Only the task creator can update their tasks
CREATE POLICY tasks_update_policy ON tasks
  FOR UPDATE
  USING (
    creator_profile_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    creator_profile_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- DELETE: Only the task creator can delete their tasks
CREATE POLICY tasks_delete_policy ON tasks
  FOR DELETE
  USING (
    creator_profile_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- RLS Policies for task_applications
-- ============================================

-- INSERT: Only the applicant can insert applications (applicant_profile_id must match auth user's profile)
CREATE POLICY task_applications_insert_policy ON task_applications
  FOR INSERT
  WITH CHECK (
    applicant_profile_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- SELECT: Applicant OR task creator can view applications
CREATE POLICY task_applications_select_policy ON task_applications
  FOR SELECT
  USING (
    applicant_profile_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
    OR
    task_id IN (
      SELECT id FROM tasks WHERE creator_profile_id = (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- UPDATE: Only the task creator can update application status (for accept/reject)
CREATE POLICY task_applications_update_policy ON task_applications
  FOR UPDATE
  USING (
    task_id IN (
      SELECT id FROM tasks WHERE creator_profile_id = (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE creator_profile_id = (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- Migration Complete!
-- ============================================
-- Verify tables were created:
-- 1. Go to Supabase Dashboard → Table Editor
-- 2. You should see: tasks, task_applications
-- 3. Check that RLS is enabled on both tables
-- ============================================

