-- ============================================
-- Phase 6: User-to-User Direct Messaging System
-- Run this file in Supabase SQL Editor
-- ============================================

-- Step 1: Drop old legacy explicit collaboration tables if they exist
-- (Dropping them cleans up the state. Tasks still hold applications via task_applications)
DROP TABLE IF EXISTS collaboration_requests CASCADE;
-- We'll leave the phase 5 "conversations" table for now just to avoid breaking the UI right this second, 
-- but in a real drop we might drop it. We'll just transition the code to use dm_conversations.

-- Step 2: Create dm_conversations table
CREATE TABLE IF NOT EXISTS dm_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ignored')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unread_count_sender INTEGER NOT NULL DEFAULT 0,
  unread_count_receiver INTEGER NOT NULL DEFAULT 1,
  
  -- Enforce only ONE conversation between any two given users, regardless of who initiated
  CONSTRAINT unique_dm_conversation 
    UNIQUE (
      LEAST(sender_profile_id, receiver_profile_id), 
      GREATEST(sender_profile_id, receiver_profile_id)
    ),
  
  -- Users cannot message themselves
  CONSTRAINT no_self_messaging CHECK (sender_profile_id != receiver_profile_id)
);

-- Step 3: Create dm_messages table
CREATE TABLE IF NOT EXISTS dm_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  sender_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 4: Create Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_dm_conv_sender ON dm_conversations(sender_profile_id);
CREATE INDEX IF NOT EXISTS idx_dm_conv_receiver ON dm_conversations(receiver_profile_id);
CREATE INDEX IF NOT EXISTS idx_dm_conv_status ON dm_conversations(status);
CREATE INDEX IF NOT EXISTS idx_dm_conv_last_message ON dm_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_msg_conversation ON dm_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_dm_msg_created_at ON dm_messages(created_at ASC);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for dm_conversations
-- ============================================

-- SELECT: A user can see conversations if they are the sender OR the receiver
CREATE POLICY dm_conversations_select_policy ON dm_conversations
  FOR SELECT
  USING (
    sender_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    receiver_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- INSERT: Only a valid sender can start a conversation
CREATE POLICY dm_conversations_insert_policy ON dm_conversations
  FOR INSERT
  WITH CHECK (
    sender_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- UPDATE: Either party can update the conversation (e.g., status, unread_counts, last_message_at)
CREATE POLICY dm_conversations_update_policy ON dm_conversations
  FOR UPDATE
  USING (
    sender_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    receiver_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    sender_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    receiver_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- DELETE: Generally relying on ON DELETE CASCADE from profiles, but allowed for participants if needed
CREATE POLICY dm_conversations_delete_policy ON dm_conversations
  FOR DELETE
  USING (
    sender_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    receiver_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================
-- RLS Policies for dm_messages
-- ============================================

-- SELECT: A user can view messages if they are part of the parent conversation
CREATE POLICY dm_messages_select_policy ON dm_messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM dm_conversations 
      WHERE sender_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
         OR receiver_profile_id   = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- INSERT: A user can insert a message if they are the true sender AND part of the conversation.
CREATE POLICY dm_messages_insert_policy ON dm_messages
  FOR INSERT
  WITH CHECK (
    sender_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) AND
    conversation_id IN (
      SELECT id FROM dm_conversations 
      WHERE sender_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
         OR receiver_profile_id   = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );
