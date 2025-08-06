# API Specification - Task Management Platform

## 1. API ARCHITECTURE OVERVIEW

### RESTful Design Principles
- **Resource-based URLs**: `/api/v1/projects/{id}/tasks`
- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE
- **Status Codes**: Standard HTTP status codes
- **Content Type**: `application/json`
- **API Versioning**: URL-based versioning (`/api/v1/`)

### Authentication & Authorization
- **JWT Tokens**: Bearer token authentication
- **Refresh Tokens**: Automatic token renewal
- **Role-Based Access**: Admin, Manager, User roles
- **Resource-Level Permissions**: Project and task-level access control

### API Response Structure
```json
{
  "success": true,
  "data": {}, // or [] for arrays
  "message": "Operation completed successfully",
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### Error Response Structure
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "requestId": "req_123456789"
}
```

## 2. AUTHENTICATION ENDPOINTS

### POST /api/v1/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
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
      "role": "user"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### POST /api/v1/auth/login
Authenticate user and return tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
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
      "role": "user"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### POST /api/v1/auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

### POST /api/v1/auth/logout
Logout user and invalidate tokens.

**Headers:** `Authorization: Bearer {token}`

### POST /api/v1/auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### POST /api/v1/auth/reset-password
Reset password using token from email.

**Request Body:**
```json
{
  "token": "reset_token",
  "newPassword": "NewSecurePass123!"
}
```

## 3. USER ENDPOINTS

### GET /api/v1/users/me
Get current user profile.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": "https://example.com/avatar.jpg",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLogin": "2024-01-15T10:30:00Z"
  }
}
```

### PUT /api/v1/users/me
Update current user profile.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

### POST /api/v1/users/me/change-password
Change user password.

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

### GET /api/v1/users
Get users list (Admin only).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `search`: Search by name or email
- `role`: Filter by role
- `isActive`: Filter by active status

## 4. PROJECT ENDPOINTS

### GET /api/v1/projects
Get user's projects.

**Query Parameters:**
- `page`, `limit`: Pagination
- `search`: Search by name or description
- `status`: Filter by status (active, archived, completed)
- `role`: Filter by user's role in project

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Website Redesign",
      "description": "Complete redesign of company website",
      "status": "active",
      "ownerId": "uuid",
      "owner": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe"
      },
      "memberCount": 5,
      "taskCount": 23,
      "completedTaskCount": 12,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### POST /api/v1/projects
Create new project.

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description",
  "startDate": "2024-02-01",
  "endDate": "2024-06-01",
  "budget": 50000.00
}
```

### GET /api/v1/projects/{id}
Get project details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Website Redesign",
    "description": "Complete redesign of company website",
    "status": "active",
    "startDate": "2024-01-01",
    "endDate": "2024-06-01",
    "budget": 50000.00,
    "owner": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "members": [
      {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "firstName": "Jane",
          "lastName": "Smith",
          "email": "jane@example.com",
          "avatarUrl": "https://example.com/avatar.jpg"
        },
        "role": "admin",
        "joinedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "stats": {
      "totalTasks": 23,
      "completedTasks": 12,
      "inProgressTasks": 8,
      "todoTasks": 3
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### PUT /api/v1/projects/{id}
Update project (Owner/Admin only).

### DELETE /api/v1/projects/{id}
Delete project (Owner only).

### GET /api/v1/projects/{id}/members
Get project members.

### POST /api/v1/projects/{id}/members
Add member to project.

**Request Body:**
```json
{
  "userId": "uuid",
  "role": "member"
}
```

### PUT /api/v1/projects/{id}/members/{userId}
Update member role.

### DELETE /api/v1/projects/{id}/members/{userId}
Remove member from project.

## 5. TASK ENDPOINTS

### GET /api/v1/projects/{projectId}/tasks
Get project tasks.

**Query Parameters:**
- `page`, `limit`: Pagination
- `search`: Search by title or description
- `status`: Filter by status
- `priority`: Filter by priority
- `assigneeId`: Filter by assignee
- `labelIds`: Filter by label IDs (comma-separated)
- `dueDateFrom`, `dueDateTo`: Filter by due date range
- `sortBy`: Sort field (createdAt, updatedAt, dueDate, priority)
- `sortOrder`: Sort order (asc, desc)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Implement user authentication",
      "description": "Add JWT-based authentication system",
      "status": "in_progress",
      "priority": "high",
      "taskType": "feature",
      "storyPoints": 8,
      "dueDate": "2024-02-15T00:00:00Z",
      "estimatedHours": 16.5,
      "actualHours": 12.0,
      "completionPercentage": 75,
      "assignee": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "avatarUrl": "https://example.com/avatar.jpg"
      },
      "reporter": {
        "id": "uuid",
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "labels": [
        {
          "id": "uuid",
          "name": "backend",
          "color": "#007bff"
        }
      ],
      "commentCount": 3,
      "attachmentCount": 2,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/v1/projects/{projectId}/tasks
Create new task.

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "assigneeId": "uuid",
  "priority": "medium",
  "taskType": "task",
  "storyPoints": 5,
  "dueDate": "2024-02-20T00:00:00Z",
  "estimatedHours": 8.0,
  "labelIds": ["uuid1", "uuid2"],
  "parentTaskId": "uuid"
}
```

### GET /api/v1/tasks/{id}
Get task details.

### PUT /api/v1/tasks/{id}
Update task.

### DELETE /api/v1/tasks/{id}
Delete task.

### PATCH /api/v1/tasks/{id}/status
Update task status.

**Request Body:**
```json
{
  "status": "done"
}
```

### GET /api/v1/tasks/{id}/comments
Get task comments.

### POST /api/v1/tasks/{id}/comments
Add comment to task.

**Request Body:**
```json
{
  "content": "This is a comment",
  "isInternal": false
}
```

### GET /api/v1/tasks/{id}/attachments
Get task attachments.

### POST /api/v1/tasks/{id}/attachments
Upload attachment to task.

**Content-Type:** `multipart/form-data`

## 6. LABEL ENDPOINTS

### GET /api/v1/projects/{projectId}/labels
Get project labels.

### POST /api/v1/projects/{projectId}/labels
Create new label.

**Request Body:**
```json
{
  "name": "bug",
  "color": "#dc3545",
  "description": "Bug reports and fixes"
}
```

### PUT /api/v1/labels/{id}
Update label.

### DELETE /api/v1/labels/{id}
Delete label.

## 7. DASHBOARD & ANALYTICS ENDPOINTS

### GET /api/v1/dashboard
Get user dashboard data.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalProjects": 5,
      "activeProjects": 3,
      "totalTasks": 45,
      "assignedTasks": 12,
      "completedTasks": 23,
      "overdueTasks": 3
    },
    "recentTasks": [],
    "upcomingDeadlines": [],
    "recentActivity": []
  }
}
```

