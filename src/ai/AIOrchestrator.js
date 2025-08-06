/**
 * AI Orchestrator - Central AI System Manager
 * Coordinates all AI services for the beauty salon platform
 */

const VideoAnalysisService = require('./services/VideoAnalysisService');
const BehaviorPredictionService = require('./services/BehaviorPredictionService');
const ContentPersonalizationService = require('./services/ContentPersonalizationService');
const ConversationalAIService = require('./services/ConversationalAIService');
const AISecurityService = require('./services/AISecurityService');
const AIAnalyticsService = require('./services/AIAnalyticsService');

class AIOrchestrator {
  constructor(config = {}) {
    this.config = {
      enableVideoAnalysis: true,
      enableBehaviorPrediction: true,
      enablePersonalization: true,
      enableConversationalAI: true,
      enableSecurity: true,
      enableAnalytics: true,
      ...config
    };

    this.services = {};
    this.initialized = false;
    this.healthStatus = {};
  }

  /**
   * Initialize all AI services
   */
  async initialize() {
    if (this.initialized) return;

    console.log('Initializing AI Orchestrator...');

    try {
      // Initialize services based on configuration
      const initPromises = [];

      if (this.config.enableVideoAnalysis) {
        this.services.videoAnalysis = new VideoAnalysisService();
        initPromises.push(this.initializeService('videoAnalysis'));
      }

      if (this.config.enableBehaviorPrediction) {
        this.services.behaviorPrediction = new BehaviorPredictionService();
        initPromises.push(this.initializeService('behaviorPrediction'));
      }

      if (this.config.enablePersonalization) {
        this.services.personalization = new ContentPersonalizationService();
        initPromises.push(this.initializeService('personalization'));
      }

      if (this.config.enableConversationalAI) {
        this.services.conversationalAI = new ConversationalAIService();
        initPromises.push(this.initializeService('conversationalAI'));
      }

      if (this.config.enableSecurity) {
        this.services.security = new AISecurityService();
        initPromises.push(this.initializeService('security'));
      }

      if (this.config.enableAnalytics) {
        this.services.analytics = new AIAnalyticsService();
        initPromises.push(this.initializeService('analytics'));
      }

      // Initialize all services in parallel
      await Promise.all(initPromises);

      // Set up inter-service communication
      this.setupServiceIntegration();

      this.initialized = true;
      console.log('AI Orchestrator initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Orchestrator:', error);
      throw error;
    }
  }

  /**
   * Initialize individual service with error handling
   */
  async initializeService(serviceName) {
    try {
      await this.services[serviceName].initialize();
      this.healthStatus[serviceName] = 'healthy';
      console.log(`${serviceName} service initialized`);
    } catch (error) {
      console.error(`Failed to initialize ${serviceName}:`, error);
      this.healthStatus[serviceName] = 'failed';
      // Don't throw - allow other services to initialize
    }
  }

  /**
   * Process user interaction with AI-powered features
   * @param {string} userId - User identifier
   * @param {Object} interaction - User interaction data
   * @param {Object} context - Request context
   * @returns {Object} AI-processed response
   */
  async processUserInteraction(userId, interaction, context = {}) {
    await this.initialize();

    const results = {
      timestamp: Date.now(),
      userId: userId,
      interaction: interaction
    };

    try {
      // Security check first
      if (this.services.security) {
        const securityCheck = await this.services.security.analyzeUserBehavior(
          userId,
          interaction,
          context
        );

        if (!securityCheck.allowed) {
          return {
            ...results,
            blocked: true,
            reason: securityCheck.factors,
            requiredActions: securityCheck.requiredActions
          };
        }

        results.security = securityCheck;
      }

      // Process based on interaction type
      switch (interaction.type) {
        case 'video_consultation':
          results.videoAnalysis = await this.handleVideoConsultation(
            userId,
            interaction.data,
            context
          );
          break;

        case 'chat_message':
          results.conversation = await this.handleChatMessage(
            userId,
            interaction.data,
            context
          );
          break;

        case 'content_request':
          results.content = await this.handleContentRequest(
            userId,
            interaction.data,
            context
          );
          break;

        case 'booking_intent':
          results.prediction = await this.handleBookingIntent(
            userId,
            interaction.data,
            context
          );
          break;

        default:
          // General interaction processing
          results.processed = await this.handleGeneralInteraction(
            userId,
            interaction,
            context
          );
      }

      // Update analytics
      if (this.services.analytics) {
        await this.services.analytics.processAnalytics({
          userId,
          interaction,
          results,
          context
        });
      }

      // Update user profile for future personalization
      if (this.services.personalization && results.processed) {
        await this.services.personalization.updateUserProfile(userId, {
          type: interaction.type,
          outcome: results.processed,
          timestamp: results.timestamp
        });
      }

    } catch (error) {
      console.error('Error processing user interaction:', error);
      results.error = error.message;
    }

    return results;
  }

