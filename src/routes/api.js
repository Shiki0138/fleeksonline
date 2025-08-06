const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const database = require('../config/database');
const redis = require('../config/redis');

const router = express.Router();

// Health check endpoint
router.get('/health', asyncHandler(async (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: await database.isHealthy(),
      redis: await redis.isHealthy(),
    },
  };

  // Check if all services are healthy
  const isHealthy = Object.values(healthStatus.services).every(status => status === true);
  
  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy ? 'All services are healthy' : 'Some services are unhealthy',
    data: healthStatus,
  });
}));

// Server info endpoint
router.get('/info', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Server information retrieved successfully',
    data: {
      name: 'Fleeks Backend API',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        health: '/api/health',
        info: '/api/info',
      },
    },
  });
}));

// Database status endpoint (admin only)
router.get('/db-status', asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions',
    });
  }

  try {
    // Test database connection
    const isHealthy = await database.isHealthy();
    
    // Get basic stats if healthy
    let stats = null;
    if (isHealthy) {
      const [userCount] = await database.table('users').count('* as count');
      stats = {
        userCount: parseInt(userCount.count),
      };
    }

    res.json({
      success: true,
      message: 'Database status retrieved successfully',
      data: {
        healthy: isHealthy,
        stats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve database status',
      error: error.message,
    });
  }
}));

// Cache status endpoint (admin only)
router.get('/cache-status', asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions',
    });
  }

  const isHealthy = await redis.isHealthy();

  res.json({
    success: true,
    message: 'Cache status retrieved successfully',
    data: {
      healthy: isHealthy,
      connected: redis.isConnected,
      timestamp: new Date().toISOString(),
    },
  });
}));

// Clear cache endpoint (admin only)
router.post('/clear-cache', asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions',
    });
  }

  try {
    // Note: This is a simplified cache clear
    // In a production environment, you might want to clear specific patterns
    await redis.client.flushDb();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message,
    });
  }
}));

module.exports = router;