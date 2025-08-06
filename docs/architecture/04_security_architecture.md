# Security Architecture

## Authentication & Authorization

### JWT Implementation

#### Token Structure
```typescript
// types/auth.ts
interface AccessToken {
  iss: string        // Issuer
  sub: string        // Subject (user ID)
  aud: string        // Audience
  exp: number        // Expiration time
  iat: number        // Issued at
  jti: string        // JWT ID
  scope: string      // Token scope
  role: UserRole     // User role
  org_id?: string    // Current organization
  permissions: string[] // Specific permissions
}

interface RefreshToken {
  iss: string
  sub: string
  type: 'refresh'
  exp: number
  iat: number
  jti: string
}
```

#### Token Management
```typescript
// services/token-service.ts
import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'

export class TokenService {
  private readonly ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET!
  private readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET!
  private readonly ACCESS_TOKEN_EXPIRY = '15m'
  private readonly REFRESH_TOKEN_EXPIRY = '7d'

  generateTokenPair(user: User, organizationId?: string): AuthTokens {
    const jti = randomBytes(16).toString('hex')
    const refreshJti = randomBytes(16).toString('hex')

    const accessToken = jwt.sign(
      {
        iss: 'business-app',
        sub: user.id,
        aud: 'business-app-client',
        jti,
        scope: 'read write',
        role: user.role,
        org_id: organizationId,
        permissions: this.getUserPermissions(user, organizationId),
      },
      this.ACCESS_TOKEN_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY }
    )

    const refreshToken = jwt.sign(
      {
        iss: 'business-app',
        sub: user.id,
        type: 'refresh',
        jti: refreshJti,
      },
      this.REFRESH_TOKEN_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    )

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
      tokenType: 'Bearer',
    }
  }

  verifyAccessToken(token: string): AccessToken {
    return jwt.verify(token, this.ACCESS_TOKEN_SECRET) as AccessToken
  }

  verifyRefreshToken(token: string): RefreshToken {
    return jwt.verify(token, this.REFRESH_TOKEN_SECRET) as RefreshToken
  }

  private getUserPermissions(user: User, organizationId?: string): string[] {
    const permissions: string[] = []
    
    // Base permissions for all users
    permissions.push('read:profile', 'write:profile')
    
    if (organizationId) {
      const membership = user.organizations.find(org => org.id === organizationId)
      if (membership) {
        switch (membership.role) {
          case 'owner':
            permissions.push(
              'read:*', 'write:*', 'delete:*',
              'manage:organization', 'manage:users'
            )
            break
          case 'admin':
            permissions.push(
              'read:*', 'write:*',
              'manage:projects', 'manage:tasks'
            )
            break
          case 'manager':
            permissions.push(
              'read:projects', 'write:projects',
              'read:tasks', 'write:tasks'
            )
            break
          case 'member':
            permissions.push(
              'read:projects', 'read:tasks', 'write:tasks'
            )
            break
        }
      }
    }
    
    return permissions
  }
}
```

### Role-Based Access Control (RBAC)

#### Permission System
```typescript
// middleware/auth-middleware.ts
import { Request, Response, NextFunction } from 'express'
import { TokenService } from '@/services/token-service'

interface AuthRequest extends Request {
  user?: {
    id: string
    role: UserRole
    organizationId?: string
    permissions: string[]
  }
}

export class AuthMiddleware {
  constructor(private tokenService: TokenService) {}

  authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const token = this.extractToken(req)
      if (!token) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        })
      }

      const decoded = this.tokenService.verifyAccessToken(token)
      req.user = {
        id: decoded.sub,
        role: decoded.role,
        organizationId: decoded.org_id,
        permissions: decoded.permissions,
      }

      next()
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
      })
    }
  }

  authorize = (permissions: string[] | string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        })
      }

      const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions]
      const userPermissions = req.user.permissions

      const hasPermission = requiredPermissions.some(permission => {
        // Check for wildcard permissions
        if (userPermissions.includes('read:*') && permission.startsWith('read:')) return true
        if (userPermissions.includes('write:*') && permission.startsWith('write:')) return true
        if (userPermissions.includes('delete:*') && permission.startsWith('delete:')) return true
        
        // Check for exact permission
        return userPermissions.includes(permission)
      })

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
        })
      }

      next()
    }
  }

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }
    return null
  }
}
```

