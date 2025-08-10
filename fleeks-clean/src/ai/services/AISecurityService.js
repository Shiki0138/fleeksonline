/**
 * AI-Enhanced Security and Fraud Detection Service
 * Real-time anomaly detection and threat prevention
 */

const tf = require('@tensorflow/tfjs-node');
const crypto = require('crypto');

class AISecurityService {
  constructor() {
    this.anomalyDetector = null;
    this.fraudClassifier = null;
    this.threatIntelDB = new Map();
    this.sessionAnalyzer = new Map();
    this.riskProfiles = new Map();
    this.initialized = false;
  }

  /**
   * Initialize security models
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize anomaly detection model
      this.anomalyDetector = this.createAnomalyDetector();
      
      // Initialize fraud classification model
      this.fraudClassifier = this.createFraudClassifier();
      
      // Load threat intelligence data
      await this.loadThreatIntelligence();
      
      // Initialize behavioral baselines
      this.initializeBehavioralBaselines();
      
      this.initialized = true;
      console.log('AI Security service initialized');
    } catch (error) {
      console.error('Failed to initialize AI security:', error);
      throw error;
    }
  }

  /**
   * Analyze user behavior for security threats
   * @param {string} userId - User identifier
   * @param {Object} action - User action details
   * @param {Object} context - Request context
   * @returns {Object} Security analysis result
   */
  async analyzeUserBehavior(userId, action, context) {
    await this.initialize();

    // Extract security features
    const features = await this.extractSecurityFeatures(userId, action, context);
    
    // Run anomaly detection
    const anomalyScore = await this.detectAnomalies(features);
    
    // Analyze device fingerprint
    const deviceRisk = await this.analyzeDevice(context.device);
    
    // Check against threat intelligence
    const threatScore = await this.checkThreatIntelligence(context);
    
    // Behavioral analysis
    const behavioralRisk = await this.analyzeBehavioralPattern(userId, action);
    
    // Calculate composite risk score
    const riskScore = this.calculateCompositeRisk({
      anomaly: anomalyScore,
      device: deviceRisk,
      threat: threatScore,
      behavioral: behavioralRisk
    });
    
    // Determine response actions
    const response = await this.determineSecurityResponse(userId, riskScore);
    
    // Update risk profile
    await this.updateRiskProfile(userId, {
      action,
      riskScore,
      timestamp: Date.now()
    });
    
    return {
      allowed: riskScore.composite < 0.7,
      riskScore: riskScore,
      factors: this.explainRiskFactors(riskScore),
      requiredActions: response.actions,
      confidence: riskScore.confidence
    };
  }

  /**
   * Real-time fraud detection
   * @param {Object} transaction - Transaction details
   * @returns {Object} Fraud detection result
   */
  async detectFraud(transaction) {
    await this.initialize();

    // Extract transaction features
    const features = this.extractTransactionFeatures(transaction);
    
    // Run fraud classification
    const fraudPrediction = await this.classifyFraud(features);
    
    // Velocity checks
    const velocityRisk = await this.performVelocityChecks(transaction);
    
    // Pattern matching
    const patternRisk = await this.matchFraudPatterns(transaction);
    
    // Network analysis
    const networkRisk = await this.analyzeNetworkBehavior(transaction);
    
    return {
      isFraud: fraudPrediction.score > 0.8,
      score: fraudPrediction.score,
      confidence: fraudPrediction.confidence,
      factors: {
        ml: fraudPrediction.factors,
        velocity: velocityRisk,
        pattern: patternRisk,
        network: networkRisk
      },
      recommendation: this.getFraudRecommendation(fraudPrediction.score)
    };
  }

