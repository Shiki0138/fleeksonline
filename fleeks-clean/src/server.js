const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const cookieParser = require('cookie-parser');
require('dotenv').config();

const logger = require('./config/logger');
const database = require('./config/database');
const redis = require('./config/redis');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const authMiddleware = require('./middleware/auth');

// Import security module
const security = require('./security');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const apiRoutes = require('./routes/api');

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.host = process.env.HOST || 'localhost';
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddleware() {
    // Cookie parser
    this.app.use(cookieParser(process.env.COOKIE_SECRET || 'secure-cookie-secret'));

    // Session management with Redis
    this.app.use(session({
      store: new RedisStore({ client: redis }),
      secret: process.env.SESSION_SECRET || 'secure-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        sameSite: 'strict'
      }
    }));

    // Security headers and CORS
    this.app.use(security.middleware.securityHeaders);
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
      credentials: true,
    }));

    // Request timing for analytics
    this.app.use(security.middleware.requestTiming);

    // Rate limiting with dynamic adjustment
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: (req) => {
        // Dynamic rate limiting based on trust score
        const baseLimit = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
        const multiplier = req.rateLimitMultiplier || 1;
        return Math.floor(baseLimit * multiplier);
      },
      message: {
        error: 'Too many requests, please try again later.',
      },
    });
    this.app.use('/api', limiter);

    // Body parsing and compression
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);

    // Privacy tracking
    this.app.use(security.middleware.privacyTracking);

    // Anomaly detection
    this.app.use(security.middleware.anomalyDetection);

    // Static file serving
    this.app.use('/uploads', express.static('uploads'));
  }

  initializeRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      });
    });

    // Security routes (some don't require auth)
    this.app.use('/api/security', security.routes);

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', authMiddleware, userRoutes);
    this.app.use('/api', authMiddleware, apiRoutes);

    // Protected routes with Zero Trust verification
    this.app.use('/api/protected', 
      authMiddleware, 
      security.middleware.zeroTrustVerification,
      security.middleware.continuousVerification,
      apiRoutes
    );

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
      });
    });
  }

  initializeErrorHandling() {
    this.app.use(security.middleware.errorCounter);
    this.app.use(errorHandler);
  }

  async start() {
    try {
      // Initialize database connection
      await database.initialize();
      logger.info('Database connection established');

      // Initialize Redis connection
      await redis.connect();
      logger.info('Redis connection established');

      // Initialize security module
      await security.initialize();
      logger.info('Security module initialized');

      // Start server
      this.server = this.app.listen(this.port, this.host, () => {
        logger.info(`Server running on http://${this.host}:${this.port}`);
        logger.info(`Environment: ${process.env.NODE_ENV}`);
        logger.info('Security features enabled:');
        logger.info('- Zero Trust Architecture');
        logger.info('- WebAuthn/Passwordless Authentication');
        logger.info('- Biometric Authentication');
        logger.info('- AI-Powered Anomaly Detection');
        logger.info('- DRM Protected Streaming');
        logger.info('- Privacy-Preserving Analytics');
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      
      if (this.server) {
        this.server.close(async () => {
          logger.info('HTTP server closed');
          
          try {
            await database.close();
            logger.info('Database connection closed');
            
            await redis.disconnect();
            logger.info('Redis connection closed');
            
            process.exit(0);
          } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
          }
        });
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new Server();
  server.start();
}

module.exports = Server;