# Project Structure - Task Management Platform

## 1. ROOT DIRECTORY STRUCTURE

```
task-management-platform/
├── README.md                    # Project overview and setup instructions
├── .gitignore                   # Git ignore patterns
├── .env.example                 # Environment variables template
├── docker-compose.yml           # Development environment
├── docker-compose.prod.yml      # Production environment
├── package.json                 # Root package.json for scripts
├── turbo.json                   # Turborepo configuration (if using monorepo)
│
├── frontend/                    # React TypeScript frontend
│   ├── public/                  # Static assets
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   ├── src/                     # Source code
│   │   ├── components/          # Reusable components
│   │   ├── pages/               # Page components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── store/               # Zustand state management
│   │   ├── services/            # API services
│   │   ├── types/               # TypeScript definitions
│   │   ├── utils/               # Utility functions
│   │   ├── styles/              # Global styles and theme
│   │   ├── assets/              # Static assets
│   │   ├── App.tsx              # Main app component
│   │   ├── main.tsx             # App entry point
│   │   └── vite-env.d.ts        # Vite type definitions
│   ├── __tests__/               # Test files
│   ├── package.json             # Frontend dependencies
│   ├── tsconfig.json            # TypeScript configuration
│   ├── vite.config.ts           # Vite configuration
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   ├── .eslintrc.json           # ESLint configuration
│   ├── .prettierrc              # Prettier configuration
│   └── Dockerfile               # Frontend container
│
├── backend/                     # Node.js Fastify backend
│   ├── src/                     # Source code
│   │   ├── routes/              # API route handlers
│   │   ├── services/            # Business logic services
│   │   ├── middleware/          # Custom middleware
│   │   ├── lib/                 # Utility libraries
│   │   ├── types/               # TypeScript definitions
│   │   ├── validators/          # Input validation schemas
│   │   ├── plugins/             # Fastify plugins
│   │   ├── websocket/           # WebSocket handlers
│   │   ├── app.ts               # Fastify app setup
│   │   └── server.ts            # Server entry point
│   ├── prisma/                  # Database schema and migrations
│   │   ├── schema.prisma        # Prisma schema
│   │   ├── migrations/          # Database migrations
│   │   └── seed.ts              # Database seeding
│   ├── __tests__/               # Test files
│   ├── uploads/                 # File upload directory
│   ├── package.json             # Backend dependencies
│   ├── tsconfig.json            # TypeScript configuration
│   ├── .eslintrc.json           # ESLint configuration
│   ├── .prettierrc              # Prettier configuration
│   ├── jest.config.js           # Jest test configuration
│   └── Dockerfile               # Backend container
│
├── database/                    # Database configuration
│   ├── init-scripts/            # Database initialization
│   │   └── 01-init.sql
│   ├── backup/                  # Backup directory
│   ├── postgresql.conf          # PostgreSQL configuration
│   ├── pg_hba.conf              # PostgreSQL access control
│   └── Dockerfile               # Database container
│
├── nginx/                       # Reverse proxy configuration
│   ├── nginx.conf               # Main nginx configuration
│   ├── conf.d/                  # Server configurations
│   │   └── default.conf
│   └── ssl/                     # SSL certificates
│
├── scripts/                     # Utility scripts
│   ├── backup.sh                # Database backup script
│   ├── restore.sh               # Database restore script
│   ├── deploy.sh                # Deployment script
│   └── setup-dev.sh             # Development setup script
│
├── docs/                        # Documentation
│   ├── architecture/            # Architecture documentation
│   ├── api/                     # API documentation
│   ├── deployment/              # Deployment guides
│   └── development/             # Development guides
│
├── .github/                     # GitHub configuration
│   ├── workflows/               # GitHub Actions
│   │   ├── ci.yml               # Continuous integration
│   │   ├── cd.yml               # Continuous deployment
│   │   └── pr-checks.yml        # Pull request checks
│   ├── ISSUE_TEMPLATE/          # Issue templates
│   └── PULL_REQUEST_TEMPLATE.md # PR template
│
└── monitoring/                  # Monitoring configuration
    ├── prometheus/              # Prometheus configuration
    ├── grafana/                 # Grafana dashboards
    └── docker-compose.monitor.yml
```

## 2. DETAILED FRONTEND STRUCTURE

