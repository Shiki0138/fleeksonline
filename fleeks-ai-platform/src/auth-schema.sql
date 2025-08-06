-- Auth logs table for tracking authentication events
CREATE TABLE IF NOT EXISTS auth_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES beauty_users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- sign_in, sign_out, sign_up, password_reset, etc.
  provider VARCHAR(50), -- google, email, etc.
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX idx_auth_logs_event_type ON auth_logs(event_type);
CREATE INDEX idx_auth_logs_created_at ON auth_logs(created_at DESC);

-- RLS policies for auth_logs
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own auth logs
CREATE POLICY "Users can view own auth logs" ON auth_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert auth logs
CREATE POLICY "Service role can insert auth logs" ON auth_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Function to automatically clean old auth logs (older than 90 days)
CREATE OR REPLACE FUNCTION clean_old_auth_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM auth_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule the cleanup function (requires pg_cron extension)
-- Uncomment if pg_cron is available
-- SELECT cron.schedule('clean-auth-logs', '0 2 * * *', 'SELECT clean_old_auth_logs();');

-- Add trigger to update user's last_login_at on sign in
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'sign_in' THEN
    UPDATE beauty_users
    SET last_login_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auth_log_update_last_login
AFTER INSERT ON auth_logs
FOR EACH ROW
EXECUTE FUNCTION update_last_login();