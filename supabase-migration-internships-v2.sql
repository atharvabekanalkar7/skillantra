-- ============================================
-- Internships V2 — Full Internshala-Style Schema
-- SkillAntra MVP
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ALTER internships table — add new columns
-- ============================================

-- Add new columns (safe idempotent adds)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internships' AND column_name='title') THEN
    ALTER TABLE internships ADD COLUMN title TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internships' AND column_name='location') THEN
    ALTER TABLE internships ADD COLUMN location TEXT DEFAULT 'Remote';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internships' AND column_name='start_date') THEN
    ALTER TABLE internships ADD COLUMN start_date TEXT DEFAULT 'Immediately';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internships' AND column_name='duration_months') THEN
    ALTER TABLE internships ADD COLUMN duration_months INTEGER DEFAULT 3;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internships' AND column_name='stipend_min') THEN
    ALTER TABLE internships ADD COLUMN stipend_min INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internships' AND column_name='stipend_max') THEN
    ALTER TABLE internships ADD COLUMN stipend_max INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internships' AND column_name='is_unpaid') THEN
    ALTER TABLE internships ADD COLUMN is_unpaid BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internships' AND column_name='about_internship') THEN
    ALTER TABLE internships ADD COLUMN about_internship TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internships' AND column_name='who_can_apply') THEN
    ALTER TABLE internships ADD COLUMN who_can_apply TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internships' AND column_name='perks') THEN
    ALTER TABLE internships ADD COLUMN perks TEXT[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internships' AND column_name='is_linkedin_mandatory') THEN
    ALTER TABLE internships ADD COLUMN is_linkedin_mandatory BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internships' AND column_name='number_of_openings') THEN
    ALTER TABLE internships ADD COLUMN number_of_openings INTEGER DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internships' AND column_name='apply_by') THEN
    ALTER TABLE internships ADD COLUMN apply_by TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internships' AND column_name='recruiter_id') THEN
    ALTER TABLE internships ADD COLUMN recruiter_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Migrate old data if any rows exist (copy role_title → title, created_by → recruiter_id, etc.)
UPDATE internships SET title = role_title WHERE title IS NULL AND role_title IS NOT NULL;
UPDATE internships SET recruiter_id = created_by WHERE recruiter_id IS NULL AND created_by IS NOT NULL;
UPDATE internships SET about_internship = description WHERE about_internship IS NULL AND description IS NOT NULL;
UPDATE internships SET apply_by = apply_by_date WHERE apply_by IS NULL AND apply_by_date IS NOT NULL;
UPDATE internships SET number_of_openings = seats WHERE number_of_openings IS NULL OR number_of_openings = 1;

-- Drop old status constraint and add new one
DO $$
DECLARE
  con_name text;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'internships'::regclass
    AND pg_get_constraintdef(oid) LIKE '%status%';
  IF con_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE internships DROP CONSTRAINT ' || quote_ident(con_name);
  END IF;
END $$;

ALTER TABLE internships ADD CONSTRAINT internships_status_check
  CHECK (status IN ('pending_approval', 'approved', 'rejected', 'closed', 'expired', 'open'));

-- ============================================
-- 2. internship_questions table
-- ============================================
CREATE TABLE IF NOT EXISTS internship_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('short_text', 'long_text', 'yes_no', 'file_upload')),
  is_required BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_internship_questions_internship ON internship_questions(internship_id);

-- ============================================
-- 3. internship_applications table
-- ============================================
CREATE TABLE IF NOT EXISTS internship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resume_url TEXT,
  skillantra_resume_id UUID,
  linkedin_url TEXT,
  cover_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  applied_at TIMESTAMPTZ DEFAULT now(),
  offer_letter_url TEXT,
  completion_letter_url TEXT,
  offer_letter_reminder_sent BOOLEAN DEFAULT false
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_internship_application
  ON internship_applications(internship_id, student_id);
CREATE INDEX IF NOT EXISTS idx_internship_applications_internship ON internship_applications(internship_id);
CREATE INDEX IF NOT EXISTS idx_internship_applications_student ON internship_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_internship_applications_applied_at ON internship_applications(applied_at DESC);

