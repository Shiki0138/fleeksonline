# Fleeks Backend API

A comprehensive backend API server built with Node.js, Express, TypeScript, PostgreSQL, and Redis for the Fleeks business application platform.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Database**: PostgreSQL with comprehensive schema and migrations
- **Caching**: Redis for session management and caching
- **Validation**: Comprehensive input validation and sanitization
- **Security**: OWASP Top 10 compliance, rate limiting, security headers
- **Logging**: Structured logging with Winston
- **Testing**: Unit and integration tests with Jest
- **TypeScript**: Full type safety and modern ES features
- **Error Handling**: Centralized error handling with custom error types

## 📋 Architecture

### Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 14+
- **Cache**: Redis 6+
- **Testing**: Jest + Supertest
- **Validation**: express-validator + Joi
- **Authentication**: JWT + bcrypt

### Database Schema
- **Users**: User accounts with role-based permissions
- **Organizations**: Multi-tenant organization structure
- **Projects**: Project management with team assignments
- **Tasks**: Task tracking with dependencies and comments
- **Activity Logs**: Comprehensive audit trail
- **Notifications**: Real-time notification system

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 14 or higher
- Redis 6 or higher
- npm or yarn

### Environment Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database setup**:
   ```bash
   # Create database
   createdb fleeks_db
   
   # Run migrations
   npm run migrate
   
   # Seed initial data
   npm run seed
   ```

4. **Start Redis**:
   ```bash
   redis-server
   ```

### Development

```bash
# Start development server with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <access_token>
```

#### Change Password
```http
POST /auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "oldPassword",
  "newPassword": "newSecurePassword123!"
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <access_token>
```

### User Management Endpoints

#### Get All Users (Admin only)
```http
GET /users?page=1&limit=20&search=john&role=user
Authorization: Bearer <access_token>
```

#### Get User by ID
```http
GET /users/{userId}
Authorization: Bearer <access_token>
```

#### Update User
```http
PUT /users/{userId}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com"
}
```

### Organization Endpoints

#### Get Organizations
```http
GET /organizations?page=1&limit=20
Authorization: Bearer <access_token>
```

#### Create Organization
```http
POST /organizations
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Tech Startup Inc",
  "description": "Innovative technology solutions",
  "website": "https://techstartup.com",
  "industry": "Technology",
  "size": "startup"
}
```

#### Get Organization Details
```http
GET /organizations/{organizationId}
Authorization: Bearer <access_token>
```

#### Add Organization Member
```http
POST /organizations/{organizationId}/members
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "userId": "user-uuid",
  "role": "member"
}
```

## 🔒 Security Features

### Authentication
- JWT tokens with configurable expiration
- Refresh token rotation
- Password hashing with bcrypt (12 rounds)
- Token blacklisting on logout

### Authorization
- Role-based access control (admin, manager, user)
- Resource-level permissions
- Organization membership verification

### Security Headers
- CORS configuration
- Helmet.js security headers
- XSS protection
- Content type validation

### Rate Limiting
- Configurable rate limits per IP
- Different limits for different endpoints
- Redis-backed rate limiting

### Input Validation
- Comprehensive validation schemas
- SQL injection prevention
- Data sanitization
- File upload restrictions

## 📊 Monitoring & Logging

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking with stack traces
- Performance monitoring

### Health Checks
```http
GET /health
```

Returns:
```json
{
  "status": "OK",
  "timestamp": "2023-12-01T10:00:00.000Z",
  "uptime": 3600,
  "version": "v1"
}
```

## 🧪 Testing

### Test Structure
```
tests/
├── setup.ts              # Test configuration
├── unit/                 # Unit tests
│   ├── AuthService.test.ts
│   └── ...
└── integration/          # Integration tests
    ├── auth.test.ts
    └── ...
```

### Running Tests
```bash
# All tests
npm test

# Specific test file
npm test -- AuthService.test.ts

# With coverage
npm run test:coverage
```

## 🚀 Deployment

### Environment Variables
Copy and configure environment files:
- `.env.development` - Development settings
- `.env.production` - Production settings

### Production Checklist
- [ ] Update JWT secrets (256-bit minimum)
- [ ] Configure production database
- [ ] Set up Redis cluster
- [ ] Configure CORS origins
- [ ] Set up SSL certificates
- [ ] Configure logging levels
- [ ] Set up monitoring
- [ ] Run security audit

### Docker Deployment
```bash
# Build image
docker build -t fleeks-backend .

# Run container
docker run -p 3000:3000 --env-file .env.production fleeks-backend
```

## 🔧 Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `fleeks_db` |
| `REDIS_HOST` | Redis host | `localhost` |
| `JWT_SECRET` | JWT signing secret | Required |
| `BCRYPT_ROUNDS` | Bcrypt hash rounds | `12` |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Backend Development Team**  
Fleeks Technologies © 2023