  /**
   * Handle video consultation request
   */
  async handleVideoConsultation(userId, data, context) {
    if (!this.services.videoAnalysis) {
      return { error: 'Video analysis service not available' };
    }

    // Analyze video frame
    const analysis = await this.services.videoAnalysis.analyzeFrame(data.frameBuffer);

    if (!analysis.success) {
      return analysis;
    }

    // Get personalized recommendations based on analysis
    let personalizedRecommendations = analysis.recommendations;
    
    if (this.services.personalization) {
      const userProfile = await this.services.personalization.getUserProfile(userId);
      personalizedRecommendations = await this.enhanceRecommendations(
        analysis.recommendations,
        userProfile
      );
    }

    // Predict booking likelihood
    let bookingPrediction = null;
    if (this.services.behaviorPrediction) {
      bookingPrediction = await this.services.behaviorPrediction.predictBookingIntent(
        userId,
        { ...context, videoAnalysis: analysis }
      );
    }

    return {
      analysis: analysis.analysis,
      recommendations: personalizedRecommendations,
      bookingPrediction: bookingPrediction,
      privacy: analysis.privacy
    };
  }

  /**
   * Handle chat message
   */
  async handleChatMessage(userId, data, context) {
    if (!this.services.conversationalAI) {
      return { error: 'Conversational AI service not available' };
    }

    // Process chat message
    const response = await this.services.conversationalAI.processQuery(
      data.message,
      userId,
      context
    );

    // If the conversation is about booking, predict intent
    if (response.intent?.includes('booking') && this.services.behaviorPrediction) {
      const bookingPrediction = await this.services.behaviorPrediction.predictBookingIntent(
        userId,
        { ...context, conversationIntent: response.intent }
      );
      
      response.bookingPrediction = bookingPrediction;
    }

    return response;
  }

  /**
   * Handle content request
   */
  async handleContentRequest(userId, data, context) {
    if (!this.services.personalization) {
      return { error: 'Personalization service not available' };
    }

    // Generate personalized content feed
    const feed = await this.services.personalization.generatePersonalizedFeed(
      userId,
      context
    );

    // Predict user actions on content
    if (this.services.behaviorPrediction) {
      const actionPrediction = await this.services.behaviorPrediction.predictNextAction(
        userId,
        { viewingContent: true, feedSize: feed.items.length }
      );
      
      feed.predictedAction = actionPrediction;
    }

    return feed;
  }

  /**
   * Handle booking intent
   */
  async handleBookingIntent(userId, data, context) {
    const results = {};

    // Predict booking likelihood and preferences
    if (this.services.behaviorPrediction) {
      results.intent = await this.services.behaviorPrediction.predictBookingIntent(
        userId,
        context
      );
      
      results.preferences = await this.services.behaviorPrediction.predictPreferences(
        userId
      );
    }

    // Get personalized service recommendations
    if (this.services.personalization) {
      const userProfile = await this.services.personalization.getUserProfile(userId);
      results.recommendations = await this.generateServiceRecommendations(
        userProfile,
        results.preferences
      );
    }

    // Check for fraud if payment is involved
    if (data.includesPayment && this.services.security) {
      results.fraudCheck = await this.services.security.detectFraud({
        userId,
        amount: data.estimatedAmount,
        service: data.service,
        ...context
      });
    }

    return results;
  }