  /**
   * Extract security features from user action
   */
  async extractSecurityFeatures(userId, action, context) {
    const userHistory = await this.getUserSecurityHistory(userId);
    const sessionData = this.getSessionData(context.sessionId);
    
    return {
      // Temporal features
      timeOfDay: new Date().getHours() / 23,
      dayOfWeek: new Date().getDay() / 6,
      timeSinceLastAction: this.calculateTimeDelta(userHistory.lastAction),
      
      // Behavioral features
      actionType: this.encodeActionType(action.type),
      actionFrequency: this.calculateActionFrequency(userHistory, action.type),
      sessionDuration: sessionData ? sessionData.duration : 0,
      
      // Device features
      deviceTrust: context.device?.trustScore || 0.5,
      deviceAge: this.calculateDeviceAge(context.device),
      deviceChanges: userHistory.deviceChanges || 0,
      
      // Location features
      locationRisk: await this.assessLocationRisk(context.location),
      locationChange: this.detectLocationChange(userHistory, context.location),
      vpnDetected: context.network?.vpn || false,
      
      // Request features
      requestRate: this.calculateRequestRate(sessionData),
      failedAttempts: userHistory.failedAttempts || 0,
      suspiciousPatterns: this.detectSuspiciousPatterns(sessionData)
    };
  }

  /**
   * Detect anomalies using isolation forest approach
   */
  async detectAnomalies(features) {
    // Convert features to tensor
    const featureTensor = tf.tensor2d([Object.values(features)]);
    
    // Run anomaly detection
    const anomalyScore = await this.anomalyDetector.predict(featureTensor).array();
    
    // Clean up
    featureTensor.dispose();
    
    // Normalize score
    return {
      score: anomalyScore[0][0],
      isAnomaly: anomalyScore[0][0] > 0.6,
      confidence: Math.abs(anomalyScore[0][0] - 0.5) * 2
    };
  }

  /**
   * Analyze device fingerprint
   */
  async analyzeDevice(device) {
    if (!device) return { score: 0.5, factors: ['no_device_info'] };
    
    const fingerprint = this.generateDeviceFingerprint(device);
    const trustHistory = await this.getDeviceTrustHistory(fingerprint);
    
    let riskScore = 0;
    const factors = [];
    
    // Check device consistency
    if (trustHistory.changes > 3) {
      riskScore += 0.3;
      factors.push('frequent_device_changes');
    }
    
    // Check for known malicious fingerprints
    if (this.threatIntelDB.has(fingerprint)) {
      riskScore += 0.5;
      factors.push('known_threat_device');
    }
    
    // Analyze device characteristics
    if (device.browser?.automation) {
      riskScore += 0.4;
      factors.push('automation_detected');
    }
    
    if (device.screen?.virtualKeyboard) {
      riskScore += 0.2;
      factors.push('virtual_environment');
    }
    
    return {
      score: Math.min(riskScore, 1),
      factors: factors,
      fingerprint: fingerprint
    };
  }

  /**
   * Check against threat intelligence
   */
  async checkThreatIntelligence(context) {
    let threatScore = 0;
    const threats = [];
    
    // Check IP reputation
    if (context.ip) {
      const ipThreat = this.threatIntelDB.get(`ip:${context.ip}`);
      if (ipThreat) {
        threatScore += ipThreat.severity;
        threats.push({ type: 'ip', detail: ipThreat });
      }
    }
    
    // Check email domain
    if (context.email) {
      const domain = context.email.split('@')[1];
      const domainThreat = this.threatIntelDB.get(`domain:${domain}`);
      if (domainThreat) {
        threatScore += domainThreat.severity;
        threats.push({ type: 'email_domain', detail: domainThreat });
      }
    }
    
    // Check user agent
    if (context.userAgent) {
      const uaThreat = this.checkUserAgentThreats(context.userAgent);
      if (uaThreat) {
        threatScore += uaThreat.severity;
        threats.push({ type: 'user_agent', detail: uaThreat });
      }
    }
    
    return {
      score: Math.min(threatScore, 1),
      threats: threats,
      sources: threats.length
    };
  }

  /**
   * Analyze behavioral patterns
   */
  async analyzeBehavioralPattern(userId, action) {
    const profile = await this.getUserBehavioralProfile(userId);
    
    // Calculate deviation from normal behavior
    const deviation = this.calculateBehavioralDeviation(profile, action);
    
    // Check for suspicious sequences
    const suspiciousSequence = this.detectSuspiciousSequence(profile.recentActions, action);
    
    // Analyze timing patterns
    const timingAnomaly = this.detectTimingAnomaly(profile, action);
    
    return {
      score: (deviation + suspiciousSequence + timingAnomaly) / 3,
      factors: {
        deviation: deviation,
        sequence: suspiciousSequence,
        timing: timingAnomaly
      }
    };
  }

