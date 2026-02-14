-- ============================================
-- BAYSIS Social Features – Supabase Tables
-- Run this in Supabase SQL Editor
-- ============================================

-- 1) FOLLOWS
CREATE TABLE IF NOT EXISTS follows (
  follower_id  TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read follows"  ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow"         ON follows FOR INSERT WITH CHECK (auth.uid()::text = follower_id);
CREATE POLICY "Users can unfollow"       ON follows FOR DELETE USING (auth.uid()::text = follower_id);

-- 2) LIKES
CREATE TABLE IF NOT EXISTS likes (
  user_id     TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('service', 'reel')),
  target_id   TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_type, target_id);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can like"        ON likes FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can unlike"      ON likes FOR DELETE USING (auth.uid()::text = user_id);

-- 3) COMMENTS
CREATE TABLE IF NOT EXISTS comments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('service', 'reel')),
  target_id   TEXT NOT NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user   ON comments(user_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can comment"        ON comments FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own"     ON comments FOR DELETE USING (auth.uid()::text = user_id);

-- 4) NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT NOT NULL,
  type        TEXT NOT NULL,  -- 'follow', 'like', 'comment', 'hire_request', 'message'
  actor_id    TEXT,
  target_type TEXT,           -- 'service', 'reel', 'conversation'
  target_id   TEXT,
  body        TEXT,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Anyone can insert"           ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can mark read"         ON notifications FOR UPDATE USING (auth.uid()::text = user_id);

-- 5) SERVICE REQUESTS
CREATE TABLE IF NOT EXISTS service_requests (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id      TEXT NOT NULL,
  client_id       TEXT NOT NULL,
  freelancer_id   TEXT NOT NULL,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  message         TEXT,
  conversation_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_requests_client     ON service_requests(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_freelancer ON service_requests(freelancer_id, created_at DESC);

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can read"    ON service_requests FOR SELECT
  USING (auth.uid()::text = client_id OR auth.uid()::text = freelancer_id);
CREATE POLICY "Clients can request"      ON service_requests FOR INSERT
  WITH CHECK (auth.uid()::text = client_id);
CREATE POLICY "Participants can update"  ON service_requests FOR UPDATE
  USING (auth.uid()::text = client_id OR auth.uid()::text = freelancer_id);