### Password Security

```typescript
// services/password-service.ts
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

export class PasswordService {
  private readonly SALT_ROUNDS = 12

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.SALT_ROUNDS)
    return bcrypt.hash(password, salt)
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  validatePasswordStrength(password: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    // Check against common passwords
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890'
    ]

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  generateResetToken(): string {
    return randomBytes(32).toString('hex')
  }
}
```

## Input Validation & Sanitization

### Request Validation
```typescript
// middleware/validation-middleware.ts
import { Request, Response, NextFunction } from 'express'
import { AnyZodObject, ZodError } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

export const validateRequest = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize input
      req.body = sanitizeObject(req.body)
      req.query = sanitizeObject(req.query)
      req.params = sanitizeObject(req.params)

      // Validate against schema
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      })

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }))

        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: validationErrors,
          }
        })
      }

      next(error)
    }
  }
}

function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeValue(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }

  const sanitized: any = {}
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value)
  }
  return sanitized
}

function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    // Remove XSS attempts
    let sanitized = DOMPurify.sanitize(value)
    
    // Escape HTML entities
    sanitized = validator.escape(sanitized)
    
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '')
    
    return sanitized
  }
  return value
}
```

### Schema Definitions
```typescript
// schemas/auth-schemas.ts
import { z } from 'zod'

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').toLowerCase(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    organizationName: z.string().max(200).optional(),
  })
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  })
})

// schemas/project-schemas.ts
export const createProjectSchema = z.object({
  body: z.object({
    organizationId: z.string().uuid('Invalid organization ID'),
    name: z.string().min(1, 'Project name is required').max(200),
    description: z.string().max(1000).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    budget: z.number().positive().optional(),
  })
})
```

## SQL Injection Prevention

### Parameterized Queries with Prisma
```typescript
// services/user-service.ts
import { PrismaClient } from '@prisma/client'

export class UserService {
  constructor(private prisma: PrismaClient) {}

  async findUserByEmail(email: string) {
    // Prisma automatically parameterizes queries
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        organizations: {
          include: {
            organization: true,
          }
        }
      }
    })
  }

  async searchUsers(searchTerm: string, organizationId: string, limit: number = 20) {
    return this.prisma.user.findMany({
      where: {
        AND: [
          {
            organizations: {
              some: {
                organizationId: organizationId
              }
            }
          },
          {
            OR: [
              { firstName: { contains: searchTerm, mode: 'insensitive' } },
              { lastName: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } }
            ]
          }
        ]
      },
      take: limit,
      include: {
        profile: true
      }
    })
  }
}
```

## XSS Protection

### Content Security Policy
```typescript
// middleware/security-middleware.ts
import { Request, Response, NextFunction } from 'express'
import helmet from 'helmet'

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'", "'unsafe-eval'"], // Needed for development
        connectSrc: ["'self'", "https://api.yourdomain.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),

  // Additional security headers
  (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    next()
  }
]
```

### Output Encoding
```typescript
// utils/html-sanitizer.ts
import DOMPurify from 'isomorphic-dompurify'

export class HtmlSanitizer {
  static sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'target'],
      ALLOW_DATA_ATTR: false,
    })
  }

  static sanitizeText(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  static allowedRichText(content: string): string {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'strong', 'em', 'u', 's',
        'ul', 'ol', 'li',
        'a', 'img',
        'blockquote', 'code', 'pre'
      ],
      ALLOWED_ATTR: [
        'href', 'target', 'rel',
        'src', 'alt', 'width', 'height',
        'class'
      ],
    })
  }
}
```

## CORS Configuration

```typescript
// config/cors.ts
import cors from 'cors'

const allowedOrigins = [
  'http://localhost:3000', // Development frontend
  'https://yourdomain.com', // Production frontend
  'https://app.yourdomain.com', // Production app
]

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Version',
    'X-Request-ID'
  ],
  exposedHeaders: [
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset',
    'X-Response-Time'
  ],
  maxAge: 86400, // 24 hours
}
```

