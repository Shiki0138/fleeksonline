# Database Design - Task Management Platform

## 1. ENTITY RELATIONSHIP DIAGRAM

### Core Entities and Relationships

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     Users       │       │   Projects      │       │     Tasks       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │───┐   │ id (PK)         │───┐   │ id (PK)         │
│ email           │   │   │ name            │   │   │ title           │
│ password_hash   │   │   │ description     │   │   │ description     │
│ first_name      │   │   │ owner_id (FK)   │───┘   │ project_id (FK) │───┘
│ last_name       │   │   │ status          │       │ assignee_id (FK)│───┐
│ avatar_url      │   │   │ created_at      │       │ reporter_id (FK)│───┤
│ role            │   │   │ updated_at      │       │ status          │   │
│ is_active       │   │   │ deleted_at      │       │ priority        │   │
│ created_at      │   │   └─────────────────┘       │ due_date        │   │
│ updated_at      │   │                             │ estimated_hours │   │
│ last_login      │   │                             │ actual_hours    │   │
└─────────────────┘   │                             │ created_at      │   │
                      │                             │ updated_at      │   │
                      │                             │ deleted_at      │   │
                      │                             └─────────────────┘   │
                      │                                                   │
                      │   ┌─────────────────┐                           │
                      │   │ ProjectMembers  │                           │
                      │   ├─────────────────┤                           │
                      │   │ id (PK)         │                           │
                      │   │ project_id (FK) │───────────┐               │
                      │   │ user_id (FK)    │───────────┼───────────────┘
                      │   │ role            │           │
                      │   │ joined_at       │           │
                      │   │ is_active       │           │
                      │   └─────────────────┘           │
                      │                                 │
                      │   ┌─────────────────┐           │
                      │   │    Comments     │           │
                      │   ├─────────────────┤           │
                      │   │ id (PK)         │           │
                      │   │ task_id (FK)    │───────────┘
                      │   │ author_id (FK)  │───────────┐
                      └───│ content         │           │
                          │ created_at      │           │
                          │ updated_at      │           │
                          │ deleted_at      │           │
                          └─────────────────┘           │
                                                        │
          ┌─────────────────┐       ┌─────────────────┐ │
          │   Attachments   │       │   TaskLabels    │ │
          ├─────────────────┤       ├─────────────────┤ │
          │ id (PK)         │       │ id (PK)         │ │
          │ task_id (FK)    │───┐   │ task_id (FK)    │ │
          │ filename        │   │   │ label_id (FK)   │ │
          │ file_path       │   │   │ created_at      │ │
          │ file_size       │   │   └─────────────────┘ │
          │ content_type    │   │                       │
          │ uploaded_by (FK)│───┼───────────────────────┘
          │ created_at      │   │
          └─────────────────┘   │
                                │
          ┌─────────────────┐   │
          │     Labels      │   │
          ├─────────────────┤   │
          │ id (PK)         │───┘
          │ name            │
          │ color           │
          │ project_id (FK) │
          │ created_at      │
          └─────────────────┘
```

## 2. TABLE SCHEMAS

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);
```

### Projects Table
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

### Project Members Table
```sql
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(project_id, user_id)
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'in_review', 'done', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    task_type VARCHAR(20) DEFAULT 'task' CHECK (task_type IN ('task', 'bug', 'feature', 'epic')),
    story_points INTEGER CHECK (story_points >= 0),
    due_date TIMESTAMPTZ,
    estimated_hours DECIMAL(5,2) CHECK (estimated_hours >= 0),
    actual_hours DECIMAL(5,2) CHECK (actual_hours >= 0),
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

### Comments Table
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

### Labels Table
```sql
CREATE TABLE labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#007bff', -- Hex color
    description TEXT,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, name)
);
```

### Task Labels Table (Many-to-Many)
```sql
CREATE TABLE task_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id, label_id)
);
```

### Attachments Table
```sql
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Activity Log Table
```sql
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'assigned', etc.
    entity_type VARCHAR(20) NOT NULL, -- 'project', 'task', 'comment', etc.
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3. INDEXES FOR PERFORMANCE

### Primary Indexes
```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_role ON users(role);

