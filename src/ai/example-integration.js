/**
 * Example Integration - How to use the AI Orchestrator
 * This file demonstrates integrating AI features into the Fleeks platform
 */

const express = require('express');
const AIOrchestrator = require('./AIOrchestrator');

// Initialize AI Orchestrator
const aiOrchestrator = new AIOrchestrator({
  enableVideoAnalysis: true,
  enableBehaviorPrediction: true,
  enablePersonalization: true,
  enableConversationalAI: true,
  enableSecurity: true,
  enableAnalytics: true
});

// Initialize on server start
async function initializeAI() {
  try {
    await aiOrchestrator.initialize();
    console.log('AI System initialized successfully');
  } catch (error) {
    console.error('Failed to initialize AI system:', error);
  }
}

// Example Express routes
const router = express.Router();

/**
 * Video Consultation Endpoint
 * Analyzes user's video for beauty recommendations
 */
router.post('/api/ai/video-consultation', async (req, res) => {
  try {
    const { userId, frameData } = req.body;
    
    const result = await aiOrchestrator.processUserInteraction(
      userId,
      {
        type: 'video_consultation',
        data: {
          frameBuffer: Buffer.from(frameData, 'base64')
        }
      },
      {
        device: req.headers['user-agent'],
        ip: req.ip,
        sessionId: req.sessionID
      }
    );

    res.json({
      success: true,
      analysis: result.videoAnalysis,
      security: result.security
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Conversational AI Endpoint
 * Handles chat messages with AI assistant
 */
router.post('/api/ai/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    const result = await aiOrchestrator.processUserInteraction(
      userId,
      {
        type: 'chat_message',
        data: { message }
      },
      {
        channel: 'web',
        device: req.headers['user-agent'],
        sessionId: req.sessionID
      }
    );

    res.json({
      success: true,
      response: result.conversation,
      security: result.security
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Voice Assistant Endpoint
 * Processes voice commands
 */
router.post('/api/ai/voice', async (req, res) => {
  try {
    const { userId, audioData } = req.body;
    
    const audioBuffer = Buffer.from(audioData, 'base64');
    const result = await aiOrchestrator.processVoiceInput(
      audioBuffer,
      userId,
      {
        channel: 'voice',
        device: req.headers['user-agent']
      }
    );

    res.json({
      success: true,
      response: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Personalized Content Feed
 * Gets AI-curated content for user
 */
router.get('/api/ai/feed/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await aiOrchestrator.processUserInteraction(
      userId,
      {
        type: 'content_request',
        data: {}
      },
      {
        device: req.headers['user-agent'],
        time: new Date(),
        location: req.headers['x-user-location']
      }
    );

    res.json({
      success: true,
      feed: result.content,
      security: result.security
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Booking Intent Prediction
 * Predicts user's booking intentions
 */
router.post('/api/ai/predict-booking', async (req, res) => {
  try {
    const { userId, context } = req.body;
    
    const result = await aiOrchestrator.processUserInteraction(
      userId,
      {
        type: 'booking_intent',
        data: context
      },
      {
        device: req.headers['user-agent'],
        sessionId: req.sessionID
      }
    );

    res.json({
      success: true,
      prediction: result.prediction,
      recommendations: result.recommendations,
      security: result.security
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Real-time Analytics Dashboard
 * Streams AI analytics data
 */
router.get('/api/ai/analytics/stream', (req, res) => {
  // Set up SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Stream analytics updates
  const unsubscribe = aiOrchestrator.streamAnalytics((data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  });

  // Clean up on disconnect
  req.on('close', () => {
    unsubscribe();
  });
});

/**
 * Get Dashboard State
 * Returns current analytics dashboard state
 */
router.get('/api/ai/analytics/dashboard/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dashboardState = await aiOrchestrator.getDashboardState(id);
    
    res.json({
      success: true,
      dashboard: dashboardState
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * AI Health Status
 * Returns health status of all AI services
 */
router.get('/api/ai/health', async (req, res) => {
  try {
    const health = await aiOrchestrator.getHealthStatus();
    
    res.json({
      success: true,
      health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Security Check Endpoint
 * Performs AI security analysis on user action
 */
router.post('/api/ai/security/check', async (req, res) => {
  try {
    const { userId, action, context } = req.body;
    
    const securityResult = await aiOrchestrator.services.security.analyzeUserBehavior(
      userId,
      action,
      context
    );

    res.json({
      success: true,
      security: securityResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Add Content to Personalization System
 * Adds new content for AI personalization
 */
router.post('/api/ai/content', async (req, res) => {
  try {
    const { content } = req.body;
    
    const contentId = await aiOrchestrator.addContent(content);
    
    res.json({
      success: true,
      contentId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Middleware for AI-powered request validation
async function aiSecurityMiddleware(req, res, next) {
  try {
    // Skip for health checks
    if (req.path === '/api/ai/health') {
      return next();
    }

    const userId = req.user?.id || req.sessionID;
    const action = {
      type: req.method.toLowerCase(),
      path: req.path,
      body: req.body
    };

    const context = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      sessionId: req.sessionID,
      timestamp: Date.now()
    };

    const securityCheck = await aiOrchestrator.services.security.analyzeUserBehavior(
      userId,
      action,
      context
    );

    if (!securityCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: 'Security check failed',
        reasons: securityCheck.factors,
        requiredActions: securityCheck.requiredActions
      });
    }

    // Add security info to request
    req.aiSecurity = securityCheck;
    next();
  } catch (error) {
    console.error('AI Security middleware error:', error);
    // Don't block on errors - fail open
    next();
  }
}

// Example WebSocket integration for real-time features
function setupWebSocketAI(io) {
  io.on('connection', (socket) => {
    console.log('Client connected for AI features');

    // Real-time video analysis
    socket.on('video-frame', async (data) => {
      try {
        const result = await aiOrchestrator.processUserInteraction(
          data.userId,
          {
            type: 'video_consultation',
            data: {
              frameBuffer: Buffer.from(data.frame, 'base64')
            }
          },
          {
            device: 'websocket',
            sessionId: socket.id
          }
        );

        socket.emit('video-analysis', result.videoAnalysis);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Real-time chat
    socket.on('chat-message', async (data) => {
      try {
        const result = await aiOrchestrator.processUserInteraction(
          data.userId,
          {
            type: 'chat_message',
            data: { message: data.message }
          },
          {
            channel: 'websocket',
            sessionId: socket.id
          }
        );

        socket.emit('chat-response', result.conversation);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Subscribe to analytics updates
    socket.on('subscribe-analytics', () => {
      const unsubscribe = aiOrchestrator.streamAnalytics((data) => {
        socket.emit('analytics-update', data);
      });

      socket.on('disconnect', () => {
        unsubscribe();
      });
    });
  });
}

// Example usage in main server file
async function setupAIServer() {
  const app = express();
  const server = require('http').createServer(app);
  const io = require('socket.io')(server);

  // Initialize AI
  await initializeAI();

  // Apply AI security middleware
  app.use('/api', aiSecurityMiddleware);

  // Mount AI routes
  app.use(router);

  // Setup WebSocket AI features
  setupWebSocketAI(io);

  // Start server
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`AI-powered server running on port ${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down AI services...');
    await aiOrchestrator.cleanup();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

// Export for use in other modules
module.exports = {
  aiOrchestrator,
  router,
  aiSecurityMiddleware,
  setupWebSocketAI,
  setupAIServer
};