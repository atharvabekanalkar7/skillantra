-- ============================================
-- Migration: Collaboration Posts and Requests Schema
-- ============================================

-- ============================================
-- Create collaboration_posts table
-- ============================================
CREATE TABLE IF NOT EXISTS collaboration_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  collab_type TEXT NOT NULL CHECK (collab_type IN ('one_on_one', 'team')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  skills_needed TEXT[] DEFAULT '{}',
  campus TEXT DEFAULT 'iitmandi',
  is_cross_campus BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  
  -- team-only fields (nullable for one_on_one):
  event_name TEXT,
  event_type TEXT CHECK (event_type IN ('hackathon', 'case_comp', 'research', 'startup', 'other')),
  event_date TIMESTAMPTZ,
  team_size_needed INTEGER,
  roles_needed TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Create collaboration_requests table
-- ============================================
CREATE TABLE IF NOT EXISTS collaboration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES collaboration_posts(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_collaboration_request UNIQUE (post_id, requester_id)
);

-- ============================================
-- Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_collaboration_posts_created_by ON collaboration_posts(created_by);
CREATE INDEX IF NOT EXISTS idx_collaboration_posts_status ON collaboration_posts(status);
CREATE INDEX IF NOT EXISTS idx_collaboration_posts_created_at ON collaboration_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_collaboration_requests_post_id ON collaboration_requests(post_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_requests_requester_id ON collaboration_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_requests_status ON collaboration_requests(status);
CREATE INDEX IF NOT EXISTS idx_collaboration_requests_post_requester ON collaboration_requests(post_id, requester_id);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE collaboration_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Drop existing policies if they exist (to avoid conflicts)
-- ============================================
DROP POLICY IF EXISTS collaboration_posts_select_policy ON collaboration_posts;
DROP POLICY IF EXISTS collaboration_posts_insert_policy ON collaboration_posts;
DROP POLICY IF EXISTS collaboration_posts_update_policy ON collaboration_posts;
DROP POLICY IF EXISTS collaboration_posts_delete_policy ON collaboration_posts;

DROP POLICY IF EXISTS collaboration_requests_select_policy ON collaboration_requests;
DROP POLICY IF EXISTS collaboration_requests_insert_policy ON collaboration_requests;
DROP POLICY IF EXISTS collaboration_requests_update_policy ON collaboration_requests;

-- ============================================
-- RLS Policies for collaboration_posts
-- ============================================

-- SELECT: Anyone authenticated can read open collaboration_posts
-- Included ability for creators to read their own posts, even if closed
CREATE POLICY collaboration_posts_select_policy ON collaboration_posts
  FOR SELECT
  USING (
    (auth.role() = 'authenticated' AND status = 'open')
    OR
    (created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()))
  );

-- INSERT: Authenticated users can insert posts
CREATE POLICY collaboration_posts_insert_policy ON collaboration_posts
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- UPDATE: Only creator can update their post
CREATE POLICY collaboration_posts_update_policy ON collaboration_posts
  FOR UPDATE
  USING (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- DELETE: Only creator can delete their post
CREATE POLICY collaboration_posts_delete_policy ON collaboration_posts
  FOR DELETE
  USING (
    created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================
-- RLS Policies for collaboration_requests
-- ============================================

-- SELECT: Requester can read their own requests; post creator can read requests to their posts
CREATE POLICY collaboration_requests_select_policy ON collaboration_requests
  FOR SELECT
  USING (
    requester_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR
    post_id IN (
      SELECT id FROM collaboration_posts WHERE created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- INSERT: Authenticated users can insert collaboration_requests (not on their own posts)
CREATE POLICY collaboration_requests_insert_policy ON collaboration_requests
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    requester_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) AND
    post_id NOT IN (
      SELECT id FROM collaboration_posts WHERE created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- UPDATE: Only the post creator can update request status
CREATE POLICY collaboration_requests_update_policy ON collaboration_requests
  FOR UPDATE
  USING (
    post_id IN (
      SELECT id FROM collaboration_posts WHERE created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    post_id IN (
      SELECT id FROM collaboration_posts WHERE created_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- ============================================
-- Migration Complete!
-- ============================================
