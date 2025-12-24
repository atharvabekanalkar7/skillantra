-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT,
  skills TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create collaboration_requests table
CREATE TABLE collaboration_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT no_self_request CHECK (sender_id != receiver_id),
  CONSTRAINT unique_pending_request UNIQUE (sender_id, receiver_id) WHERE status = 'pending'
);

-- Create indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_collaboration_requests_sender_status ON collaboration_requests(sender_id, status);
CREATE INDEX idx_collaboration_requests_receiver_status ON collaboration_requests(receiver_id, status);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY profiles_select_policy ON profiles
  FOR SELECT
  USING (true); -- Anyone can read all profiles

CREATE POLICY profiles_insert_policy ON profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY profiles_update_policy ON profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY profiles_delete_policy ON profiles
  FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for collaboration_requests
CREATE POLICY requests_select_policy ON collaboration_requests
  FOR SELECT
  USING (
    sender_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
    OR
    receiver_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY requests_insert_policy ON collaboration_requests
  FOR INSERT
  WITH CHECK (
    sender_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY requests_update_policy ON collaboration_requests
  FOR UPDATE
  USING (
    receiver_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
    OR
    sender_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    receiver_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
    OR
    sender_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY requests_delete_policy ON collaboration_requests
  FOR DELETE
  USING (
    sender_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
    OR
    receiver_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

