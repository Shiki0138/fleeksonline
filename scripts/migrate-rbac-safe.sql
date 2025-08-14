-- Safe RBAC System Migration Script
-- This script handles existing policies and tables safely

-- Step 1: Create new tables for RBAC system (IF NOT EXISTS to avoid conflicts)

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default system roles (ON CONFLICT DO NOTHING to avoid duplicates)
INSERT INTO roles (name, display_name, description, priority, is_system) VALUES
  ('guest', 'ゲスト', 'ログインしていないユーザー', 0, true),
  ('free_user', '無料会員', '無料プランのユーザー', 100, true),
  ('premium_user', 'プレミアム会員', '有料プランのユーザー', 200, true),
  ('admin', '管理者', 'システム管理者', 900, true),
  ('super_admin', 'スーパー管理者', '全権限を持つ管理者', 1000, true)
ON CONFLICT (name) DO NOTHING;

-- User roles mapping
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES beauty_users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES beauty_users(id),
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, role_id)
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default permissions (ON CONFLICT DO NOTHING to avoid duplicates)
INSERT INTO permissions (name, resource, action, description) VALUES
  -- Article permissions
  ('article.read.free', 'article', 'read', '無料記事の閲覧'),
  ('article.read.partial', 'article', 'read_partial', '一部有料記事のプレビュー閲覧'),
  ('article.read.premium', 'article', 'read', 'プレミアム記事の閲覧'),
  ('article.write', 'article', 'write', '記事の作成'),
  ('article.update', 'article', 'update', '記事の更新'),
  ('article.delete', 'article', 'delete', '記事の削除'),
  ('article.manage', 'article', 'manage', '記事の管理'),
  
  -- Video permissions
  ('video.read.free', 'video', 'read', '無料動画の視聴'),
  ('video.read.premium', 'video', 'read', 'プレミアム動画の視聴'),
  ('video.manage', 'video', 'manage', '動画の管理'),
  
  -- Forum permissions
  ('forum.read', 'forum', 'read', 'フォーラムの閲覧'),
  ('forum.write', 'forum', 'write', 'フォーラムへの投稿'),
  ('forum.moderate', 'forum', 'moderate', 'フォーラムのモデレート'),
  
  -- User profile permissions
  ('user_profile.read.own', 'user_profile', 'read', '自分のプロフィール閲覧'),
  ('user_profile.update.own', 'user_profile', 'update', '自分のプロフィール更新'),
  ('user_profile.read.any', 'user_profile', 'read', '他人のプロフィール閲覧'),
  ('user_profile.manage', 'user_profile', 'manage', 'ユーザープロフィールの管理'),
  
  -- Admin panel permissions
  ('admin_panel.access', 'admin_panel', 'access', '管理画面へのアクセス'),
  ('admin_panel.users.manage', 'admin_panel', 'manage_users', 'ユーザー管理'),
  ('admin_panel.content.manage', 'admin_panel', 'manage_content', 'コンテンツ管理'),
  ('admin_panel.settings.manage', 'admin_panel', 'manage_settings', 'システム設定管理')
ON CONFLICT (name) DO NOTHING;

-- Role permissions mapping
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  conditions JSONB,
  PRIMARY KEY (role_id, permission_id)
);

