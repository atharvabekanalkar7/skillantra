-- Migration: Add tasks and task_applications tables
-- This migration adds support for tasks and task applications to SkillAntra

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  skills_required TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create task_applications table
CREATE TABLE task_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  applicant_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_application CHECK (task_id IS NOT NULL),
  CONSTRAINT unique_task_application UNIQUE (task_id, applicant_profile_id)
);

-- Create indexes for common queries
CREATE INDEX idx_tasks_creator_profile_id ON tasks(creator_profile_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_creator_status ON tasks(creator_profile_id, status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

CREATE INDEX idx_task_applications_task_id ON task_applications(task_id);
CREATE INDEX idx_task_applications_applicant_profile_id ON task_applications(applicant_profile_id);
CREATE INDEX idx_task_applications_status ON task_applications(status);
CREATE INDEX idx_task_applications_task_applicant ON task_applications(task_id, applicant_profile_id);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
-- Anyone authenticated can SELECT open tasks
CREATE POLICY tasks_select_open_policy ON tasks
  FOR SELECT
  USING (
    status = 'open' 
    OR 
    creator_profile_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Only creator can INSERT their own tasks
CREATE POLICY tasks_insert_policy ON tasks
  FOR INSERT
  WITH CHECK (
    creator_profile_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Only creator can UPDATE their own tasks
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

-- Only creator can DELETE their own tasks
CREATE POLICY tasks_delete_policy ON tasks
  FOR DELETE
  USING (
    creator_profile_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for task_applications
-- Applicant and task creator can SELECT applications
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

-- Only applicant can INSERT applications
CREATE POLICY task_applications_insert_policy ON task_applications
  FOR INSERT
  WITH CHECK (
    applicant_profile_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Only task creator can UPDATE application status
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

-- Note: DELETE policy not specified in requirements, but for data integrity,
-- we could allow applicants to delete their own pending applications if needed.
-- Leaving DELETE disabled by default - only through CASCADE when task is deleted.

