# Complete File Structure Specification

## Project Root Structure
```
business-app/
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── .env.example
├── .env.local
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── nginx.conf
├── .github/
│   └── workflows/
│       ├── ci-cd.yml
│       ├── security-scan.yml
│       └── deployment.yml
├── docs/
│   ├── architecture/
│   │   ├── 00_system_overview.md
│   │   ├── 01_database_design.md
│   │   ├── 02_api_design.md
│   │   ├── 03_frontend_architecture.md
│   │   ├── 04_security_architecture.md
│   │   ├── 05_system_integration.md
│   │   ├── 06_deployment_architecture.md
│   │   └── 07_file_structure.md
│   ├── api/
│   │   ├── authentication.md
│   │   ├── user-management.md
│   │   ├── project-management.md
│   │   └── task-management.md
│   ├── development/
│   │   ├── setup.md
│   │   ├── coding-standards.md
│   │   ├── testing-guide.md
│   │   └── deployment-guide.md
│   └── user/
│       ├── user-guide.md
│       ├── admin-guide.md
│       └── troubleshooting.md
├── src/
│   ├── shared/
│   │   ├── types/
│   │   ├── constants/
│   │   ├── utils/
│   │   └── schemas/
│   ├── backend/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── config/
│   │   └── app.ts
│   └── frontend/
│       ├── app/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       ├── services/
│       ├── store/
│       ├── styles/
│       ├── types/
│       └── utils/
├── tests/
│   ├── backend/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── fixtures/
│   ├── frontend/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   └── e2e/
│       ├── specs/
│       ├── fixtures/
│       └── support/
├── config/
│   ├── database.ts
│   ├── redis.ts
│   ├── auth.ts
│   ├── cors.ts
│   └── environment.ts
├── scripts/
│   ├── build.sh
│   ├── deploy.sh
│   ├── backup.sh
│   ├── migrate.js
│   └── seed.js
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── images/
│   ├── icons/
│   └── favicon.ico
├── uploads/
│   ├── avatars/
│   ├── documents/
│   └── temp/
├── logs/
│   ├── access.log
│   ├── error.log
│   └── application.log
├── k8s/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── postgres-deployment.yaml
│   ├── redis-deployment.yaml
│   └── ingress.yaml
└── monitoring/
    ├── prometheus.yml
    ├── grafana/
    │   └── dashboards/
    └── alerts/
```

## Shared Types (`src/shared/types/`)

### Core Entity Types
```typescript
// src/shared/types/user.ts
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
  emailVerified: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
  profile?: UserProfile
  organizations: UserOrganization[]
}

export interface UserProfile {
  id: string
  userId: string
  avatarUrl?: string
  bio?: string
  phone?: string
  company?: string
  department?: string
  jobTitle?: string
  timezone: string
  preferences: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface UserOrganization {
  id: string
  userId: string
  organizationId: string
  role: OrganizationRole
  permissions: string[]
  joinedAt: Date
  organization: Organization
}

export type UserRole = 'admin' | 'manager' | 'user'
export type UserStatus = 'active' | 'inactive' | 'suspended'
export type OrganizationRole = 'owner' | 'admin' | 'manager' | 'member'
```

```typescript
// src/shared/types/auth.ts
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  organizationName?: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
}
```

```typescript
// src/shared/types/organization.ts
export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  logoUrl?: string
  websiteUrl?: string
  industry?: string
  size: OrganizationSize
  status: OrganizationStatus
  settings: Record<string, any>
  createdAt: Date
  updatedAt: Date
  members?: UserOrganization[]
  projects?: Project[]
}

export type OrganizationSize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
export type OrganizationStatus = 'active' | 'inactive' | 'suspended'
```

```typescript
// src/shared/types/project.ts
export interface Project {
  id: string
  organizationId: string
  name: string
  description?: string
  status: ProjectStatus
  priority: ProjectPriority
  startDate?: Date
  endDate?: Date
  budget?: number
  metadata: Record<string, any>
  createdBy: string
  createdAt: Date
  updatedAt: Date
  organization: Organization
  creator: User
  tasks?: Task[]
  taskCounts: TaskCounts
}

export interface TaskCounts {
  total: number
  todo: number
  inProgress: number
  review: number
  done: number
  cancelled: number
}

export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled'
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical'
```