-- ============================================
-- 4. internship_application_answers table
-- ============================================
CREATE TABLE IF NOT EXISTS internship_application_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES internship_applications(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES internship_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  file_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_application_answers_application ON internship_application_answers(application_id);

-- ============================================
-- 5. skillantra_resumes table
-- ============================================
CREATE TABLE IF NOT EXISTS skillantra_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  career_objective TEXT,
  education JSONB DEFAULT '[]'::jsonb,
  work_experience JSONB DEFAULT '[]'::jsonb,
  extra_curricular JSONB DEFAULT '[]'::jsonb,
  trainings_courses JSONB DEFAULT '[]'::jsonb,
  academic_projects JSONB DEFAULT '[]'::jsonb,
  skills TEXT[] DEFAULT '{}',
  portfolio_links JSONB DEFAULT '[]'::jsonb,
  accomplishments TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skillantra_resumes_student ON skillantra_resumes(student_id);

-- ============================================
-- 6. notifications table
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- RLS Policies
-- ============================================

-- internship_questions: anyone can read for approved internships, creator can manage
ALTER TABLE internship_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS iq_select_policy ON internship_questions;
CREATE POLICY iq_select_policy ON internship_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS iq_insert_policy ON internship_questions;
CREATE POLICY iq_insert_policy ON internship_questions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM internships i
    WHERE i.id = internship_id
    AND i.recruiter_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS iq_update_policy ON internship_questions;
CREATE POLICY iq_update_policy ON internship_questions FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM internships i
    WHERE i.id = internship_id
    AND i.recruiter_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS iq_delete_policy ON internship_questions;
CREATE POLICY iq_delete_policy ON internship_questions FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM internships i
    WHERE i.id = internship_id
    AND i.recruiter_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- internship_applications: student sees own, recruiter sees for own internships
ALTER TABLE internship_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ia_select_policy ON internship_applications;
CREATE POLICY ia_select_policy ON internship_applications FOR SELECT USING (
  student_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM internships i
    WHERE i.id = internship_id
    AND i.recruiter_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS ia_insert_policy ON internship_applications;
CREATE POLICY ia_insert_policy ON internship_applications FOR INSERT WITH CHECK (
  student_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS ia_update_policy ON internship_applications;
CREATE POLICY ia_update_policy ON internship_applications FOR UPDATE USING (
  student_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM internships i
    WHERE i.id = internship_id
    AND i.recruiter_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- internship_application_answers
ALTER TABLE internship_application_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS iaa_select_policy ON internship_application_answers;
CREATE POLICY iaa_select_policy ON internship_application_answers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM internship_applications ia
    WHERE ia.id = application_id
    AND (
      ia.student_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM internships i
        WHERE i.id = ia.internship_id
        AND i.recruiter_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
      )
    )
  )
);

DROP POLICY IF EXISTS iaa_insert_policy ON internship_application_answers;
CREATE POLICY iaa_insert_policy ON internship_application_answers FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM internship_applications ia
    WHERE ia.id = application_id
    AND ia.student_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- skillantra_resumes: student sees/edits own
ALTER TABLE skillantra_resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sr_select_policy ON skillantra_resumes;
CREATE POLICY sr_select_policy ON skillantra_resumes FOR SELECT USING (
  student_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS sr_insert_policy ON skillantra_resumes;
CREATE POLICY sr_insert_policy ON skillantra_resumes FOR INSERT WITH CHECK (
  student_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS sr_update_policy ON skillantra_resumes;
CREATE POLICY sr_update_policy ON skillantra_resumes FOR UPDATE USING (
  student_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- notifications: user sees own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notif_select_policy ON notifications;
CREATE POLICY notif_select_policy ON notifications FOR SELECT USING (
  user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS notif_insert_policy ON notifications;
CREATE POLICY notif_insert_policy ON notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS notif_update_policy ON notifications;
CREATE POLICY notif_update_policy ON notifications FOR UPDATE USING (
  user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Update internships RLS to use new status values
DROP POLICY IF EXISTS internships_select_policy ON internships;
CREATE POLICY internships_select_policy ON internships
  FOR SELECT USING (
    status IN ('approved', 'open')
    OR recruiter_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================
-- Migration Complete!
-- ============================================