  /**
   * Handle general interaction
   */
  async handleGeneralInteraction(userId, interaction, context) {
    const results = {};

    // Predict user behavior
    if (this.services.behaviorPrediction) {
      results.behaviorPrediction = await this.services.behaviorPrediction.predictNextAction(
        userId,
        { currentAction: interaction.type, ...context }
      );
    }

    // Check for security anomalies
    if (this.services.security) {
      const anomalyCheck = await this.services.security.analyzeUserBehavior(
        userId,
        interaction,
        context
      );
      
      if (anomalyCheck.riskScore.composite > 0.5) {
        results.securityWarning = anomalyCheck;
      }
    }

    return results;
  }

  /**
   * Get AI system health status
   */
  async getHealthStatus() {
    const health = {
      overall: 'healthy',
      services: {},
      metrics: {}
    };

    for (const [serviceName, service] of Object.entries(this.services)) {
      health.services[serviceName] = {
        status: this.healthStatus[serviceName],
        initialized: service.initialized || false
      };

      // Add service-specific metrics
      if (serviceName === 'analytics' && service.initialized) {
        health.metrics.analytics = await service.calculateKPIs();
      }
    }

    // Determine overall health
    const failedServices = Object.values(health.services).filter(
      s => s.status === 'failed'
    ).length;

    if (failedServices > 2) {
      health.overall = 'degraded';
    } else if (failedServices > 0) {
      health.overall = 'partial';
    }

    return health;
  }

  /**
   * Set up inter-service communication
   */
  setupServiceIntegration() {
    // Analytics service listens to all events
    if (this.services.analytics) {
      // Subscribe to security events
      if (this.services.security) {
        this.services.analytics.on('high-risk-detected', async (data) => {
          await this.services.analytics.processAnalytics({
            type: 'security_alert',
            ...data
          });
        });
      }

      // Subscribe to conversation events
      if (this.services.conversationalAI) {
        this.services.analytics.on('booking-intent', async (data) => {
          await this.services.analytics.processAnalytics({
            type: 'booking_intent',
            ...data
          });
        });
      }
    }

    // Personalization learns from all interactions
    if (this.services.personalization) {
      this.setupPersonalizationLearning();
    }
  }

  /**
   * Set up personalization learning from other services
   */
  setupPersonalizationLearning() {
    // Learn from video analysis results
    if (this.services.videoAnalysis) {
      this.on('video-analysis-complete', async (data) => {
        await this.services.personalization.updateUserProfile(data.userId, {
          type: 'style_preference',
          data: data.analysis.stylePreferences
        });
      });
    }

    // Learn from conversation patterns
    if (this.services.conversationalAI) {
      this.on('conversation-complete', async (data) => {
        await this.services.personalization.updateUserProfile(data.userId, {
          type: 'conversation_topic',
          data: data.topics
        });
      });
    }
  }

  /**
   * Enhance recommendations with personalization
   */
  async enhanceRecommendations(baseRecommendations, userProfile) {
    // Sort recommendations based on user preferences
    const enhanced = baseRecommendations.map(rec => ({
      ...rec,
      personalScore: this.calculatePersonalRelevance(rec, userProfile)
    }));

    // Sort by personal relevance
    enhanced.sort((a, b) => b.personalScore - a.personalScore);

    // Add personalized notes
    return enhanced.map(rec => ({
      ...rec,
      personalNote: this.generatePersonalNote(rec, userProfile)
    }));
  }

