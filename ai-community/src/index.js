import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import Redis from 'redis';

// Import AI Community Features
import { AIConversationFacilitator } from './conversation/AIConversationFacilitator.js';
import { CommunityHealthAnalyzer } from './sentiment/CommunityHealthAnalyzer.js';
import { AIPeerMatcher } from './matchmaking/AIPeerMatcher.js';
import { AIGamificationEngine } from './gamification/AIGamificationEngine.js';
import { AIBeautyAssistant } from './beauty-assistant/AIBeautyAssistant.js';
import { PredictiveContentScheduler } from './scheduling/PredictiveContentScheduler.js';

// Load environment variables
dotenv.config();

/**
 * AI Community Platform
 * Integrates all AI-enhanced community features
 */
class AICommunityPlatform {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST']
      }
    });
    
    // Middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Initialize components
    this.initializeComponents();
    this.setupRoutes();
    this.setupSocketHandlers();
  }

  async initializeComponents() {
    // Database connections
    this.mongodb = await this.connectMongoDB();
    this.redis = await this.connectRedis();
    
    // AI Components
    this.conversationFacilitator = new AIConversationFacilitator({
      openaiApiKey: process.env.OPENAI_API_KEY,
      toxicityThreshold: 0.7,
      engagementBoostThreshold: 0.3
    });
    
    this.healthAnalyzer = new CommunityHealthAnalyzer({
      analysisInterval: 5 * 60 * 1000, // 5 minutes
      healthThresholds: {
        critical: 0.3,
        warning: 0.5,
        healthy: 0.7,
        thriving: 0.85
      }
    });
    
    this.peerMatcher = new AIPeerMatcher({
      matchingInterval: 24 * 60 * 60 * 1000, // Daily
      minCompatibility: 0.7,
      maxMatchesPerUser: 5
    });
    
    this.gamification = new AIGamificationEngine({
      challengeGenerationInterval: 24 * 60 * 60 * 1000, // Daily
      rewardMultiplier: 1.2
    });
    
    this.beautyAssistant = new AIBeautyAssistant({
      openaiApiKey: process.env.OPENAI_API_KEY,
      modelPath: './models',
      confidenceThreshold: 0.8
    });
    
    this.contentScheduler = new PredictiveContentScheduler({
      analysisWindow: 30 * 24 * 60 * 60 * 1000, // 30 days
      predictionHorizon: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Start background processes
    this.startBackgroundProcesses();
    
    // Setup event listeners
    this.setupEventListeners();
  }

  async connectMongoDB() {
    try {
      const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
      await client.connect();
      console.log('Connected to MongoDB');
      return client.db('ai_community');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async connectRedis() {
    try {
      const client = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      
      client.on('error', err => console.error('Redis error:', err));
      await client.connect();
      console.log('Connected to Redis');
      return client;
    } catch (error) {
      console.error('Redis connection error:', error);
      throw error;
    }
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: Date.now() });
    });
    
    // Conversation routes
    this.app.post('/api/conversation/analyze', async (req, res) => {
      try {
        const { message, conversationId, userId } = req.body;
        const result = await this.conversationFacilitator.processMessage(
          message,
          conversationId,
          userId
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Community health routes
    this.app.get('/api/health/status', async (req, res) => {
      try {
        const communityData = await this.getCommunityData();
        const health = await this.healthAnalyzer.analyzeHealth(communityData);
        res.json(health);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Peer matching routes
    this.app.post('/api/matching/profile', async (req, res) => {
      try {
        const { userId, profileData } = req.body;
        const profile = await this.peerMatcher.createUserProfile(userId, profileData);
        res.json(profile);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.get('/api/matching/find/:userId', async (req, res) => {
      try {
        const matches = await this.peerMatcher.findMatches(req.params.userId);
        res.json(matches);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Gamification routes
    this.app.get('/api/gamification/challenges', async (req, res) => {
      try {
        const challenges = Array.from(this.gamification.activeChallenges.values());
        res.json(challenges);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.post('/api/gamification/track', async (req, res) => {
      try {
        const { userId, challengeId, action, data } = req.body;
        const result = await this.gamification.trackProgress(
          userId,
          challengeId,
          action,
          data
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Beauty assistant routes
    this.app.post('/api/beauty/analyze', async (req, res) => {
      try {
        const { userId, imageData, preferences } = req.body;
        const analysis = await this.beautyAssistant.analyzeFace(
          userId,
          imageData,
          preferences
        );
        res.json(analysis);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.post('/api/beauty/consult', async (req, res) => {
      try {
        const { userId, query, context } = req.body;
        const consultation = await this.beautyAssistant.consultBeauty(
          userId,
          query,
          context
        );
        res.json(consultation);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Content scheduling routes
    this.app.post('/api/scheduling/schedule', async (req, res) => {
      try {
        const { content, options } = req.body;
        const scheduled = await this.contentScheduler.scheduleContent(
          content,
          options
        );
        res.json(scheduled);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.get('/api/scheduling/calendar', async (req, res) => {
      try {
        const { startDate, endDate } = req.query;
        const calendar = await this.contentScheduler.getContentCalendar(
          new Date(startDate),
          new Date(endDate)
        );
        res.json(calendar);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);
      
      // Join conversation room
      socket.on('join_conversation', (conversationId) => {
        socket.join(`conversation:${conversationId}`);
      });
      
      // Real-time message processing
      socket.on('send_message', async (data) => {
        const { message, conversationId, userId } = data;
        
        try {
          const result = await this.conversationFacilitator.processMessage(
            message,
            conversationId,
            userId
          );
          
          // Emit to conversation participants
          this.io.to(`conversation:${conversationId}`).emit('message_processed', {
            ...result,
            message,
            userId,
            timestamp: Date.now()
          });
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });
      
      // Real-time challenge updates
      socket.on('join_challenge', (challengeId) => {
        socket.join(`challenge:${challengeId}`);
      });
      
      // Beauty assistant real-time features
      socket.on('virtual_tryon', async (data) => {
        const { userId, imageData, product } = data;
        
        try {
          const result = await this.beautyAssistant.virtualTryOn(
            userId,
            imageData,
            product
          );
          
          socket.emit('tryon_result', result);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });
      
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  }

  setupEventListeners() {
    // Conversation events
    this.conversationFacilitator.on('messageAnalyzed', (data) => {
      this.io.to(`conversation:${data.conversationId}`).emit('conversation_insights', data);
    });
    
    // Health monitoring events
    this.healthAnalyzer.on('healthUpdate', (data) => {
      this.io.emit('community_health_update', data);
      
      // Store in database
      this.mongodb.collection('health_metrics').insertOne({
        ...data,
        timestamp: Date.now()
      });
    });
    
    // Matching events
    this.peerMatcher.on('matchesFound', (data) => {
      this.io.to(`user:${data.userId}`).emit('new_matches', data.matches);
    });
    
    // Gamification events
    this.gamification.on('challengeCreated', (challenge) => {
      this.io.emit('new_challenge', challenge);
    });
    
    this.gamification.on('achievementUnlocked', (data) => {
      this.io.to(`user:${data.userId}`).emit('achievement_unlocked', data.achievement);
    });
    
    // Content scheduling events
    this.contentScheduler.on('contentPublished', (item) => {
      this.io.emit('content_published', item);
    });
  }

  startBackgroundProcesses() {
    // Start health monitoring
    this.healthAnalyzer.startMonitoring();
    
    // Start automatic matching
    this.peerMatcher.startMatchingCycle();
    
    // Start challenge generation
    this.gamification.startChallengeGeneration();
    
    // Start content optimization
    this.contentScheduler.startAutoOptimization();
    
    // Periodic community analysis
    setInterval(async () => {
      try {
        const communityData = await this.getCommunityData();
        await this.healthAnalyzer.analyzeHealth(communityData);
      } catch (error) {
        console.error('Community analysis error:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  async getCommunityData() {
    // Aggregate community data from various sources
    const [messages, activities, members, demographics, reports] = await Promise.all([
      this.mongodb.collection('messages').find({
        timestamp: { $gte: Date.now() - 24 * 60 * 60 * 1000 }
      }).toArray(),
      
      this.mongodb.collection('activities').find({
        timestamp: { $gte: Date.now() - 24 * 60 * 60 * 1000 }
      }).toArray(),
      
      this.mongodb.collection('members').find({}).toArray(),
      
      this.mongodb.collection('demographics').findOne({ type: 'current' }),
      
      this.mongodb.collection('reports').find({
        timestamp: { $gte: Date.now() - 7 * 24 * 60 * 60 * 1000 }
      }).toArray()
    ]);
    
    return {
      messages,
      activities,
      members,
      demographics: demographics || {},
      reports
    };
  }

  start(port = process.env.PORT || 3000) {
    this.server.listen(port, () => {
      console.log(`AI Community Platform running on port ${port}`);
      console.log('Features enabled:');
      console.log('- AI Conversation Facilitation');
      console.log('- Community Health Monitoring');
      console.log('- AI Peer Matching');
      console.log('- Dynamic Gamification');
      console.log('- Virtual Beauty Assistant');
      console.log('- Predictive Content Scheduling');
    });
  }
}

// Create and start the platform
const platform = new AICommunityPlatform();
platform.start();