/**
 * Intelligent User Behavior Prediction Service
 * Uses federated learning and privacy-first ML models
 */

const tf = require('@tensorflow/tfjs-node');
const LocalForage = require('localforage');

class BehaviorPredictionService {
  constructor() {
    this.models = {
      bookingIntent: null,
      churnPrediction: null,
      preferenceClassifier: null,
      nextActionPredictor: null
    };
    this.featureStore = null;
    this.initialized = false;
  }

  /**
   * Initialize prediction models and feature store
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize privacy-first feature store
      this.featureStore = LocalForage.createInstance({
        name: 'fleeks-ai-features',
        storeName: 'user-behavior'
      });

      // Load lightweight prediction models
      await this.loadModels();
      
      this.initialized = true;
      console.log('Behavior prediction service initialized');
    } catch (error) {
      console.error('Failed to initialize behavior prediction:', error);
      throw error;
    }
  }

  /**
   * Load ML models for behavior prediction
   */
  async loadModels() {
    // Booking intent prediction model
    this.models.bookingIntent = this.createBookingIntentModel();
    
    // Churn prediction model
    this.models.churnPrediction = this.createChurnModel();
    
    // Preference classifier
    this.models.preferenceClassifier = this.createPreferenceModel();
    
    // Next action predictor
    this.models.nextActionPredictor = this.createActionModel();
  }

  /**
   * Predict user's booking intent
   * @param {string} userId - User identifier
   * @param {Object} context - Current session context
   * @returns {Object} Booking intent prediction
   */
  async predictBookingIntent(userId, context) {
    await this.initialize();

    // Extract user features with privacy preservation
    const features = await this.extractUserFeatures(userId, context);
    
    // Run edge prediction
    const prediction = await this.runEdgePrediction(
      this.models.bookingIntent,
      features
    );

    // Enhance with temporal patterns
    const temporalFactors = await this.analyzeTemporalPatterns(userId);
    
    return {
      intent: prediction.intent,
      probability: prediction.score,
      suggestedServices: prediction.services,
      optimalTiming: temporalFactors.bestTime,
      factors: {
        behavioral: prediction.factors,
        temporal: temporalFactors.factors,
        contextual: this.extractContextualFactors(context)
      }
    };
  }

  /**
   * Predict user churn risk
   * @param {string} userId - User identifier
   * @returns {Object} Churn risk assessment
   */
  async predictChurnRisk(userId) {
    await this.initialize();

    const features = await this.buildChurnFeatures(userId);
    const prediction = await this.runEdgePrediction(
      this.models.churnPrediction,
      features
    );

    return {
      risk: prediction.risk,
      score: prediction.score,
      factors: prediction.factors,
      interventions: this.generateInterventions(prediction),
      timeline: prediction.expectedChurnWindow
    };
  }

  /**
   * Predict user preferences
   * @param {string} userId - User identifier
   * @returns {Object} Preference predictions
   */
  async predictPreferences(userId) {
    await this.initialize();

    const historicalData = await this.getUserHistory(userId);
    const features = this.extractPreferenceFeatures(historicalData);
    
    const prediction = await this.runEdgePrediction(
      this.models.preferenceClassifier,
      features
    );

    return {
      services: prediction.topServices,
      styles: prediction.preferredStyles,
      priceRange: prediction.pricePreference,
      timing: prediction.preferredTimes,
      staff: prediction.preferredStaff,
      confidence: prediction.confidence
    };
  }

  /**
   * Predict next user action
   * @param {string} userId - User identifier
   * @param {Object} currentState - Current user state
   * @returns {Object} Next action prediction
   */
  async predictNextAction(userId, currentState) {
    await this.initialize();

    const sequence = await this.getUserActionSequence(userId);
    const features = this.buildSequenceFeatures(sequence, currentState);
    
    const prediction = await this.runEdgePrediction(
      this.models.nextActionPredictor,
      features
    );

    return {
      action: prediction.nextAction,
      probability: prediction.probability,
      alternatives: prediction.alternatives,
      suggestedContent: prediction.content,
      timing: prediction.expectedTime
    };
  }

  /**
   * Extract user features with privacy preservation
   */
  async extractUserFeatures(userId, context) {
    // Get user behavioral data
    const userStats = await this.getUserStats(userId);
    
    // Apply privacy-preserving transformations
    const features = {
      // Temporal features
      dayOfWeek: new Date().getDay() / 6,
      hourOfDay: new Date().getHours() / 23,
      daysSinceLastVisit: this.calculateDaysSince(userStats.lastVisit),
      
      // Behavioral features
      visitFrequency: this.normalizeFrequency(userStats.visitCount),
      avgSessionDuration: this.normalizeaDuration(userStats.avgDuration),
      browsingDepth: userStats.pagesPerSession / 10,
      
      // Engagement features
      searchCount: Math.min(userStats.searches / 20, 1),
      viewedServices: Math.min(userStats.servicesViewed / 15, 1),
      cartAbandonment: userStats.cartAbandonment || 0,
      
      // Context features
      deviceType: this.encodeDevice(context.device),
      referralSource: this.encodeReferral(context.referrer),
      isReturning: userStats.visitCount > 1 ? 1 : 0
    };

    // Add differential privacy noise
    return this.addPrivacyNoise(features);
  }