```
frontend/src/
├── components/
│   ├── common/                  # Generic reusable components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   ├── Modal/
│   │   ├── LoadingSpinner/
│   │   ├── ErrorBoundary/
│   │   ├── ConfirmDialog/
│   │   └── DataTable/
│   │
│   ├── forms/                   # Form components
│   │   ├── FormField/
│   │   ├── DatePicker/
│   │   ├── FileUpload/
│   │   └── ValidationMessage/
│   │
│   ├── layout/                  # Layout components
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   ├── Footer/
│   │   ├── Navigation/
│   │   └── MainLayout/
│   │
│   ├── auth/                    # Authentication components
│   │   ├── LoginForm/
│   │   ├── RegisterForm/
│   │   ├── ProtectedRoute/
│   │   └── AuthProvider/
│   │
│   ├── projects/                # Project-specific components
│   │   ├── ProjectCard/
│   │   ├── ProjectList/
│   │   ├── ProjectForm/
│   │   ├── ProjectSettings/
│   │   └── MemberManagement/
│   │
│   ├── tasks/                   # Task-specific components
│   │   ├── TaskCard/
│   │   ├── TaskList/
│   │   ├── TaskBoard/           # Kanban board
│   │   ├── TaskForm/
│   │   ├── TaskDetail/
│   │   ├── TaskComments/
│   │   └── TaskFilters/
│   │
│   └── ui/                      # UI-specific components
│       ├── Badge/
│       ├── Avatar/
│       ├── Tooltip/
│       ├── Notification/
│       └── StatusIndicator/
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   └── ResetPasswordPage.tsx
│   │
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   │
│   ├── projects/
│   │   ├── ProjectsPage.tsx
│   │   ├── ProjectDetailPage.tsx
│   │   ├── CreateProjectPage.tsx
│   │   └── ProjectSettingsPage.tsx
│   │
│   ├── tasks/
│   │   ├── TasksPage.tsx
│   │   ├── TaskDetailPage.tsx
│   │   ├── CreateTaskPage.tsx
│   │   └── TaskBoardPage.tsx
│   │
│   └── profile/
│       └── ProfilePage.tsx
│
├── hooks/
│   ├── api/                     # API-related hooks
│   │   ├── useProjects.ts
│   │   ├── useTasks.ts
│   │   ├── useUsers.ts
│   │   └── useComments.ts
│   │
│   ├── auth/                    # Authentication hooks
│   │   ├── useAuth.ts
│   │   └── usePermissions.ts
│   │
│   └── utils/                   # Utility hooks
│       ├── useLocalStorage.ts
│       ├── useDebounce.ts
│       ├── useWebSocket.ts
│       └── useKeyboardShortcuts.ts
│
├── store/                       # Zustand state management
│   ├── auth.ts                  # Authentication state
│   ├── projects.ts              # Projects state
│   ├── tasks.ts                 # Tasks state
│   ├── ui.ts                    # UI state (modals, notifications)
│   ├── comments.ts              # Comments state
│   └── index.ts                 # Store composition
│
├── services/
│   ├── api/                     # API services
│   │   ├── client.ts            # Axios client configuration
│   │   ├── auth.ts              # Authentication API
│   │   ├── projects.ts          # Projects API
│   │   ├── tasks.ts             # Tasks API
│   │   ├── users.ts             # Users API
│   │   └── upload.ts            # File upload API
│   │
│   ├── websocket/               # WebSocket services
│   │   ├── socketService.ts
│   │   └── eventHandlers.ts
│   │
│   └── storage/                 # Storage utilities
│       ├── localStorage.ts
│       └── sessionStorage.ts
│
├── types/
│   ├── api.ts                   # API response types
│   ├── auth.ts                  # Authentication types
│   ├── entities.ts              # Entity types (User, Project, Task)
│   ├── ui.ts                    # UI-related types
│   └── global.d.ts              # Global type declarations
│
├── utils/
│   ├── constants.ts             # Application constants
│   ├── helpers.ts               # Helper functions
│   ├── validation.ts            # Validation schemas (Zod)
│   ├── formatters.ts            # Data formatting utilities
│   ├── permissions.ts           # Permission checking utilities
│   └── errorHandling.ts         # Error handling utilities
│
├── styles/
│   ├── theme.ts                 # MUI theme configuration
│   ├── global.css               # Global CSS styles
│   ├── variables.css            # CSS custom properties
│   └── components.css           # Component-specific styles
│
└── assets/
    ├── images/
    │   ├── logo.svg
    │   ├── icons/
    │   └── illustrations/
    │
    └── fonts/
        └── custom-fonts/
```

## 3. DETAILED BACKEND STRUCTURE

