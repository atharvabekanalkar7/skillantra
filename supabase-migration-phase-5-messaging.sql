-- ============================================
-- Phase 5: Complete Messaging System Database Migration
-- Run this file in Supabase SQL Editor
-- ============================================

-- Step 1: Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent multiple conversations for the same applicant and task
  CONSTRAINT unique_applicant_task_conversation UNIQUE (task_id, applicant_id)
);

-- Step 2: Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Create Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_conversations_task_id ON conversations(task_id);
CREATE INDEX IF NOT EXISTS idx_conversations_applicant_id ON conversations(applicant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_creator_id ON conversations(creator_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);


-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for conversations
-- ============================================

-- SELECT: A user can see conversations if they are the applicant OR the creator
CREATE POLICY conversations_select_policy ON conversations
  FOR SELECT
  USING (
    applicant_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    creator_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- INSERT: Only an applicant can start a conversation (by sending a collaboration request)
CREATE POLICY conversations_insert_policy ON conversations
  FOR INSERT
  WITH CHECK (
    applicant_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- UPDATE: Only the creator of the task can update the status (e.g. pending -> active/rejected)
CREATE POLICY conversations_update_policy ON conversations
  FOR UPDATE
  USING (
    creator_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    creator_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- DELETE: Generally disabled, or only creator, but keeping simple for now. (Relying on ON DELETE CASCADE from tasks)
CREATE POLICY conversations_delete_policy ON conversations
  FOR DELETE
  USING (
    creator_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================
-- RLS Policies for messages
-- ============================================

-- SELECT: A user can view messages if they are part of the parent conversation
CREATE POLICY messages_select_policy ON messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE applicant_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
         OR creator_id   = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- INSERT: A user can insert a message if they are the sender AND part of the conversation.
-- NOTE: The complex business logic (e.g., blocking applicants if status is pending or rejected) 
-- is enforced at the Next.js API route layer for finer control and better error messaging.
CREATE POLICY messages_insert_policy ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) AND
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE applicant_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
         OR creator_id   = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- UPDATE/DELETE: Messages are immutable
-- No policies provided for UPDATE/DELETE on messages.
