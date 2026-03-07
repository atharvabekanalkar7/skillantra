-- Run this in your Supabase SQL editor to add the `is_read` column for message read receipts.
-- Remember to also ensure Realtime Replication is active for 'dm_conversations' and 'dm_messages'.

ALTER TABLE public.dm_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
