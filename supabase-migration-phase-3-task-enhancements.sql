-- ============================================
-- Phase 3: Structured Task Enhancements
-- SkillAntra - Payment, Deadline, Mode of Work, Attachments
-- ============================================

-- ============================================
-- 1. Add payment_type column
-- ============================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS payment_type TEXT CHECK (payment_type IN ('stipend', 'other'));

-- ============================================
-- 2. Add payment_other_details column
-- (Text description when payment_type = 'other')
-- ============================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS payment_other_details TEXT;

-- ============================================
-- 3. Add application_deadline column
-- (Deadline for accepting applications)
-- ============================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMPTZ;

-- ============================================
-- 4. Add mode_of_work column
-- ============================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS mode_of_work TEXT CHECK (mode_of_work IN ('remote', 'hybrid', 'in-person'));

-- ============================================
-- 5. Add attachments column (JSONB array)
-- Each element: { "category": "GitHub", "link": "https://..." }
-- ============================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- 6. Add check constraint for payment consistency
-- If payment_type is 'other', stipend fields should be null
-- If payment_type is 'stipend', payment_other_details should be null
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_payment_consistency'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT check_payment_consistency CHECK (
      (payment_type IS NULL) OR
      (payment_type = 'stipend' AND payment_other_details IS NULL) OR
      (payment_type = 'other' AND stipend_min IS NULL AND stipend_max IS NULL)
    );
  END IF;
END $$;

-- ============================================
-- 7. Add index on application_deadline for filtering
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tasks_application_deadline ON tasks(application_deadline);

-- ============================================
-- 8. Add index on mode_of_work for future filtering
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tasks_mode_of_work ON tasks(mode_of_work);

-- ============================================
-- Migration Complete!
-- ============================================
-- New columns added to tasks table:
--   payment_type TEXT ('stipend' | 'other')
--   payment_other_details TEXT
--   application_deadline TIMESTAMPTZ
--   mode_of_work TEXT ('remote' | 'hybrid' | 'in-person')
--   attachments JSONB (default '[]')
--
-- Verify:
-- 1. Go to Supabase Dashboard → Table Editor → tasks
-- 2. Confirm 5 new columns are visible
-- 3. Test inserting a row with payment_type='other' and stipend_min set → should fail
-- ============================================
