# API Design Specification

## RESTful API Architecture

### Base URL Structure
```
Development: http://localhost:3001/api/v1
Production: https://api.yourdomain.com/v1
```

### Authentication Flow

#### JWT Token Structure
```javascript
// Access Token (15 minutes)
{
  "iss": "business-app",
  "sub": "user-uuid",
  "aud": "business-app-client",
  "exp": 1234567890,
  "iat": 1234567890,
  "jti": "token-uuid",
  "scope": "read write",
  "role": "user",
  "org_id": "org-uuid",
  "permissions": ["read:projects", "write:tasks"]
}

// Refresh Token (7 days)
{
  "iss": "business-app",
  "sub": "user-uuid",
  "type": "refresh",
  "exp": 1234567890,
  "iat": 1234567890,
  "jti": "refresh-token-uuid"
}
```

### API Endpoints

## Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "strongPassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "Acme Corp" // Optional, creates new org
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "emailVerified": false
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token",
      "expiresIn": 900
    }
  }
}
```

### POST /auth/login
Authenticate user and return tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "strongPassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "organizations": [
        {
          "id": "org-uuid",
          "name": "Acme Corp",
          "role": "member"
        }
      ]
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token",
      "expiresIn": 900
    }
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "refresh-token"
}
```

### POST /auth/logout
Logout and revoke tokens.

**Request Headers:**
```
Authorization: Bearer {access-token}
```

## User Management Endpoints

### GET /users/me
Get current user profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "status": "active",
    "profile": {
      "avatarUrl": "https://...",
      "bio": "Software developer",
      "phone": "+1234567890",
      "company": "Acme Corp",
      "timezone": "UTC"
    },
    "organizations": [...],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /users/me
Update current user profile.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "profile": {
    "bio": "Senior Software Developer",
    "phone": "+1234567890",
    "timezone": "America/New_York"
  }
}
```

### PUT /users/me/password
Change user password.

**Request:**
```json
{
  "currentPassword": "oldPassword123!",
  "newPassword": "newPassword123!"
}
```

## Organization Management

### GET /organizations
List user's organizations.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `search`: Search term

**Response (200):**
```json
{
  "success": true,
  "data": {
    "organizations": [
      {
        "id": "uuid",
        "name": "Acme Corp",
        "slug": "acme-corp",
        "description": "Technology company",
        "logoUrl": "https://...",
        "role": "member",
        "memberCount": 25,
        "projectCount": 12,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### POST /organizations
Create a new organization.

**Request:**
```json
{
  "name": "New Company",
  "description": "A new technology company",
  "industry": "Technology",
  "size": "startup"
}
```

### GET /organizations/{id}
Get organization details.

### PUT /organizations/{id}
Update organization (admin/owner only).

### DELETE /organizations/{id}
Delete organization (owner only).

### GET /organizations/{id}/members
List organization members.

### POST /organizations/{id}/members
Invite new member.

**Request:**
```json
{
  "email": "newmember@example.com",
  "role": "member",
  "message": "Welcome to our team!"
}
```

## Project Management

### GET /projects
List projects (filtered by user's organizations).

**Query Parameters:**
- `organizationId`: Filter by organization
- `status`: Filter by status (draft, active, on_hold, completed, cancelled)
- `priority`: Filter by priority
- `assignedTo`: Filter by assigned user
- `search`: Search in name/description
- `page`, `limit`: Pagination

**Response (200):**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "name": "Website Redesign",
        "description": "Complete redesign of company website",
        "status": "active",
        "priority": "high",
        "startDate": "2024-01-01",
        "endDate": "2024-03-01",
        "budget": 50000.00,
        "organization": {
          "id": "org-uuid",
          "name": "Acme Corp"
        },
        "createdBy": {
          "id": "user-uuid",
          "firstName": "John",
          "lastName": "Doe"
        },
        "taskCounts": {
          "total": 15,
          "todo": 5,
          "inProgress": 3,
          "done": 7
        },
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

### POST /projects
Create new project.

**Request:**
```json
{
  "organizationId": "org-uuid",
  "name": "New Project",
  "description": "Project description",
  "priority": "medium",
  "startDate": "2024-02-01",
  "endDate": "2024-04-01",
  "budget": 25000.00
}
```

### GET /projects/{id}
Get project details including tasks summary.

### PUT /projects/{id}
Update project.

### DELETE /projects/{id}
Delete project and all associated tasks.

## Task Management

### GET /tasks
List tasks with filtering and pagination.

**Query Parameters:**
- `projectId`: Filter by project
- `assignedTo`: Filter by assigned user
- `status`: Filter by status
- `priority`: Filter by priority
- `tags`: Filter by tags (comma-separated)
- `dueBefore`: Filter by due date
- `search`: Search in title/description

### POST /tasks
Create new task.

**Request:**
```json
{
  "projectId": "project-uuid",
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication system",
  "assignedTo": "user-uuid",
  "priority": "high",
  "dueDate": "2024-02-15T17:00:00Z",
  "estimatedHours": 8,
  "tags": ["backend", "security", "authentication"]
}
```

### GET /tasks/{id}
Get task details.

### PUT /tasks/{id}
Update task.

### DELETE /tasks/{id}
Delete task.

### PUT /tasks/{id}/status
Update task status.

**Request:**
```json
{
  "status": "in_progress",
  "comment": "Started working on this task"
}
```

## Dashboard & Analytics

### GET /dashboard/stats
Get dashboard statistics for current user.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalProjects": 5,
      "activeProjects": 3,
      "totalTasks": 45,
      "myTasks": 12,
      "completedThisWeek": 8,
      "overdueTask": 2
    },
    "projectProgress": [
      {
        "projectId": "uuid",
        "name": "Website Redesign",
        "progress": 65,
        "tasksCompleted": 13,
        "totalTasks": 20
      }
    ],
    "upcomingDeadlines": [
      {
        "taskId": "uuid",
        "title": "Design mockups",
        "dueDate": "2024-02-20T17:00:00Z",
        "project": "Website Redesign"
      }
    ],
    "recentActivity": [
      {
        "id": "uuid",
        "type": "task_completed",
        "description": "Marked 'Setup database' as completed",
        "timestamp": "2024-02-15T14:30:00Z",
        "user": "John Doe"
      }
    ]
  }
}
```

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ],
    "timestamp": "2024-02-15T10:30:00Z",
    "requestId": "req-uuid"
  }
}
```

### Error Codes
- `VALIDATION_ERROR` (400): Request validation failed
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource already exists
- `RATE_LIMITED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

## Rate Limiting

```javascript
// Rate limits per endpoint type
const RATE_LIMITS = {
  AUTH: '10 requests per minute',
  READ: '100 requests per minute',
  WRITE: '30 requests per minute',
  UPLOAD: '5 requests per minute'
};
```

## Request/Response Headers

### Standard Headers
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token}
X-API-Version: v1
X-Request-ID: {uuid}
```

### Response Headers
```
X-Rate-Limit-Remaining: 95
X-Rate-Limit-Reset: 1708012800
X-Response-Time: 45ms
ETag: "33a64df551"
Cache-Control: public, max-age=300
```

## API Versioning Strategy

- URL versioning: `/api/v1/`
- Backward compatibility for at least 2 versions
- Deprecation headers for old versions
- Clear migration guides

## Webhook Support (Future)

```javascript
// Webhook event types
const WEBHOOK_EVENTS = [
  'project.created',
  'project.updated',
  'project.deleted',
  'task.created',
  'task.updated',
  'task.completed',
  'user.invited',
  'organization.updated'
];
```