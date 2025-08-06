# Fleeks Backend API

A robust, production-ready Node.js backend API built with Express.js, featuring JWT authentication, PostgreSQL database, Redis caching, and comprehensive testing.

## 🚀 Features

- **Express.js** - Fast, unopinionated web framework
- **JWT Authentication** - Secure token-based authentication with refresh tokens
- **PostgreSQL** - Reliable relational database with Knex.js query builder
- **Redis** - High-performance caching and session storage
- **Role-based Access Control** - Admin, moderator, and user roles
- **Request Validation** - Comprehensive input validation with Joi
- **Security** - Built-in security middleware (helmet, CORS, rate limiting)
- **Logging** - Structured logging with Winston
- **Testing** - Unit and integration tests with Jest
- **Error Handling** - Centralized error handling with detailed error responses
- **Code Quality** - ESLint configuration with Airbnb style guide

## 📋 Prerequisites

- Node.js 16.0 or higher
- PostgreSQL 12 or higher
- Redis 6 or higher (optional for development)

## 🛠 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fleeks-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create database
   createdb fleeks_db
   
   # Run migrations
   npm run migrate
   
   # Seed initial data (optional)
   npm run seed
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleeks_db
DB_USER=fleeks_user
DB_PASSWORD=fleeks_password

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔗 API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/change-password` - Change user password

### User Management

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/users/search` - Search users (admin only)
- `GET /api/users/stats` - Get user statistics (admin only)

### System

- `GET /health` - Server health check
- `GET /api/health` - Detailed health check
- `GET /api/info` - Server information

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
```

## 🏗 Project Structure

```
src/
├── config/           # Configuration files
│   ├── database.js   # Database configuration
│   ├── redis.js      # Redis configuration
│   └── logger.js     # Logging configuration
├── controllers/      # Route controllers
│   ├── AuthController.js
│   └── UserController.js
├── middleware/       # Express middleware
│   ├── auth.js       # Authentication middleware
│   ├── errorHandler.js
│   └── requestLogger.js
├── models/           # Data models
│   └── User.js       # User model
├── routes/           # API routes
│   ├── auth.js       # Authentication routes
│   ├── users.js      # User management routes
│   └── api.js        # General API routes
├── services/         # Business logic
│   └── AuthService.js
├── utils/            # Utility functions
│   ├── validation.js # Validation helpers
│   └── helpers.js    # General helpers
└── server.js         # Main server file

migrations/           # Database migrations
seeds/               # Database seeds
tests/               # Test files
├── unit/            # Unit tests
└── integration/     # Integration tests
```

## 🚀 Deployment

### Using Docker

1. **Build the Docker image**
   ```bash
   docker build -t fleeks-backend .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

### Manual Deployment

1. **Set up production environment**
   ```bash
   NODE_ENV=production
   ```

2. **Install production dependencies**
   ```bash
   npm ci --production
   ```

3. **Run migrations**
   ```bash
   npm run migrate
   ```

4. **Start the server**
   ```bash
   npm start
   ```

## 📊 Performance

- **JWT Token Caching** - Reduces database queries for authentication
- **Connection Pooling** - Efficient database connection management
- **Rate Limiting** - Prevents abuse and ensures fair usage
- **Compression** - Reduces response payload sizes
- **Structured Logging** - Efficient logging with configurable levels

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with configurable salt rounds
- **Rate Limiting** - Prevents brute force attacks
- **CORS Protection** - Configurable cross-origin request handling
- **Security Headers** - Helmet.js for security headers
- **Input Validation** - Comprehensive request validation
- **SQL Injection Prevention** - Parameterized queries with Knex.js

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review existing issues
- Create a new issue if needed

## 🔄 Changelog

### v1.0.0
- Initial release
- JWT authentication system
- User management
- PostgreSQL integration
- Redis caching
- Comprehensive testing
- Security middleware
- API documentation