-- Assign permissions to roles (with conflict handling)
DO $$
DECLARE
  guest_role_id UUID;
  free_user_role_id UUID;
  premium_user_role_id UUID;
  admin_role_id UUID;
  super_admin_role_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO guest_role_id FROM roles WHERE name = 'guest';
  SELECT id INTO free_user_role_id FROM roles WHERE name = 'free_user';
  SELECT id INTO premium_user_role_id FROM roles WHERE name = 'premium_user';
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'super_admin';
  
  -- Guest permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT guest_role_id, id FROM permissions WHERE name IN (
    'article.read.free',
    'forum.read'
  ) ON CONFLICT DO NOTHING;
  
  -- Free user permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT free_user_role_id, id FROM permissions WHERE name IN (
    'article.read.free',
    'article.read.partial',
    'forum.read',
    'forum.write',
    'user_profile.read.own',
    'user_profile.update.own'
  ) ON CONFLICT DO NOTHING;
  
  -- Premium user permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT premium_user_role_id, id FROM permissions WHERE name IN (
    'article.read.free',
    'article.read.partial',
    'article.read.premium',
    'video.read.free',
    'video.read.premium',
    'forum.read',
    'forum.write',
    'user_profile.read.own',
    'user_profile.update.own',
    'user_profile.read.any'
  ) ON CONFLICT DO NOTHING;
  
  -- Admin permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT admin_role_id, id FROM permissions WHERE name IN (
    'article.read.free',
    'article.read.partial',
    'article.read.premium',
    'article.write',
    'article.update',
    'article.delete',
    'article.manage',
    'video.read.free',
    'video.read.premium',
    'video.manage',
    'forum.read',
    'forum.write',
    'forum.moderate',
    'user_profile.read.own',
    'user_profile.update.own',
    'user_profile.read.any',
    'admin_panel.access',
    'admin_panel.content.manage'
  ) ON CONFLICT DO NOTHING;
  
  -- Super admin permissions (all permissions)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT super_admin_role_id, id FROM permissions
  ON CONFLICT DO NOTHING;
END $$;

-- Audit log table
CREATE TABLE IF NOT EXISTS access_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES beauty_users(id),
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_id TEXT,
  allowed BOOLEAN NOT NULL,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance (IF NOT EXISTS equivalent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_log_user_id') THEN
    CREATE INDEX idx_audit_log_user_id ON access_audit_log(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_log_created_at') THEN
    CREATE INDEX idx_audit_log_created_at ON access_audit_log(created_at);
  END IF;
END $$;

-- Content access rules
CREATE TABLE IF NOT EXISTS content_access_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  access_level TEXT NOT NULL,
  required_roles UUID[] NOT NULL,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_type, content_id)
);

-- Step 2: Migrate existing user roles (only if user_roles table is empty)
DO $$
DECLARE
  free_user_role_id UUID;
  premium_user_role_id UUID;
  admin_role_id UUID;
  existing_roles_count INTEGER;
BEGIN
  -- Check if we already have user roles
  SELECT COUNT(*) INTO existing_roles_count FROM user_roles;
  
  IF existing_roles_count = 0 THEN
    -- Get role IDs
    SELECT id INTO free_user_role_id FROM roles WHERE name = 'free_user';
    SELECT id INTO premium_user_role_id FROM roles WHERE name = 'premium_user';
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    
    -- Migrate existing users to new role system
    -- Free users (default)
    INSERT INTO user_roles (user_id, role_id)
    SELECT bu.id, free_user_role_id
    FROM beauty_users bu
    INNER JOIN fleeks_profiles fp ON bu.id = fp.id
    WHERE fp.role = 'user' OR fp.role IS NULL OR fp.role = 'free'
    ON CONFLICT DO NOTHING;
    
    -- Premium users
    INSERT INTO user_roles (user_id, role_id)
    SELECT bu.id, premium_user_role_id
    FROM beauty_users bu
    INNER JOIN fleeks_profiles fp ON bu.id = fp.id
    WHERE fp.role = 'paid'
    ON CONFLICT DO NOTHING;
    
    -- Admin users
    INSERT INTO user_roles (user_id, role_id)
    SELECT bu.id, admin_role_id
    FROM beauty_users bu
    INNER JOIN fleeks_profiles fp ON bu.id = fp.id
    WHERE fp.role = 'admin'
    ON CONFLICT DO NOTHING;
    
    -- Special case: hardcoded admin email
    INSERT INTO user_roles (user_id, role_id)
    SELECT bu.id, admin_role_id
    FROM beauty_users bu
    WHERE bu.email = 'greenroom51@gmail.com'
    ON CONFLICT DO NOTHING;
    
    -- Also assign roles to users without profiles
    INSERT INTO user_roles (user_id, role_id)
    SELECT bu.id, free_user_role_id
    FROM beauty_users bu
    LEFT JOIN fleeks_profiles fp ON bu.id = fp.id
    WHERE fp.id IS NULL
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'User roles migrated successfully';
  ELSE
    RAISE NOTICE 'User roles already exist, skipping migration';
  END IF;