-- Projects
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_created_at ON projects(created_at);

-- Project Members
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_project_members_active ON project_members(is_active) WHERE is_active = true;

-- Tasks
CREATE INDEX idx_tasks_project ON tasks(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_reporter ON tasks(reporter_id);
CREATE INDEX idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_priority ON tasks(priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;

-- Comments
CREATE INDEX idx_comments_task ON comments(task_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Activity Logs
CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_project ON activity_logs(project_id);
CREATE INDEX idx_activity_task ON activity_logs(task_id);
CREATE INDEX idx_activity_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);
```

### Composite Indexes
```sql
-- For dashboard queries
CREATE INDEX idx_tasks_project_status_assignee ON tasks(project_id, status, assignee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assignee_status_due ON tasks(assignee_id, status, due_date) WHERE deleted_at IS NULL;

-- For activity feeds
CREATE INDEX idx_activity_project_created ON activity_logs(project_id, created_at DESC);
CREATE INDEX idx_activity_user_created ON activity_logs(user_id, created_at DESC);
```

## 4. PRISMA SCHEMA

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                       String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email                    String    @unique
  passwordHash             String    @map("password_hash")
  firstName                String    @map("first_name")
  lastName                 String    @map("last_name")
  avatarUrl                String?   @map("avatar_url")
  role                     UserRole  @default(USER)
  isActive                 Boolean   @default(true) @map("is_active")
  emailVerified            Boolean   @default(false) @map("email_verified")
  emailVerificationToken   String?   @map("email_verification_token")
  passwordResetToken       String?   @map("password_reset_token")
  passwordResetExpires     DateTime? @map("password_reset_expires")
  createdAt                DateTime  @default(now()) @map("created_at")
  updatedAt                DateTime  @updatedAt @map("updated_at")
  lastLogin                DateTime? @map("last_login")

  // Relations
  ownedProjects     Project[]
  projectMembers    ProjectMember[]
  assignedTasks     Task[]          @relation("TaskAssignee")
  reportedTasks     Task[]          @relation("TaskReporter")
  comments          Comment[]
  attachments       Attachment[]
  activityLogs      ActivityLog[]

  @@map("users")
}

model Project {
  id          String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String
  description String?
  ownerId     String        @map("owner_id") @db.Uuid
  status      ProjectStatus @default(ACTIVE)
  startDate   DateTime?     @map("start_date") @db.Date
  endDate     DateTime?     @map("end_date") @db.Date
  budget      Decimal?      @db.Decimal(10, 2)
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")
  deletedAt   DateTime?     @map("deleted_at")

  // Relations
  owner          User            @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  members        ProjectMember[]
  tasks          Task[]
  labels         Label[]
  activityLogs   ActivityLog[]

  @@map("projects")
}

model ProjectMember {
  id          String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  projectId   String              @map("project_id") @db.Uuid
  userId      String              @map("user_id") @db.Uuid
  role        ProjectMemberRole   @default(MEMBER)
  permissions Json                @default("{}")
  joinedAt    DateTime            @default(now()) @map("joined_at")
  isActive    Boolean             @default(true) @map("is_active")

  // Relations
  project     Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user        User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@map("project_members")
}

model Task {
  id                   String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title                String
  description          String?
  projectId            String       @map("project_id") @db.Uuid
  assigneeId           String?      @map("assignee_id") @db.Uuid
  reporterId           String       @map("reporter_id") @db.Uuid
  parentTaskId         String?      @map("parent_task_id") @db.Uuid
  status               TaskStatus   @default(TODO)
  priority             TaskPriority @default(MEDIUM)
  taskType             TaskType     @default(TASK) @map("task_type")
  storyPoints          Int?         @map("story_points")
  dueDate              DateTime?    @map("due_date")
  estimatedHours       Decimal?     @map("estimated_hours") @db.Decimal(5, 2)
  actualHours          Decimal?     @map("actual_hours") @db.Decimal(5, 2)
  completionPercentage Int          @default(0) @map("completion_percentage")
  createdAt            DateTime     @default(now()) @map("created_at")
  updatedAt            DateTime     @updatedAt @map("updated_at")
  deletedAt            DateTime?    @map("deleted_at")

  // Relations
  project      Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee     User?        @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  reporter     User         @relation("TaskReporter", fields: [reporterId], references: [id], onDelete: Cascade)
  parentTask   Task?        @relation("TaskHierarchy", fields: [parentTaskId], references: [id], onDelete: Cascade)
  subtasks     Task[]       @relation("TaskHierarchy")
  comments     Comment[]
  attachments  Attachment[]
  labels       TaskLabel[]
  activityLogs ActivityLog[]

  @@map("tasks")
}

model Comment {
  id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  taskId     String    @map("task_id") @db.Uuid
  authorId   String    @map("author_id") @db.Uuid
  content    String
  isInternal Boolean   @default(false) @map("is_internal")
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")
  deletedAt  DateTime? @map("deleted_at")

  // Relations
  task   Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  author User @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("comments")
}

model Label {
  id          String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String
  color       String      @default("#007bff")
  description String?
  projectId   String      @map("project_id") @db.Uuid
  createdAt   DateTime    @default(now()) @map("created_at")

  // Relations
  project Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks   TaskLabel[]

  @@unique([projectId, name])
  @@map("labels")
}

model TaskLabel {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  taskId    String   @map("task_id") @db.Uuid
  labelId   String   @map("label_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  task  Task  @relation(fields: [taskId], references: [id], onDelete: Cascade)
  label Label @relation(fields: [labelId], references: [id], onDelete: Cascade)

  @@unique([taskId, labelId])
  @@map("task_labels")
}

model Attachment {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  taskId           String   @map("task_id") @db.Uuid
  filename         String
  originalFilename String   @map("original_filename")
  filePath         String   @map("file_path")
  fileSize         BigInt   @map("file_size")
  contentType      String   @map("content_type")
  uploadedBy       String   @map("uploaded_by") @db.Uuid
  createdAt        DateTime @default(now()) @map("created_at")

  // Relations
  task     Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  uploader User @relation(fields: [uploadedBy], references: [id], onDelete: Cascade)

  @@map("attachments")
}

model ActivityLog {
  id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId     String    @map("user_id") @db.Uuid
  projectId  String?   @map("project_id") @db.Uuid
  taskId     String?   @map("task_id") @db.Uuid
  action     String
  entityType String    @map("entity_type")
  entityId   String    @map("entity_id") @db.Uuid
  oldValues  Json?     @map("old_values")
  newValues  Json?     @map("new_values")
  ipAddress  String?   @map("ip_address")
  userAgent  String?   @map("user_agent")
  createdAt  DateTime  @default(now()) @map("created_at")

  // Relations
  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  task    Task?    @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@map("activity_logs")
}

// Enums
enum UserRole {
  ADMIN
  MANAGER
  USER
}

enum ProjectStatus {
  ACTIVE
  ARCHIVED
  COMPLETED
}

enum ProjectMemberRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
  CANCELLED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TaskType {
  TASK
  BUG
  FEATURE
  EPIC
}
```

## 5. MIGRATION STRATEGY

### Initial Migration
```sql
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
```

### Seed Data
```sql
-- Insert default admin user
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
VALUES ('admin@taskmanager.com', '$2b$10$encrypted_password_hash', 'System', 'Admin', 'admin', true);

-- Insert default project statuses and task types as needed
```

This database design provides a robust foundation for the task management platform with proper normalization, indexing, and scalability considerations.