## Rate Limiting

```typescript
// middleware/rate-limit-middleware.ts
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

// General API rate limiting
export const generalLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:general:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Authentication rate limiting
export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMITED',
      message: 'Too many authentication attempts, please try again later',
    }
  },
  skipSuccessfulRequests: true, // Don't count successful requests
})

// Strict rate limiting for sensitive operations
export const strictLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:strict:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: {
    success: false,
    error: {
      code: 'STRICT_RATE_LIMITED',
      message: 'Rate limit exceeded for sensitive operation',
    }
  }
})
```

## Session Security

```typescript
// config/session.ts
import session from 'express-session'
import RedisStore from 'connect-redis'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

export const sessionConfig = session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET!,
  name: 'business-app.sid',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict', // CSRF protection
  },
})
```

## API Security Best Practices

### Request Logging & Monitoring
```typescript
// middleware/logging-middleware.ts
import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

interface SecurityEvent {
  timestamp: string
  requestId: string
  ip: string
  userAgent: string
  method: string
  url: string
  userId?: string
  organizationId?: string
  statusCode: number
  responseTime: number
  suspicious?: boolean
  reason?: string
}

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4()
  const startTime = Date.now()
  
  req.headers['x-request-id'] = requestId
  res.setHeader('X-Request-ID', requestId)

  const originalSend = res.send
  res.send = function(body) {
    const endTime = Date.now()
    const responseTime = endTime - startTime

    const event: SecurityEvent = {
      timestamp: new Date().toISOString(),
      requestId,
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
      method: req.method,
      url: req.originalUrl,
      userId: (req as any).user?.id,
      organizationId: (req as any).user?.organizationId,
      statusCode: res.statusCode,
      responseTime,
    }

    // Detect suspicious activity
    if (responseTime > 5000) {
      event.suspicious = true
      event.reason = 'Slow response time'
    }

    if (res.statusCode >= 400) {
      event.suspicious = true
      event.reason = `HTTP ${res.statusCode} error`
    }

    // Log security events
    console.log('SECURITY_EVENT:', JSON.stringify(event))

    return originalSend.call(this, body)
  }

  next()
}
```

### Environment Variables Security
```typescript
// config/env-validation.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_SSL: z.enum(['true', 'false']).transform(val => val === 'true'),
  
  // Redis
  REDIS_URL: z.string().url(),
  
  // JWT Secrets
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  
  // Session
  SESSION_SECRET: z.string().min(32),
  
  // External APIs
  SENDGRID_API_KEY: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  
  // URLs
  FRONTEND_URL: z.string().url(),
  BACKEND_URL: z.string().url(),
})

export const validateEnv = () => {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error('❌ Invalid environment variables:', error)
    process.exit(1)
  }
}
```

## Security Monitoring & Alerts

```typescript
// services/security-monitor.ts
export class SecurityMonitor {
  private static readonly SUSPICIOUS_PATTERNS = [
    /union.*select/i,
    /<script.*>/i,
    /javascript:/i,
    /eval\(/i,
    /document\.cookie/i,
  ]

  static detectSuspiciousInput(input: string): boolean {
    return this.SUSPICIOUS_PATTERNS.some(pattern => pattern.test(input))
  }

  static async logSecurityIncident(incident: {
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    ip: string
    userAgent: string
    userId?: string
    metadata?: Record<string, any>
  }) {
    // Log to database
    console.error('SECURITY_INCIDENT:', incident)
    
    // Alert if critical
    if (incident.severity === 'critical') {
      // Send alert to security team
      await this.sendSecurityAlert(incident)
    }
  }

  private static async sendSecurityAlert(incident: any) {
    // Implementation for sending alerts (email, Slack, etc.)
  }
}
```

This comprehensive security architecture provides multiple layers of protection including authentication, authorization, input validation, XSS prevention, SQL injection protection, rate limiting, and security monitoring.