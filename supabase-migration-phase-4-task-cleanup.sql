-- ============================================
-- Phase 4: Automated Task Cleanup (Cron Job)
-- SkillAntra - Production Task Auto-Deletion
-- ============================================
-- Objective: Delete tasks older than 7 days automatically.
-- NOTE: Due to task_applications.task_id referencing tasks(id)
-- with 'ON DELETE CASCADE', deleting a task safely removes all
-- applications without creating orphaned records.

-- Enable pg_cron extension (Superuser/Dashboard privileges may be required)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- Create the Cleanup Function
-- ============================================
-- The function uses SECURITY DEFINER to execute with the permissions 
-- of the creator (bypassing restrictive RLS policies for background tasks)
CREATE OR REPLACE FUNCTION delete_expired_tasks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Hard delete tasks older than 7 days from their creation timestamp.
  -- This triggers ON DELETE CASCADE for all linked task_applications.
  WITH deleted AS (
    DELETE FROM tasks
    WHERE created_at < NOW() - INTERVAL '7 days'
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted;

  -- Optional: Log the deletion event (if a logs table exists),
  -- or simply return the count for debugging.
  RAISE NOTICE 'Deleted % expired tasks', deleted_count;
  
  RETURN deleted_count;
END;
$$;

-- ============================================
-- Schedule the Cleanup Job
-- ============================================
-- Execute the function automatically using pg_cron.
-- Schedule format: '0 * * * *' (At minute 0 of every hour)
SELECT cron.schedule(
  'cleanup-expired-tasks-hourly', -- Unique job name
  '0 * * * *',                    -- Cron schedule string (hourly)
  'SELECT delete_expired_tasks();' -- SQL to execute
);

-- Note:
-- If you need to unschedule the job in the future:
-- SELECT cron.unschedule('cleanup-expired-tasks-hourly');
