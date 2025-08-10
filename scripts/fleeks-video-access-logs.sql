-- FLEEKS Video Access Logs Table Creation
-- This table tracks video viewing history and analytics

BEGIN;

-- Create video access logs table if not exists
CREATE TABLE IF NOT EXISTS fleeks_video_access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES beauty_users(id) ON DELETE CASCADE NOT NULL,
  video_id TEXT NOT NULL,
  video_title TEXT,
  watch_duration INTEGER DEFAULT 0,
  total_duration INTEGER,
  watch_percentage NUMERIC(5,2),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE fleeks_video_access_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fleeks_video_access_logs_user_id ON fleeks_video_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fleeks_video_access_logs_video_id ON fleeks_video_access_logs(video_id);
CREATE INDEX IF NOT EXISTS idx_fleeks_video_access_logs_created_at ON fleeks_video_access_logs(created_at DESC);

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own video access logs" ON fleeks_video_access_logs;
CREATE POLICY "Users can view own video access logs" ON fleeks_video_access_logs
  FOR SELECT USING (user_id = fleeks_get_current_user_id());

DROP POLICY IF EXISTS "Users can insert own video access logs" ON fleeks_video_access_logs;
CREATE POLICY "Users can insert own video access logs" ON fleeks_video_access_logs
  FOR INSERT WITH CHECK (user_id = fleeks_get_current_user_id());

DROP POLICY IF EXISTS "Admins can view all video access logs" ON fleeks_video_access_logs;
CREATE POLICY "Admins can view all video access logs" ON fleeks_video_access_logs
  FOR SELECT USING (fleeks_is_admin());

COMMIT;