  /**
   * Calculate composite risk score
   */
  calculateCompositeRisk(risks) {
    // Weighted combination of risk factors
    const weights = {
      anomaly: 0.3,
      device: 0.25,
      threat: 0.25,
      behavioral: 0.2
    };
    
    let composite = 0;
    for (const [key, weight] of Object.entries(weights)) {
      composite += (risks[key]?.score || 0) * weight;
    }
    
    // Apply non-linear scaling for high-risk combinations
    if (risks.threat?.score > 0.7 && risks.anomaly?.score > 0.6) {
      composite = Math.min(composite * 1.5, 1);
    }
    
    return {
      composite: composite,
      components: risks,
      confidence: this.calculateConfidence(risks),
      severity: this.determineSeverity(composite)
    };
  }

  /**
   * Determine security response based on risk
   */
  async determineSecurityResponse(userId, riskScore) {
    const actions = [];
    
    if (riskScore.composite > 0.9) {
      // Critical risk - immediate block
      actions.push({
        type: 'block',
        reason: 'Critical security risk detected',
        duration: 'permanent'
      });
      actions.push({
        type: 'alert',
        target: 'security_team',
        priority: 'critical'
      });
    } else if (riskScore.composite > 0.7) {
      // High risk - require additional verification
      actions.push({
        type: 'challenge',
        method: 'mfa',
        reason: 'Unusual activity detected'
      });
      actions.push({
        type: 'monitor',
        level: 'enhanced',
        duration: 3600000 // 1 hour
      });
    } else if (riskScore.composite > 0.5) {
      // Medium risk - monitor closely
      actions.push({
        type: 'monitor',
        level: 'standard',
        duration: 1800000 // 30 minutes
      });
      actions.push({
        type: 'log',
        detail: 'suspicious_activity'
      });
    } else if (riskScore.composite > 0.3) {
      // Low risk - log for analysis
      actions.push({
        type: 'log',
        detail: 'minor_anomaly'
      });
    }
    
    return {
      actions: actions,
      requiresUserAction: actions.some(a => a.type === 'challenge'),
      notificationRequired: actions.some(a => a.type === 'alert')
    };
  }

  /**
   * Fraud classification
   */
  async classifyFraud(features) {
    const featureTensor = tf.tensor2d([features]);
    const prediction = await this.fraudClassifier.predict(featureTensor).array();
    
    featureTensor.dispose();
    
    const score = prediction[0][0];
    
    return {
      score: score,
      confidence: Math.abs(score - 0.5) * 2,
      factors: this.identifyFraudFactors(features, score)
    };
  }

  /**
   * Velocity checks for fraud detection
   */
  async performVelocityChecks(transaction) {
    const userId = transaction.userId;
    const timeWindow = 3600000; // 1 hour
    
    const recentTransactions = await this.getRecentTransactions(userId, timeWindow);
    
    const checks = {
      transactionCount: recentTransactions.length,
      totalAmount: recentTransactions.reduce((sum, t) => sum + t.amount, 0),
      uniqueServices: new Set(recentTransactions.map(t => t.service)).size,
      locationChanges: this.countLocationChanges(recentTransactions)
    };
    
    let riskScore = 0;
    
    if (checks.transactionCount > 5) riskScore += 0.3;
    if (checks.totalAmount > 1000) riskScore += 0.3;
    if (checks.locationChanges > 2) riskScore += 0.4;
    
    return {
      score: Math.min(riskScore, 1),
      checks: checks
    };
  }

