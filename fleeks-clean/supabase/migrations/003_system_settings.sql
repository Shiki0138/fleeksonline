-- Create system settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensure only one row
  site_name TEXT DEFAULT 'FLEEKS Platform',
  site_description TEXT DEFAULT 'ビジネスと個人開発のための動画プラットフォーム',
  contact_email TEXT DEFAULT 'support@fleeks.jp',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  allow_registration BOOLEAN DEFAULT TRUE,
  require_email_verification BOOLEAN DEFAULT TRUE,
  free_video_limit INTEGER DEFAULT 300,
  stripe_public_key TEXT,
  stripe_secret_key TEXT,
  openai_api_key TEXT,
  email_notifications BOOLEAN DEFAULT TRUE,
  slack_webhook TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit logs table for tracking changes
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view/update system settings
CREATE POLICY "Admins can view system settings" ON system_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fleeks_profiles
      WHERE fleeks_profiles.id = auth.uid()
      AND fleeks_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update system settings" ON system_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fleeks_profiles
      WHERE fleeks_profiles.id = auth.uid()
      AND fleeks_profiles.role = 'admin'
    )
  );

-- Admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fleeks_profiles
      WHERE fleeks_profiles.id = auth.uid()
      AND fleeks_profiles.role = 'admin'
    )
  );

-- Users can insert their own audit logs
CREATE POLICY "Users can create audit logs" ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();