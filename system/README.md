# Fleeks System

A comprehensive full-stack system built with Claude-flow coordination, featuring modular architecture, authentication, database integration, and comprehensive testing.

## 🏗️ Architecture

```
system/
├── src/
│   ├── auth/          # Authentication module
│   ├── api/           # API routes and controllers
│   ├── database/      # Database models and connection
│   ├── services/      # Business logic services
│   └── frontend/      # Frontend components
├── tests/
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── e2e/          # End-to-end tests
├── docs/             # Documentation
└── config/           # Configuration files
```

## 🚀 Features

- **Modular Architecture**: Clean separation of concerns
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Database Integration**: MongoDB with Mongoose ODM
- **API Layer**: RESTful APIs with Express.js
- **Security**: Helmet, CORS, input validation with Joi
- **Testing**: Comprehensive test suite with Jest
- **Logging**: Structured logging with Winston
- **Error Handling**: Centralized error management

## 📦 Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
```

## 🏃 Running the System

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🔧 Configuration

Configure the system using environment variables in `.env`:

- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: Database connection string
- `JWT_SECRET`: JWT signing secret
- `NODE_ENV`: Environment (development/production)

## 📊 Health Check

Visit `http://localhost:3000/health` to check system status.

## 🛡️ Security Features

- Helmet.js for security headers
- CORS protection
- JWT authentication
- Password hashing with bcrypt
- Input validation with Joi
- Rate limiting (configurable)

## 📝 API Documentation

API endpoints are available at `/api/*` with the following structure:

- `GET /health` - System health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

## 🧪 Testing

The system includes comprehensive testing:

- **Unit Tests**: Individual component testing
- **Integration Tests**: Module interaction testing
- **E2E Tests**: Complete workflow testing

## 📈 Monitoring

Built-in logging and monitoring with:

- Winston logger with configurable levels
- Request/response logging
- Error tracking
- Performance metrics

## 🤝 Contributing

This system was built using Claude-flow coordination with SPARC methodology:

1. **Specification**: Requirements analysis and scope definition
2. **Pseudocode**: Algorithm design and logic planning
3. **Architecture**: System design and component structure
4. **Refinement**: Iterative development and testing
5. **Completion**: Integration and deployment

Built with ❤️ using Claude-flow swarm coordination.