```typescript
// src/shared/types/task.ts
export interface Task {
  id: string
  projectId: string
  assignedTo?: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: Date
  estimatedHours?: number
  actualHours?: number
  tags: string[]
  metadata: Record<string, any>
  createdBy: string
  createdAt: Date
  updatedAt: Date
  project: Project
  assignee?: User
  creator: User
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
```

### API Response Types
```typescript
// src/shared/types/api.ts
export interface ApiResponse<T> {
  success: boolean
  data: T
  pagination?: PaginationMeta
  error?: ApiError
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiError {
  code: string
  message: string
  details?: any[]
  timestamp?: string
  requestId?: string
}

export interface ListResponse<T> {
  items: T[]
  pagination: PaginationMeta
}

export interface CreateResponse<T> {
  item: T
  message?: string
}

export interface UpdateResponse<T> {
  item: T
  message?: string
}

export interface DeleteResponse {
  success: boolean
  message?: string
}
```

## Backend Structure (`src/backend/`)

### Controllers
```typescript
// src/backend/controllers/auth-controller.ts
import { Request, Response, NextFunction } from 'express'
import { AuthService } from '@/services/auth-service'
import { ApiResponse } from '@/shared/types/api'
import { AuthResponse, LoginCredentials, RegisterData } from '@/shared/types/auth'

interface AuthRequest extends Request {
  user?: {
    id: string
    role: string
    organizationId?: string
    permissions: string[]
  }
}

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const registerData: RegisterData = req.body
      const result = await this.authService.register(registerData)
      
      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: result,
      }
      
      res.status(201).json(response)
    } catch (error) {
      next(error)
    }
  }

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const credentials: LoginCredentials = req.body
      const result = await this.authService.login(credentials)
      
      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: result,
      }
      
      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body
      const result = await this.authService.refreshToken(refreshToken)
      
      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: result,
      }
      
      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body
      await this.authService.logout(refreshToken)
      
      res.json({
        success: true,
        message: 'Logged out successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  me = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id
      const user = await this.authService.getUserById(userId)
      
      const response: ApiResponse<User> = {
        success: true,
        data: user,
      }
      
      res.json(response)
    } catch (error) {
      next(error)
    }
  }
}
```

### Services
```typescript
// src/backend/services/auth-service.ts
import { User, AuthTokens, LoginCredentials, RegisterData } from '@/shared/types'
import { UserService } from './user-service'
import { TokenService } from './token-service'
import { PasswordService } from './password-service'
import { CacheService } from './cache-service'
import { QueueService } from './queue-service'
import { BadRequestError, UnauthorizedError } from '@/utils/errors'

export class AuthService {
  constructor(
    private userService: UserService,
    private tokenService: TokenService,
    private passwordService: PasswordService,
    private cacheService: CacheService,
    private queueService: QueueService
  ) {}

  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = await this.userService.findByEmail(data.email)
    if (existingUser) {
      throw new BadRequestError('User with this email already exists')
    }

    // Validate password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(data.password)
    if (!passwordValidation.isValid) {
      throw new BadRequestError(`Password validation failed: ${passwordValidation.errors.join(', ')}`)
    }

    // Hash password
    const passwordHash = await this.passwordService.hashPassword(data.password)

    // Create user
    const user = await this.userService.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    }, data.organizationName)

    // Generate tokens
    const tokens = this.tokenService.generateTokenPair(user)

    // Store refresh token
    await this.tokenService.storeRefreshToken(user.id, tokens.refreshToken)

    // Cache user session
    await this.cacheService.setUserSession(user.id, {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizations: user.organizations,
    })

    // Queue welcome email
    await this.queueService.queueWelcomeEmail(user.email, user.firstName)

    return { user, tokens }
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    // Find user by email
    const user = await this.userService.findByEmail(credentials.email)
    if (!user) {
      throw new UnauthorizedError('Invalid email or password')
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new UnauthorizedError('Account is inactive')
    }

    // Verify password
    const isValidPassword = await this.passwordService.verifyPassword(
      credentials.password,
      user.passwordHash
    )
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password')
    }

    // Update last login
    await this.userService.updateLastLogin(user.id)

    // Generate tokens
    const tokens = this.tokenService.generateTokenPair(user)

    // Store refresh token
    await this.tokenService.storeRefreshToken(user.id, tokens.refreshToken)

    // Cache user session
    await this.cacheService.setUserSession(user.id, {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizations: user.organizations,
    })

    return { user, tokens }
  }

  async refreshToken(refreshToken: string): Promise<{ tokens: AuthTokens }> {
    // Verify refresh token
    const decoded = this.tokenService.verifyRefreshToken(refreshToken)

    // Check if token is revoked
    const isRevoked = await this.tokenService.isRefreshTokenRevoked(refreshToken)
    if (isRevoked) {
      throw new UnauthorizedError('Refresh token is revoked')
    }

    // Get user
    const user = await this.userService.findById(decoded.sub)
    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('User not found or inactive')
    }

    // Generate new tokens
    const tokens = this.tokenService.generateTokenPair(user)

    // Revoke old refresh token and store new one
    await this.tokenService.revokeRefreshToken(refreshToken)
    await this.tokenService.storeRefreshToken(user.id, tokens.refreshToken)

    return { tokens }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const decoded = this.tokenService.verifyRefreshToken(refreshToken)
      await this.tokenService.revokeRefreshToken(refreshToken)
      await this.cacheService.deleteUserSession(decoded.sub)
    } catch (error) {
      // Even if token is invalid, we should not throw error on logout
      console.warn('Logout with invalid token:', error)
    }
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userService.findById(userId)
    if (!user) {
      throw new UnauthorizedError('User not found')
    }
    return user
  }
}
```

