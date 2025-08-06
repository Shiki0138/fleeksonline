# Task Management & Collaboration Platform - Backend

A robust, production-ready backend API for a task management and collaboration platform built with Node.js, TypeScript, Fastify, and Prisma.

## 🚀 Features

### Core Functionality
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Project Management**: Create, manage, and collaborate on projects
- **Task Management**: Full CRUD operations with status tracking, assignments, and labels
- **Real-time Collaboration**: WebSocket support for live updates
- **Activity Logging**: Comprehensive activity tracking and history
- **File Attachments**: Support for task-related file uploads
- **Comments System**: Threaded comments on tasks

### Technical Features
- **Type Safety**: Full TypeScript implementation
- **API Documentation**: Auto-generated Swagger/OpenAPI docs
- **Rate Limiting**: Configurable rate limiting for API endpoints
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Validation**: Request/response validation using Zod schemas
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Jest-based testing suite
- **Security**: Helmet, CORS, and JWT security measures

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Fastify
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Real-time**: Socket.io
- **Testing**: Jest
- **Documentation**: Swagger/OpenAPI

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone and navigate to backend directory
cd src/backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` with your settings:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/taskmanagement"

# JWT Secrets (change these in production!)
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-jwt-key"

# Server Configuration
PORT=3000
NODE_ENV="development"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed with demo data (optional)
npm run prisma:seed
```

### 4. Start Development Server

```bash
# Start in development mode with hot reload
npm run dev

# Or build and start production server
npm run build
npm start
```

The server will be available at:
- **API**: http://localhost:3000/api/v1
- **Documentation**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health
- **WebSocket**: http://localhost:3000/socket.io

## 📊 Database Schema