END $$;

-- Step 3: Enable RLS and create policies (with safe policy creation)
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_access_rules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Roles table policies
  DROP POLICY IF EXISTS "Roles are viewable by everyone" ON roles;
  CREATE POLICY "Roles are viewable by everyone" ON roles
    FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Roles are manageable by super admins" ON roles;
  CREATE POLICY "Roles are manageable by super admins" ON roles
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
      )
    );

  -- User roles policies
  DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
  CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

  DROP POLICY IF EXISTS "Admins can view all user roles" ON user_roles;
  CREATE POLICY "Admins can view all user roles" ON user_roles
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin')
      )
    );

  DROP POLICY IF EXISTS "Super admins can manage user roles" ON user_roles;
  CREATE POLICY "Super admins can manage user roles" ON user_roles
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
      )
    );

  -- Permissions policies
  DROP POLICY IF EXISTS "Permissions are viewable by authenticated users" ON permissions;
  CREATE POLICY "Permissions are viewable by authenticated users" ON permissions
    FOR SELECT USING (auth.uid() IS NOT NULL);

  DROP POLICY IF EXISTS "Permissions are manageable by super admins" ON permissions;
  CREATE POLICY "Permissions are manageable by super admins" ON permissions
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
      )
    );

  -- Audit log policies
  DROP POLICY IF EXISTS "Users can view their own audit logs" ON access_audit_log;
  CREATE POLICY "Users can view their own audit logs" ON access_audit_log
    FOR SELECT USING (user_id = auth.uid());

  DROP POLICY IF EXISTS "Admins can view all audit logs" ON access_audit_log;
  CREATE POLICY "Admins can view all audit logs" ON access_audit_log
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin')
      )
    );

  DROP POLICY IF EXISTS "System can insert audit logs" ON access_audit_log;
  CREATE POLICY "System can insert audit logs" ON access_audit_log
    FOR INSERT WITH CHECK (true);

  -- Content access rules policies
  DROP POLICY IF EXISTS "Content access rules are viewable by admins" ON content_access_rules;
  CREATE POLICY "Content access rules are viewable by admins" ON content_access_rules
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin')
      )
    );

  DROP POLICY IF EXISTS "Content access rules are manageable by super admins" ON content_access_rules;
  CREATE POLICY "Content access rules are manageable by super admins" ON content_access_rules
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
      )
    );

  RAISE NOTICE 'RLS policies created successfully';
END $$;

-- Step 4: Create helper functions (with safe creation)
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS TABLE(role_name TEXT, role_display_name TEXT, priority INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT r.name, r.display_name, r.priority
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = user_uuid
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ORDER BY r.priority DESC;
END;
$$;

CREATE OR REPLACE FUNCTION user_has_permission(
  user_uuid UUID,
  resource_name TEXT,
  action_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_uuid
    AND p.resource = resource_name
    AND p.action = action_name
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  );
END;
$$;

-- Create view for easier permission checking
CREATE OR REPLACE VIEW user_permissions AS
SELECT 
  ur.user_id,
  p.resource,
  p.action,
  p.name as permission_name,
  r.name as role_name
FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
JOIN roles r ON ur.role_id = r.id
WHERE ur.expires_at IS NULL OR ur.expires_at > NOW();

-- Grant necessary permissions
GRANT SELECT ON roles TO authenticated;
GRANT SELECT ON permissions TO authenticated;
GRANT SELECT ON user_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_roles TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_permission TO authenticated;

-- Final status report
SELECT 'RBAC Migration Complete' as status,
  'Successfully created ' || COUNT(*) || ' roles' as details
FROM roles
UNION ALL
SELECT 'User Roles', 'Assigned roles to ' || COUNT(DISTINCT user_id) || ' users' as details
FROM user_roles
UNION ALL
SELECT 'Permissions', 'Created ' || COUNT(*) || ' permissions' as details
FROM permissions;