### Routes
```typescript
// src/backend/routes/auth-routes.ts
import { Router } from 'express'
import { AuthController } from '@/controllers/auth-controller'
import { AuthService } from '@/services/auth-service'
import { validateRequest } from '@/middleware/validation-middleware'
import { authLimiter } from '@/middleware/rate-limit-middleware'
import { AuthMiddleware } from '@/middleware/auth-middleware'
import { loginSchema, registerSchema } from '@/schemas/auth-schemas'

export function createAuthRoutes(
  authService: AuthService,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router()
  const authController = new AuthController(authService)

  // Public routes
  router.post('/register', 
    authLimiter,
    validateRequest(registerSchema),
    authController.register
  )

  router.post('/login',
    authLimiter,
    validateRequest(loginSchema),
    authController.login
  )

  router.post('/refresh',
    authLimiter,
    authController.refresh
  )

  router.post('/logout',
    authController.logout
  )

  // Protected routes
  router.get('/me',
    authMiddleware.authenticate,
    authController.me
  )

  return router
}
```

## Frontend Structure (`src/frontend/`)

### App Directory (Next.js 14)
```typescript
// src/frontend/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Business App',
  description: 'A comprehensive business management application',
  keywords: ['business', 'project management', 'productivity'],
  authors: [{ name: 'Your Company' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
```

```typescript
// src/frontend/app/(auth)/login/page.tsx
'use client'

import { Suspense } from 'react'
import { LoginForm } from '@/components/features/auth/login-form'
import { AuthLayout } from '@/components/layout/auth-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
```

```typescript
// src/frontend/app/(dashboard)/projects/page.tsx
import { Suspense } from 'react'
import { Metadata } from 'next'
import { ProjectList } from '@/components/features/projects/project-list'
import { ProjectFilters } from '@/components/features/projects/project-filters'
import { CreateProjectButton } from '@/components/features/projects/create-project-button'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = {
  title: 'Projects - Business App',
  description: 'Manage your projects and track progress',
}

export default function ProjectsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Projects"
          description="Manage and track your project progress"
          actions={<CreateProjectButton />}
        />
        
        <div className="space-y-4">
          <ProjectFilters />
          <Suspense fallback={<div>Loading projects...</div>}>
            <ProjectList />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  )
}
```

### Components Structure
```typescript
// src/frontend/components/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/hooks/use-auth'
import { WebSocketProvider } from '@/hooks/use-websocket'
import { TooltipProvider } from '@/components/ui/tooltip'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <AuthProvider>
            <WebSocketProvider>
              {children}
            </WebSocketProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

## Testing Structure (`tests/`)

### Backend Tests
```typescript
// tests/backend/unit/services/auth-service.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { AuthService } from '@/services/auth-service'
import { UserService } from '@/services/user-service'
import { TokenService } from '@/services/token-service'
import { BadRequestError, UnauthorizedError } from '@/utils/errors'