### Core Entities

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string username UK
        string firstName
        string lastName
        string password
        string avatar
        string bio
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    Project {
        string id PK
        string name
        string description
        string color
        boolean isArchived
        string createdById FK
        datetime createdAt
        datetime updatedAt
    }
    
    Task {
        string id PK
        string title
        string description
        enum status
        enum priority
        datetime dueDate
        datetime completedAt
        int position
        string projectId FK
        string createdById FK
        string assigneeId FK
        datetime createdAt
        datetime updatedAt
    }
    
    User ||--o{ ProjectMember : "has"
    Project ||--o{ ProjectMember : "contains"
    Project ||--o{ Task : "contains"
    User ||--o{ Task : "creates"
    User ||--o{ Task : "assigned to"
    Task ||--o{ Comment : "has"
    Task ||--o{ Attachment : "has"
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/v1/auth/register      # User registration
POST   /api/v1/auth/login         # User login
POST   /api/v1/auth/refresh       # Refresh access token
POST   /api/v1/auth/logout        # User logout
GET    /api/v1/auth/profile       # Get user profile
PUT    /api/v1/auth/profile       # Update user profile
POST   /api/v1/auth/change-password # Change password
```

### Projects
```
POST   /api/v1/projects           # Create project
GET    /api/v1/projects           # List user's projects
GET    /api/v1/projects/:id       # Get project by ID
PUT    /api/v1/projects/:id       # Update project
DELETE /api/v1/projects/:id       # Delete project
GET    /api/v1/projects/:id/members # Get project members
POST   /api/v1/projects/:id/members # Add project member
DELETE /api/v1/projects/:id/members/:userId # Remove member
PUT    /api/v1/projects/:id/members/:userId # Update member role
```

### Tasks
```
POST   /api/v1/projects/:projectId/tasks # Create task
GET    /api/v1/projects/:projectId/tasks # List project tasks
GET    /api/v1/tasks/:id           # Get task by ID
PUT    /api/v1/tasks/:id           # Update task
DELETE /api/v1/tasks/:id           # Delete task
POST   /api/v1/tasks/:id/assign    # Assign task
POST   /api/v1/tasks/:id/unassign  # Unassign task
PUT    /api/v1/tasks/:id/status    # Update task status
GET    /api/v1/my-tasks            # Get user's assigned tasks
```

## 🔐 Authentication & Authorization

### JWT Authentication
- **Access Token**: Short-lived (15 minutes) for API requests
- **Refresh Token**: Long-lived (7 days) for token renewal
- **Bearer Token**: Include in Authorization header: `Bearer <token>`

### Role-Based Access Control
- **ADMIN**: Full project control (add/remove members, delete project)
- **MEMBER**: Can create/edit tasks, add comments
- **VIEWER**: Read-only access to project content

### Permission Matrix
| Action | Creator | Admin | Member | Viewer |
|--------|---------|--------|--------|--------|
| View Project | ✅ | ✅ | ✅ | ✅ |
| Edit Project | ✅ | ✅ | ❌ | ❌ |
| Delete Project | ✅ | ❌ | ❌ | ❌ |
| Add Members | ✅ | ✅ | ❌ | ❌ |
| Create Tasks | ✅ | ✅ | ✅ | ❌ |
| Edit Any Task | ✅ | ✅ | ✅ | ❌ |
| Delete Tasks | ✅ | ✅ | Own Only | ❌ |

## 🔄 Real-time Features (WebSocket)

### Connection
Connect to WebSocket with JWT authentication:
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events

#### Task Events
```javascript
// Listen for task updates
socket.on('task:created', (task) => { /* handle */ });
socket.on('task:updated', (task) => { /* handle */ });
socket.on('task:deleted', (data) => { /* handle */ });
socket.on('task:assigned', (data) => { /* handle */ });

// Emit task events
socket.emit('task:create', taskData);
socket.emit('task:update', taskData);
```

#### Comment Events
```javascript
socket.on('comment:created', (comment) => { /* handle */ });
socket.on('comment:updated', (comment) => { /* handle */ });
socket.on('comment:deleted', (data) => { /* handle */ });
```

#### Presence Events
```javascript
socket.on('user:online', (user) => { /* handle */ });
socket.on('user:offline', (user) => { /* handle */ });
socket.on('typing:user_start', (data) => { /* handle */ });
socket.on('typing:user_stop', (data) => { /* handle */ });
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test Structure
```
tests/
├── setup.ts          # Test configuration
├── auth.test.ts       # Authentication tests
├── projects.test.ts   # Project management tests
├── tasks.test.ts      # Task management tests
└── sockets.test.ts    # WebSocket tests
```

### Example Test
```typescript
describe('Task Management', () => {
  it('should create a new task', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/projects/project-id/tasks',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: 'New Task',
        description: 'Task description',
        priority: 'HIGH'
      }
    });

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body).data.title).toBe('New Task');
  });
});
```

## 📈 Monitoring & Logging

### Health Check
```bash
curl http://localhost:3000/health
```

### Logging Levels
- **Error**: Database errors, authentication failures
- **Warn**: Rate limit exceeded, validation failures  
- **Info**: API requests, user actions
- **Debug**: Detailed request/response data (development only)

### Performance Monitoring
- Response time tracking
- Database query performance
- WebSocket connection monitoring
- Memory usage tracking

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://..."

# JWT Configuration
JWT_SECRET="secret-key"
JWT_REFRESH_SECRET="refresh-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
PORT=3000
NODE_ENV="development|production|test"
HOST="0.0.0.0"

# CORS Configuration
ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW="15m"

# Admin Configuration
ADMIN_EMAILS="admin@example.com,admin2@example.com"
```

### Database Configuration
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

## 🚀 Deployment

### Production Build
```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment-specific Configurations
- **Development**: Hot reload, detailed logging, Swagger UI
- **Production**: Optimized builds, minimal logging, security headers
- **Test**: In-memory database, mock external services

## 🤝 Contributing

### Code Style
- **ESLint**: Configured with TypeScript rules
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks
- **Conventional Commits**: Standardized commit messages

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Implement the feature
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@taskmanagement.com
- 📚 Documentation: http://localhost:3000/docs
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

**Made with ❤️ using Node.js, TypeScript, and Fastify**