### GET /api/v1/projects/{projectId}/analytics
Get project analytics.

**Query Parameters:**
- `period`: Time period (7d, 30d, 90d, 1y)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "taskDistribution": {
      "todo": 5,
      "inProgress": 8,
      "inReview": 3,
      "done": 15
    },
    "priorityDistribution": {
      "low": 10,
      "medium": 15,
      "high": 5,
      "urgent": 1
    },
    "completionTrend": [
      { "date": "2024-01-01", "completed": 2 },
      { "date": "2024-01-02", "completed": 3 }
    ],
    "teamPerformance": [
      {
        "userId": "uuid",
        "userName": "John Doe",
        "completedTasks": 8,
        "averageHours": 6.5
      }
    ]
  }
}
```

## 8. ACTIVITY & NOTIFICATIONS

### GET /api/v1/activity
Get user activity feed.

**Query Parameters:**
- `page`, `limit`: Pagination
- `projectId`: Filter by project
- `entityType`: Filter by entity type (project, task, comment)
- `action`: Filter by action type

### GET /api/v1/notifications
Get user notifications.

**Query Parameters:**
- `page`, `limit`: Pagination
- `unreadOnly`: Show only unread notifications

### PATCH /api/v1/notifications/{id}/read
Mark notification as read.

### PATCH /api/v1/notifications/read-all
Mark all notifications as read.

## 9. WEBSOCKET EVENTS

### Connection
```javascript
const socket = io('/api/v1/ws', {
  auth: {
    token: 'jwt_access_token'
  }
});
```

### Events

#### Join Project Room
```javascript
socket.emit('join-project', { projectId: 'uuid' });
```

#### Task Events
- `task:created` - New task created
- `task:updated` - Task updated
- `task:deleted` - Task deleted
- `task:assigned` - Task assigned to user
- `task:status-changed` - Task status changed

#### Comment Events
- `comment:added` - New comment added
- `comment:updated` - Comment updated
- `comment:deleted` - Comment deleted

#### Project Events
- `project:updated` - Project details updated
- `project:member-added` - New member added
- `project:member-removed` - Member removed

#### Notification Events
- `notification:new` - New notification for user

## 10. ERROR CODES

### Standard HTTP Status Codes
- `200` - OK
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `500` - Internal Server Error

### Custom Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_FAILED` - Invalid credentials
- `TOKEN_EXPIRED` - JWT token expired
- `TOKEN_INVALID` - Invalid JWT token
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `RESOURCE_NOT_FOUND` - Requested resource not found
- `DUPLICATE_RESOURCE` - Resource already exists
- `PROJECT_ACCESS_DENIED` - User not member of project
- `TASK_ASSIGNMENT_FAILED` - Cannot assign task to user
- `FILE_UPLOAD_FAILED` - File upload error
- `DATABASE_ERROR` - Database operation failed

## 11. RATE LIMITING

### Limits
- **Authentication endpoints**: 5 requests per minute per IP
- **General API endpoints**: 100 requests per minute per user
- **File upload endpoints**: 10 requests per minute per user
- **WebSocket connections**: 5 connections per user

### Headers
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

## 12. API VERSIONING

### URL-based Versioning
- Current version: `/api/v1/`
- Future versions: `/api/v2/`, `/api/v3/`

### Version Deprecation
- New versions introduced without breaking existing versions
- Deprecated versions supported for minimum 6 months
- Client notification headers for deprecated versions

This API specification provides a comprehensive REST API design for the task management platform with proper authentication, authorization, error handling, and real-time capabilities.