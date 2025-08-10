-- Initial seed data for Fleeks application

-- Insert default admin user
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES (
  'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
  'admin@fleeks.com',
  '$2b$12$LQv3c1yqBwkvHGOcYqLLnu2iiCxqxeqxYlPX9MxJzvHyzZeJvhGKC', -- password: admin123
  'System',
  'Administrator',
  'admin',
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample organization
INSERT INTO organizations (id, name, description, industry, size, owner_id)
VALUES (
  'org-sample-uuid-1234-567890abcdef',
  'Fleeks Technologies',
  'A technology company focused on innovative business solutions',
  'Technology',
  'startup',
  'a0b1c2d3-e4f5-6789-abcd-ef0123456789'
) ON CONFLICT DO NOTHING;

-- Add admin to organization
INSERT INTO organization_members (organization_id, user_id, role)
VALUES (
  'org-sample-uuid-1234-567890abcdef',
  'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
  'owner'
) ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Insert sample users
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES 
  (
    'user-manager-uuid-1234-567890abcdef',
    'manager@fleeks.com',
    '$2b$12$LQv3c1yqBwkvHGOcYqLLnu2iiCxqxeqxYlPX9MxJzvHyzZeJvhGKC', -- password: manager123
    'Project',
    'Manager',
    'manager',
    true,
    true
  ),
  (
    'user-employee-uuid-1234-567890abcdef',
    'user@fleeks.com',
    '$2b$12$LQv3c1yqBwkvHGOcYqLLnu2iiCxqxeqxYlPX9MxJzvHyzZeJvhGKC', -- password: user123
    'Regular',
    'User',
    'user',
    true,
    true
  )
ON CONFLICT (email) DO NOTHING;

-- Add users to organization
INSERT INTO organization_members (organization_id, user_id, role)
VALUES 
  (
    'org-sample-uuid-1234-567890abcdef',
    'user-manager-uuid-1234-567890abcdef',
    'manager'
  ),
  (
    'org-sample-uuid-1234-567890abcdef',
    'user-employee-uuid-1234-567890abcdef',
    'member'
  )
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Insert sample project
INSERT INTO projects (id, name, description, status, priority, start_date, due_date, organization_id, manager_id, created_by)
VALUES (
  'project-sample-uuid-1234-567890abcdef',
  'Product Launch Initiative',
  'Launch our new flagship product with comprehensive marketing and development efforts',
  'active',
  'high',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '90 days',
  'org-sample-uuid-1234-567890abcdef',
  'user-manager-uuid-1234-567890abcdef',
  'a0b1c2d3-e4f5-6789-abcd-ef0123456789'
) ON CONFLICT DO NOTHING;

-- Add project members
INSERT INTO project_members (project_id, user_id, role)
VALUES 
  (
    'project-sample-uuid-1234-567890abcdef',
    'user-manager-uuid-1234-567890abcdef',
    'manager'
  ),
  (
    'project-sample-uuid-1234-567890abcdef',
    'user-employee-uuid-1234-567890abcdef',
    'member'
  )
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (id, title, description, status, priority, estimated_hours, project_id, assignee_id, created_by)
VALUES 
  (
    'task-sample-uuid-1234-567890abcdef',
    'Setup Development Environment',
    'Configure development environment with all necessary tools and dependencies',
    'done',
    'high',
    8.0,
    'project-sample-uuid-1234-567890abcdef',
    'user-employee-uuid-1234-567890abcdef',
    'user-manager-uuid-1234-567890abcdef'
  ),
  (
    'task-design-uuid-1234-567890abcdef',
    'Create UI/UX Designs',
    'Design user interface mockups and user experience flows',
    'in_progress',
    'medium',
    24.0,
    'project-sample-uuid-1234-567890abcdef',
    'user-employee-uuid-1234-567890abcdef',
    'user-manager-uuid-1234-567890abcdef'
  ),
  (
    'task-backend-uuid-1234-567890abcdef',
    'Implement Backend API',
    'Develop RESTful API with authentication and data management',
    'todo',
    'high',
    40.0,
    'project-sample-uuid-1234-567890abcdef',
    NULL,
    'user-manager-uuid-1234-567890abcdef'
  )
ON CONFLICT DO NOTHING;

-- Insert sample task comment
INSERT INTO task_comments (task_id, user_id, content)
VALUES (
  'task-sample-uuid-1234-567890abcdef',
  'user-employee-uuid-1234-567890abcdef',
  'Development environment has been successfully configured. All dependencies are installed and working properly.'
) ON CONFLICT DO NOTHING;

-- Insert sample notification
INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id)
VALUES (
  'user-employee-uuid-1234-567890abcdef',
  'Task Assigned',
  'You have been assigned a new task: Create UI/UX Designs',
  'info',
  'task',
  'task-design-uuid-1234-567890abcdef'
) ON CONFLICT DO NOTHING;