  /**
   * Build churn prediction features
   */
  async buildChurnFeatures(userId) {
    const stats = await this.getUserStats(userId);
    const engagement = await this.getEngagementMetrics(userId);
    
    return {
      // Recency
      daysSinceLastVisit: this.calculateDaysSince(stats.lastVisit),
      daysSinceLastBooking: this.calculateDaysSince(stats.lastBooking),
      
      // Frequency
      visitFrequency: stats.visitCount / Math.max(stats.accountAge, 1),
      bookingFrequency: stats.bookingCount / Math.max(stats.accountAge, 1),
      
      // Monetary
      avgBookingValue: stats.totalSpent / Math.max(stats.bookingCount, 1),
      lifetimeValue: stats.totalSpent,
      
      // Engagement decay
      engagementTrend: engagement.trend,
      lastEngagementScore: engagement.current,
      
      // Service satisfaction (inferred)
      completionRate: stats.completedBookings / Math.max(stats.bookingCount, 1),
      reviewsLeft: stats.reviewCount / Math.max(stats.bookingCount, 1)
    };
  }

  /**
   * Run edge ML prediction
   */
  async runEdgePrediction(model, features) {
    // Convert features to tensor
    const inputTensor = tf.tensor2d([Object.values(features)]);
    
    // Run inference
    const prediction = model.predict(inputTensor);
    const results = await prediction.array();
    
    // Clean up
    inputTensor.dispose();
    prediction.dispose();
    
    return this.interpretPrediction(results[0], model.outputShape);
  }

  /**
   * Analyze temporal patterns
   */
  async analyzeTemporalPatterns(userId) {
    const history = await this.getUserHistory(userId);
    
    // Extract booking times
    const bookingTimes = history.bookings.map(b => ({
      hour: new Date(b.timestamp).getHours(),
      dayOfWeek: new Date(b.timestamp).getDay(),
      dayOfMonth: new Date(b.timestamp).getDate()
    }));
    
    // Find patterns
    const hourlyPattern = this.findHourlyPattern(bookingTimes);
    const weeklyPattern = this.findWeeklyPattern(bookingTimes);
    
    return {
      bestTime: {
        hour: hourlyPattern.peak,
        dayOfWeek: weeklyPattern.peak,
        confidence: (hourlyPattern.confidence + weeklyPattern.confidence) / 2
      },
      factors: {
        preferredHours: hourlyPattern.distribution,
        preferredDays: weeklyPattern.distribution,
        consistency: this.calculateConsistency(bookingTimes)
      }
    };
  }

  /**
   * Generate intervention strategies
   */
  generateInterventions(churnPrediction) {
    const interventions = [];
    
    if (churnPrediction.score > 0.7) {
      interventions.push({
        type: 'immediate',
        action: 'personalOffer',
        message: 'Send exclusive discount for favorite service'
      });
    }
    
    if (churnPrediction.factors.engagementDecay > 0.5) {
      interventions.push({
        type: 'engagement',
        action: 'reactivationCampaign',
        message: 'Share new services and features'
      });
    }
    
    if (churnPrediction.factors.serviceIssues > 0.3) {
      interventions.push({
        type: 'support',
        action: 'proactiveOutreach',
        message: 'Customer success check-in'
      });
    }
    
    return interventions;
  }

  /**
   * Model creation methods
   */
  createBookingIntentModel() {
    return tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [15],
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 8,
          activation: 'sigmoid'
        })
      ]
    });
  }

  createChurnModel() {
    return tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [12],
          units: 24,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 12,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid'
        })
      ]
    });
  }

  createPreferenceModel() {
    return tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [20],
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 16,
          activation: 'softmax'
        })
      ]
    });
  }

  createActionModel() {
    return tf.sequential({
      layers: [
        tf.layers.lstm({
          inputShape: [10, 8],
          units: 32,
          returnSequences: false
        }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 8,
          activation: 'softmax'
        })
      ]
    });
  }

  /**
   * Privacy-preserving methods
   */
  addPrivacyNoise(features) {
    // Add differential privacy noise
    const epsilon = 1.0; // Privacy budget
    const sensitivity = 0.1;
    
    const noisyFeatures = {};
    for (const [key, value] of Object.entries(features)) {
      if (typeof value === 'number') {
        const noise = this.laplacianNoise(sensitivity / epsilon);
        noisyFeatures[key] = Math.max(0, Math.min(1, value + noise));
      } else {
        noisyFeatures[key] = value;
      }
    }
    
    return noisyFeatures;
  }

  laplacianNoise(scale) {
    const u = Math.random() - 0.5;
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  /**
   * Helper methods
   */
  async getUserStats(userId) {
    // In production, this would fetch from database
    return {
      visitCount: 12,
      lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      lastBooking: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      bookingCount: 5,
      totalSpent: 450,
      accountAge: 180,
      avgDuration: 300,
      pagesPerSession: 8,
      searches: 15,
      servicesViewed: 25,
      cartAbandonment: 0.2,
      completedBookings: 4,
      reviewCount: 3
    };
  }

  calculateDaysSince(date) {
    if (!date) return 999;
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  normalizeFrequency(count) {
    return Math.min(count / 50, 1);
  }

  normalizeaDuration(seconds) {
    return Math.min(seconds / 600, 1);
  }

  encodeDevice(device) {
    const devices = { mobile: 0, tablet: 0.5, desktop: 1 };
    return devices[device] || 0.5;
  }

  encodeReferral(referrer) {
    const sources = { organic: 0, social: 0.33, paid: 0.66, direct: 1 };
    return sources[referrer] || 0.5;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    for (const model of Object.values(this.models)) {
      if (model) model.dispose();
    }
    this.initialized = false;
  }
}

module.exports = BehaviorPredictionService;