describe('AuthService', () => {
  let authService: AuthService
  let mockUserService: jest.Mocked<UserService>
  let mockTokenService: jest.Mocked<TokenService>

  beforeEach(() => {
    mockUserService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      updateLastLogin: jest.fn(),
    } as any

    mockTokenService = {
      generateTokenPair: jest.fn(),
      verifyRefreshToken: jest.fn(),
      storeRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
      isRefreshTokenRevoked: jest.fn(),
    } as any

    authService = new AuthService(
      mockUserService,
      mockTokenService,
      // ... other mocked services
    )
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      }

      mockUserService.findByEmail.mockResolvedValue(null)
      mockUserService.create.mockResolvedValue(mockUser)
      mockTokenService.generateTokenPair.mockReturnValue(mockTokens)

      const result = await authService.register(registerData)

      expect(result.user).toBeDefined()
      expect(result.tokens).toBeDefined()
      expect(mockUserService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerData.email,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
        }),
        undefined
      )
    })

    it('should throw error if user already exists', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      }

      mockUserService.findByEmail.mockResolvedValue(mockUser)

      await expect(authService.register(registerData)).rejects.toThrow(
        BadRequestError
      )
    })
  })

  // More test cases...
})
```

### Frontend Tests
```typescript
// tests/frontend/components/auth/login-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/features/auth/login-form'
import { useAuth } from '@/hooks/use-auth'
import { TestWrapper } from '@/tests/utils/test-wrapper'

// Mock the auth hook
jest.mock('@/hooks/use-auth')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('LoginForm', () => {
  const mockLogin = jest.fn()

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      user: null,
      isAuthenticated: false,
      // ... other auth properties
    } as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders login form correctly', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('submits form with valid credentials', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('displays validation errors for invalid input', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    )

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })
})
```

### E2E Tests
```typescript
// tests/e2e/specs/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should show error message with invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[data-testid="email-input"]', 'invalid@example.com')
    await page.fill('[data-testid="password-input"]', 'wrongpassword')
    await page.click('[data-testid="login-button"]')

    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Invalid email or password'
    )
  })

  test('should register new user successfully', async ({ page }) => {
    await page.goto('/register')

    await page.fill('[data-testid="first-name-input"]', 'John')
    await page.fill('[data-testid="last-name-input"]', 'Doe')
    await page.fill('[data-testid="email-input"]', 'newuser@example.com')
    await page.fill('[data-testid="password-input"]', 'Password123!')
    await page.click('[data-testid="register-button"]')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText(
      'Welcome, John!'
    )
  })
})
```

## Configuration Files

### Package.json
```json
{
  "name": "business-app",
  "version": "1.0.0",
  "description": "A comprehensive business management application",
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "nodemon --exec ts-node src/backend/app.ts",
    "dev:frontend": "next dev src/frontend",
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "tsc -p src/backend/tsconfig.json",
    "build:frontend": "next build src/frontend",
    "start": "npm run start:backend",
    "start:backend": "node dist/backend/app.js",
    "start:frontend": "next start src/frontend",
    "test": "jest",
    "test:backend": "jest --config tests/backend/jest.config.js",
    "test:frontend": "jest --config tests/frontend/jest.config.js",
    "test:e2e": "playwright test",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:prod": "prisma migrate deploy",
    "prisma:seed": "ts-node prisma/seed.ts",
    "docker:build": "docker-compose build",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down"
  },
  "dependencies": {
    "@prisma/client": "^5.7.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-slot": "^1.0.2",
    "@tanstack/react-query": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.2",
    "lucide-react": "^0.294.0",
    "next": "^14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.48.2",
    "socket.io": "^4.7.4",
    "socket.io-client": "^4.7.4",
    "tailwind-merge": "^2.1.0",
    "tailwindcss-animate": "^1.0.7",
    "winston": "^3.11.0",
    "zod": "^3.22.4",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.1",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.8",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.38",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.13.1",
    "@typescript-eslint/parser": "^6.13.1",
    "autoprefixer": "^10.4.16",
    "concurrently": "^8.2.2",
    "eslint": "^8.54.0",
    "eslint-config-next": "^14.0.4",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "nodemon": "^3.0.2",
    "postcss": "^8.4.32",
    "prettier": "^3.1.0",
    "prisma": "^5.7.0",
    "tailwindcss": "^3.3.6",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.1",
    "typescript": "^5.3.2"
  }
}
```

This comprehensive file structure provides a solid foundation for the web-based business application with clear separation of concerns, proper organization, and scalability considerations.