  /**
   * Create anomaly detection model
   */
  createAnomalyDetector() {
    // Simplified autoencoder for anomaly detection
    const encoder = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [15],
          units: 10,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 5,
          activation: 'relu'
        })
      ]
    });
    
    const decoder = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [5],
          units: 10,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 15,
          activation: 'sigmoid'
        })
      ]
    });
    
    // Combine encoder and decoder
    const autoencoder = tf.sequential({
      layers: [...encoder.layers, ...decoder.layers]
    });
    
    return autoencoder;
  }

  /**
   * Create fraud classification model
   */
  createFraudClassifier() {
    return tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [20],
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid'
        })
      ]
    });
  }

  /**
   * Load threat intelligence database
   */
  async loadThreatIntelligence() {
    // In production, this would load from external threat feeds
    // For now, we'll initialize with some sample data
    
    this.threatIntelDB.set('ip:192.168.1.100', {
      severity: 0.8,
      type: 'known_attacker',
      lastSeen: Date.now()
    });
    
    this.threatIntelDB.set('domain:tempmail.com', {
      severity: 0.6,
      type: 'disposable_email',
      category: 'medium_risk'
    });
    
    // Add more threat intelligence data as needed
  }

  /**
   * Initialize behavioral baselines
   */
  initializeBehavioralBaselines() {
    this.behavioralBaselines = {
      normalLoginTime: { min: 8, max: 22 }, // 8 AM to 10 PM
      avgSessionDuration: 300, // 5 minutes
      commonActions: ['view', 'search', 'book'],
      maxFailedAttempts: 3
    };
  }

  /**
   * Helper methods
   */
  generateDeviceFingerprint(device) {
    const components = [
      device.userAgent,
      device.screen?.width,
      device.screen?.height,
      device.timezone,
      device.language,
      device.platform
    ].filter(Boolean).join('|');
    
    return crypto
      .createHash('sha256')
      .update(components)
      .digest('hex')
      .substring(0, 16);
  }

  calculateTimeDelta(lastAction) {
    if (!lastAction) return 1;
    const delta = Date.now() - lastAction;
    return Math.min(delta / (1000 * 60 * 60), 1); // Normalize to hours
  }

  encodeActionType(actionType) {
    const actionMap = {
      'login': 0.1,
      'view': 0.2,
      'search': 0.3,
      'book': 0.5,
      'payment': 0.7,
      'admin': 0.9
    };
    return actionMap[actionType] || 0.5;
  }

  calculateConfidence(risks) {
    const scores = Object.values(risks).map(r => r?.score || 0);
    const variance = this.calculateVariance(scores);
    return 1 - Math.min(variance, 1);
  }

  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  determineSeverity(score) {
    if (score > 0.8) return 'critical';
    if (score > 0.6) return 'high';
    if (score > 0.4) return 'medium';
    if (score > 0.2) return 'low';
    return 'minimal';
  }

  /**
   * Explain risk factors in human-readable format
   */
  explainRiskFactors(riskScore) {
    const explanations = [];
    
    if (riskScore.components.anomaly?.score > 0.6) {
      explanations.push('Unusual behavior pattern detected');
    }
    
    if (riskScore.components.device?.score > 0.5) {
      explanations.push('Device fingerprint shows risk indicators');
    }
    
    if (riskScore.components.threat?.score > 0.5) {
      explanations.push('Known threat indicators present');
    }
    
    if (riskScore.components.behavioral?.score > 0.5) {
      explanations.push('Behavioral anomalies detected');
    }
    
    return explanations;
  }

  /**
   * Mock data methods (would connect to real database in production)
   */
  async getUserSecurityHistory(userId) {
    return {
      lastAction: Date.now() - 86400000, // 1 day ago
      deviceChanges: 1,
      failedAttempts: 0,
      lastLocation: { lat: 37.7749, lng: -122.4194 }
    };
  }

  getSessionData(sessionId) {
    return this.sessionAnalyzer.get(sessionId) || {
      duration: 0,
      actions: [],
      startTime: Date.now()
    };
  }

  async getUserBehavioralProfile(userId) {
    return {
      normalHours: [9, 17],
      commonActions: ['view', 'search'],
      avgTimeBetweenActions: 30,
      recentActions: []
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.anomalyDetector) this.anomalyDetector.dispose();
    if (this.fraudClassifier) this.fraudClassifier.dispose();
    this.threatIntelDB.clear();
    this.sessionAnalyzer.clear();
    this.riskProfiles.clear();
    this.initialized = false;
  }
}

module.exports = AISecurityService;