```
backend/src/
├── routes/
│   ├── auth.ts                  # Authentication routes
│   ├── users.ts                 # User management routes
│   ├── projects.ts              # Project routes
│   ├── tasks.ts                 # Task routes
│   ├── comments.ts              # Comment routes
│   ├── labels.ts                # Label routes
│   ├── uploads.ts               # File upload routes
│   ├── dashboard.ts             # Dashboard routes
│   ├── health.ts                # Health check routes
│   └── index.ts                 # Route registration
│
├── services/
│   ├── auth/                    # Authentication services
│   │   ├── authService.ts
│   │   ├── tokenService.ts
│   │   ├── passwordService.ts
│   │   └── emailService.ts
│   │
│   ├── projects/                # Project services
│   │   ├── projectService.ts
│   │   ├── memberService.ts
│   │   └── permissionService.ts
│   │
│   ├── tasks/                   # Task services
│   │   ├── taskService.ts
│   │   ├── commentService.ts
│   │   ├── labelService.ts
│   │   └── attachmentService.ts
│   │
│   ├── users/                   # User services
│   │   └── userService.ts
│   │
│   ├── notifications/           # Notification services
│   │   ├── notificationService.ts
│   │   ├── emailNotifications.ts
│   │   └── realTimeNotifications.ts
│   │
│   └── analytics/               # Analytics services
│       ├── dashboardService.ts
│       └── reportingService.ts
│
├── middleware/
│   ├── auth.ts                  # Authentication middleware
│   ├── validation.ts            # Request validation middleware
│   ├── errorHandler.ts          # Error handling middleware
│   ├── rateLimiter.ts           # Rate limiting middleware
│   ├── logger.ts                # Logging middleware
│   ├── cors.ts                  # CORS middleware
│   └── permissions.ts           # Permission checking middleware
│
├── lib/
│   ├── prisma.ts                # Prisma client configuration
│   ├── redis.ts                 # Redis client configuration
│   ├── email.ts                 # Email client setup
│   ├── upload.ts                # File upload configuration
│   ├── logger.ts                # Logger configuration
│   └── config.ts                # Application configuration
│
├── types/
│   ├── auth.ts                  # Authentication types
│   ├── api.ts                   # API request/response types
│   ├── database.ts              # Database types
│   ├── websocket.ts             # WebSocket types
│   └── global.d.ts              # Global type declarations
│
├── validators/
│   ├── auth.ts                  # Authentication validation schemas
│   ├── projects.ts              # Project validation schemas
│   ├── tasks.ts                 # Task validation schemas
│   ├── users.ts                 # User validation schemas
│   └── common.ts                # Common validation schemas
│
├── plugins/
│   ├── auth.ts                  # Authentication plugin
│   ├── cors.ts                  # CORS plugin
│   ├── rateLimit.ts             # Rate limiting plugin
│   ├── swagger.ts               # API documentation plugin
│   └── websocket.ts             # WebSocket plugin
│
├── websocket/
│   ├── socketHandlers.ts        # WebSocket event handlers
│   ├── roomManager.ts           # Room management
│   ├── authMiddleware.ts        # WebSocket authentication
│   └── eventTypes.ts            # WebSocket event types
│
├── utils/
│   ├── constants.ts             # Application constants
│   ├── helpers.ts               # Helper functions
│   ├── encryption.ts            # Encryption utilities
│   ├── validation.ts            # Validation utilities
│   └── formatting.ts            # Data formatting utilities
│
├── app.ts                       # Fastify app configuration
└── server.ts                    # Server entry point
```

## 4. DATABASE STRUCTURE

```
database/
├── prisma/
│   ├── schema.prisma            # Main Prisma schema
│   ├── migrations/              # Database migrations
│   │   ├── 20240101000000_init/
│   │   ├── 20240102000000_add_tasks/
│   │   └── migration_lock.toml
│   └── seed.ts                  # Database seeding script
│
├── init-scripts/
│   ├── 01-init.sql              # Initial database setup
│   ├── 02-extensions.sql        # PostgreSQL extensions
│   └── 03-indexes.sql           # Additional indexes
│
├── backups/                     # Database backups
│   └── .gitkeep
│
├── postgresql.conf              # PostgreSQL configuration
├── pg_hba.conf                  # Access control configuration
└── Dockerfile                   # Database container
```

## 5. CONFIGURATION FILES

### Package.json (Root)
```json
{
  "name": "task-management-platform",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend"
  ],
  "scripts": {
    "dev": "docker-compose up -d",
    "dev:down": "docker-compose down",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces",
    "type-check": "npm run type-check --workspaces",
    "db:migrate": "cd backend && npx prisma migrate dev",
    "db:studio": "cd backend && npx prisma studio",
    "db:seed": "cd backend && npx prisma db seed",
    "setup": "./scripts/setup-dev.sh"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^4.9.0"
  }
}
```

### Development Setup Script
```bash
#!/bin/bash
# scripts/setup-dev.sh

set -e

echo "🚀 Setting up Task Management Platform development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if required files exist
if [ ! -f ".env" ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Please update .env file with your configuration"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build and start services
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "🗄️  Running database migrations..."
cd backend && npx prisma migrate dev --name init

# Seed database
echo "🌱 Seeding database..."
npx prisma db seed

# Start development servers
echo "🚀 Starting development servers..."
cd ../
docker-compose up -d

echo "✅ Development environment is ready!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3000"
echo "🗄️  Database: localhost:5432"
echo "💾 Redis: localhost:6379"
echo "📊 Prisma Studio: npm run db:studio"
```

## 6. TESTING STRUCTURE

```
__tests__/
├── frontend/
│   ├── components/
│   │   ├── common/
│   │   ├── projects/
│   │   └── tasks/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── store/
│   └── utils/
│
├── backend/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── utils/
│   └── integration/
│
├── e2e/                         # End-to-end tests
│   ├── auth/
│   ├── projects/
│   ├── tasks/
│   └── fixtures/
│
├── __mocks__/                   # Mock files
│   ├── api/
│   ├── data/
│   └── services/
│
└── setup/                       # Test setup files
    ├── setupTests.ts
    ├── testUtils.tsx
    └── mockServer.ts
```

This comprehensive project structure provides a well-organized, scalable foundation for the task management platform with clear separation of concerns, proper testing structure, and development-friendly organization.