  /**
   * Calculate personal relevance score
   */
  calculatePersonalRelevance(recommendation, profile) {
    let score = 0.5; // Base score

    // Match with preferred categories
    if (profile.preferences.categories.includes(recommendation.category)) {
      score += 0.2;
    }

    // Match with preferred price range
    if (this.matchesPriceRange(recommendation.price, profile.preferences.priceRange)) {
      score += 0.15;
    }

    // Historical engagement
    const similarInteractions = profile.interactions.filter(
      i => i.data?.service === recommendation.name
    );
    score += Math.min(similarInteractions.length * 0.1, 0.15);

    return Math.min(score, 1);
  }

  /**
   * Generate personalized note for recommendation
   */
  generatePersonalNote(recommendation, profile) {
    const notes = [];

    if (profile.preferences.tags.includes('organic') && recommendation.tags?.includes('organic')) {
      notes.push('Uses organic products as you prefer');
    }

    if (profile.interactions.some(i => i.data?.staff === recommendation.staff)) {
      notes.push(`Available with ${recommendation.staff} whom you've booked before`);
    }

    return notes.join('. ');
  }

  /**
   * Generate service recommendations
   */
  async generateServiceRecommendations(userProfile, preferences) {
    // This would normally query a service database
    // For now, return mock recommendations
    const services = [
      {
        name: 'Hydrating Facial',
        category: 'skincare',
        price: 120,
        duration: 60,
        tags: ['hydrating', 'relaxing', 'organic']
      },
      {
        name: 'Classic Manicure',
        category: 'nails',
        price: 45,
        duration: 45,
        tags: ['classic', 'affordable']
      },
      {
        name: 'Balayage Hair Color',
        category: 'hair',
        price: 250,
        duration: 180,
        tags: ['trending', 'customizable']
      }
    ];

    // Filter and rank based on preferences
    return services
      .filter(s => preferences?.services?.includes(s.category))
      .map(s => ({
        ...s,
        score: this.calculatePersonalRelevance(s, userProfile)
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Utility methods
   */
  matchesPriceRange(price, range) {
    const ranges = {
      low: [0, 50],
      medium: [50, 150],
      high: [150, 500],
      luxury: [500, Infinity]
    };

    const [min, max] = ranges[range] || ranges.medium;
    return price >= min && price <= max;
  }

  /**
   * Stream analytics data
   */
  streamAnalytics(callback) {
    if (!this.services.analytics) {
      throw new Error('Analytics service not available');
    }

    return this.services.analytics.streamAnalytics(callback);
  }

  /**
   * Get dashboard state
   */
  async getDashboardState(dashboardId) {
    if (!this.services.analytics) {
      throw new Error('Analytics service not available');
    }

    return await this.services.analytics.getDashboardState(dashboardId);
  }

  /**
   * Process voice input
   */
  async processVoiceInput(audioBuffer, userId, context = {}) {
    if (!this.services.conversationalAI) {
      throw new Error('Conversational AI service not available');
    }

    return await this.services.conversationalAI.processVoiceInput(
      audioBuffer,
      userId,
      context
    );
  }

  /**
   * Add content to personalization system
   */
  async addContent(content) {
    if (!this.services.personalization) {
      throw new Error('Personalization service not available');
    }

    return await this.services.personalization.addContent(content);
  }

  /**
   * Cleanup all services
   */
  async cleanup() {
    console.log('Cleaning up AI Orchestrator...');

    const cleanupPromises = [];
    for (const [serviceName, service] of Object.entries(this.services)) {
      if (service.cleanup) {
        cleanupPromises.push(
          service.cleanup()
            .then(() => console.log(`${serviceName} cleaned up`))
            .catch(err => console.error(`Error cleaning up ${serviceName}:`, err))
        );
      }
    }

    await Promise.all(cleanupPromises);
    this.initialized = false;
    console.log('AI Orchestrator cleanup complete');
  }
}

module.exports = AIOrchestrator;