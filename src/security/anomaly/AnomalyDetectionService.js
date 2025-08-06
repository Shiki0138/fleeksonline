const tf = require('@tensorflow/tfjs-node');
const brain = require('brain.js');
const logger = require('../../config/logger');
const redis = require('../../config/redis');

/**
 * AI-Powered Anomaly Detection Service
 * Uses machine learning to detect unusual user behavior and potential security threats
 */
class AnomalyDetectionService {
  constructor() {
    this.models = {};
    this.detectionThreshold = 0.85;
    this.windowSize = 30; // days
    this.features = [
      'loginTime', 'loginLocation', 'deviceType', 'sessionDuration',
      'clickPatterns', 'scrollSpeed', 'typingSpeed', 'mouseMovement',
      'apiCallFrequency', 'dataAccessPatterns', 'errorRate'
    ];
    this.initializeModels();
  }

  /**
   * Initialize ML models
   */
  async initializeModels() {
    try {
      // Initialize LSTM for sequential behavior analysis
      this.models.lstm = await this.createLSTMModel();
      
      // Initialize autoencoder for anomaly detection
      this.models.autoencoder = await this.createAutoencoderModel();
      
      // Initialize neural network for pattern recognition
      this.models.patternNet = new brain.NeuralNetwork({
        hiddenLayers: [20, 10],
        activation: 'sigmoid'
      });

      logger.info('Anomaly detection models initialized');
    } catch (error) {
      logger.error('Error initializing models:', error);
    }
  }

  /**
   * Create LSTM model for sequential analysis
   */
  async createLSTMModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({
          units: 50,
          returnSequences: true,
          inputShape: [this.windowSize, this.features.length]
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({ units: 50 }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Create autoencoder model for anomaly detection
   */
  async createAutoencoderModel() {
    const encoder = tf.sequential({
      layers: [
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          inputShape: [this.features.length]
        }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 8, activation: 'relu' })
      ]
    });

    const decoder = tf.sequential({
      layers: [
        tf.layers.dense({ units: 16, activation: 'relu', inputShape: [8] }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: this.features.length, activation: 'sigmoid' })
      ]
    });

    const input = tf.input({ shape: [this.features.length] });
    const encoded = encoder.apply(input);
    const decoded = decoder.apply(encoded);

    const autoencoder = tf.model({ inputs: input, outputs: decoded });

    autoencoder.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError'
    });

    return { encoder, decoder, autoencoder };
  }

  /**
   * Analyze user behavior for anomalies
   * @param {string} userId - User ID
   * @param {Object} currentBehavior - Current behavior data
   * @returns {Object} Anomaly detection result
   */
  async analyzeBehavior(userId, currentBehavior) {
    try {
      // Get historical behavior
      const historicalData = await this.getHistoricalBehavior(userId);
      
      if (historicalData.length < 10) {
        // Not enough data for accurate detection
        await this.storeBehavior(userId, currentBehavior);
        return {
          isAnomaly: false,
          confidence: 0,
          reason: 'Insufficient historical data',
          riskScore: 0
        };
      }

      // Extract features
      const features = this.extractFeatures(currentBehavior);
      const historicalFeatures = historicalData.map(d => this.extractFeatures(d));

      // Run multiple detection methods
      const results = await Promise.all([
        this.detectWithAutoencoder(features, historicalFeatures),
        this.detectWithLSTM(features, historicalFeatures),
        this.detectWithStatistical(features, historicalFeatures),
        this.detectWithPatternMatching(features, historicalFeatures)
      ]);

      // Combine results using ensemble approach
      const anomalyScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
      const isAnomaly = anomalyScore > this.detectionThreshold;

      // Identify specific anomalies
      const anomalies = this.identifySpecificAnomalies(currentBehavior, historicalData);

      // Calculate risk score
      const riskScore = this.calculateRiskScore(anomalyScore, anomalies);

      // Store behavior and detection result
      await this.storeBehavior(userId, currentBehavior);
      await this.storeDetectionResult(userId, {
        anomalyScore,
        isAnomaly,
        anomalies,
        riskScore,
        timestamp: new Date().toISOString()
      });

      // Trigger alerts if needed
      if (isAnomaly && riskScore > 0.8) {
        await this.triggerSecurityAlert(userId, anomalies, riskScore);
      }

      return {
        isAnomaly,
        confidence: anomalyScore,
        anomalies,
        riskScore,
        recommendations: this.getSecurityRecommendations(anomalies, riskScore)
      };
    } catch (error) {
      logger.error('Behavior analysis error:', error);
      throw error;
    }
  }

  /**
   * Detect anomalies using autoencoder
   * @param {Array} features - Current features
   * @param {Array} historicalFeatures - Historical features
   * @returns {Object} Detection result
   */
  async detectWithAutoencoder(features, historicalFeatures) {
    try {
      const input = tf.tensor2d([features]);
      const reconstructed = this.models.autoencoder.autoencoder.predict(input);
      
      // Calculate reconstruction error
      const error = tf.mean(tf.square(tf.sub(input, reconstructed))).dataSync()[0];
      
      // Calculate threshold from historical data
      const historicalErrors = await Promise.all(
        historicalFeatures.slice(-100).map(async (hf) => {
          const hi = tf.tensor2d([hf]);
          const hr = this.models.autoencoder.autoencoder.predict(hi);
          return tf.mean(tf.square(tf.sub(hi, hr))).dataSync()[0];
        })
      );

      const threshold = this.calculateDynamicThreshold(historicalErrors);
      
      input.dispose();
      reconstructed.dispose();

      return {
        method: 'autoencoder',
        score: error > threshold ? error / threshold : 0,
        error,
        threshold
      };
    } catch (error) {
      logger.error('Autoencoder detection error:', error);
      return { method: 'autoencoder', score: 0 };
    }
  }

  /**
   * Detect anomalies using LSTM
   * @param {Array} features - Current features
   * @param {Array} historicalFeatures - Historical features
   * @returns {Object} Detection result
   */
  async detectWithLSTM(features, historicalFeatures) {
    try {
      // Prepare sequence data
      const sequence = [...historicalFeatures.slice(-this.windowSize + 1), features];
      const input = tf.tensor3d([sequence]);
      
      // Predict next behavior
      const prediction = this.models.lstm.predict(input);
      const anomalyProbability = prediction.dataSync()[0];
      
      input.dispose();
      prediction.dispose();

      return {
        method: 'lstm',
        score: anomalyProbability,
        probability: anomalyProbability
      };
    } catch (error) {
      logger.error('LSTM detection error:', error);
      return { method: 'lstm', score: 0 };
    }
  }

  /**
   * Detect anomalies using statistical methods
   * @param {Array} features - Current features
   * @param {Array} historicalFeatures - Historical features
   * @returns {Object} Detection result
   */
  async detectWithStatistical(features, historicalFeatures) {
    const zScores = features.map((value, index) => {
      const historicalValues = historicalFeatures.map(hf => hf[index]);
      const mean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
      const std = Math.sqrt(
        historicalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalValues.length
      );
      
      return std === 0 ? 0 : Math.abs((value - mean) / std);
    });

    const maxZScore = Math.max(...zScores);
    const anomalyScore = 1 - Math.exp(-maxZScore / 3); // Normalize to 0-1

    return {
      method: 'statistical',
      score: anomalyScore,
      zScores,
      maxZScore
    };
  }

  /**
   * Detect anomalies using pattern matching
   * @param {Array} features - Current features
   * @param {Array} historicalFeatures - Historical features
   * @returns {Object} Detection result
   */
  async detectWithPatternMatching(features, historicalFeatures) {
    try {
      // Train pattern network if needed
      if (historicalFeatures.length > 50) {
        const trainingData = historicalFeatures.slice(-1000).map(hf => ({
          input: hf.map(f => f / 100), // Normalize
          output: [0] // Normal behavior
        }));

        this.models.patternNet.train(trainingData, {
          iterations: 100,
          errorThresh: 0.005
        });
      }

      // Test current pattern
      const normalizedFeatures = features.map(f => f / 100);
      const result = this.models.patternNet.run(normalizedFeatures);
      const anomalyScore = result[0];

      return {
        method: 'pattern',
        score: anomalyScore,
        confidence: 1 - Math.abs(anomalyScore - 0.5) * 2
      };
    } catch (error) {
      logger.error('Pattern matching error:', error);
      return { method: 'pattern', score: 0 };
    }
  }

  /**
   * Extract features from behavior data
   * @param {Object} behavior - Behavior data
   * @returns {Array} Feature vector
   */
  extractFeatures(behavior) {
    return [
      this.getTimeFeature(behavior.loginTime),
      this.getLocationFeature(behavior.location),
      this.getDeviceFeature(behavior.device),
      behavior.sessionDuration || 0,
      behavior.clickCount || 0,
      behavior.scrollSpeed || 0,
      behavior.typingSpeed || 0,
      behavior.mouseDistance || 0,
      behavior.apiCallCount || 0,
      behavior.dataAccessCount || 0,
      behavior.errorCount || 0
    ];
  }

  /**
   * Get time-based feature
   * @param {string} timestamp - Timestamp
   * @returns {number} Time feature
   */
  getTimeFeature(timestamp) {
    if (!timestamp) return 0;
    const date = new Date(timestamp);
    return date.getHours() + date.getMinutes() / 60;
  }

  /**
   * Get location-based feature
   * @param {Object} location - Location data
   * @returns {number} Location feature
   */
  getLocationFeature(location) {
    if (!location) return 0;
    // Simple hash of location
    const str = `${location.country}${location.city}`;
    return str.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 100;
  }

  /**
   * Get device-based feature
   * @param {Object} device - Device data
   * @returns {number} Device feature
   */
  getDeviceFeature(device) {
    if (!device) return 0;
    const deviceTypes = ['desktop', 'mobile', 'tablet', 'other'];
    return deviceTypes.indexOf(device.type) + 1;
  }

  /**
   * Identify specific anomalies
   * @param {Object} current - Current behavior
   * @param {Array} historical - Historical behaviors
   * @returns {Array} Specific anomalies
   */
  identifySpecificAnomalies(current, historical) {
    const anomalies = [];

    // Check login time anomaly
    if (current.loginTime) {
      const currentHour = new Date(current.loginTime).getHours();
      const historicalHours = historical.map(h => new Date(h.loginTime).getHours());
      const avgHour = historicalHours.reduce((a, b) => a + b, 0) / historicalHours.length;
      
      if (Math.abs(currentHour - avgHour) > 6) {
        anomalies.push({
          type: 'unusual_login_time',
          severity: 'medium',
          details: `Login at ${currentHour}:00, usually at ${Math.round(avgHour)}:00`
        });
      }
    }

    // Check location anomaly
    if (current.location && historical.some(h => h.location)) {
      const knownLocations = [...new Set(historical.map(h => h.location?.country).filter(Boolean))];
      if (!knownLocations.includes(current.location.country)) {
        anomalies.push({
          type: 'new_location',
          severity: 'high',
          details: `Login from ${current.location.country}, never seen before`
        });
      }
    }

    // Check device anomaly
    if (current.device && historical.some(h => h.device)) {
      const knownDevices = [...new Set(historical.map(h => h.device?.id).filter(Boolean))];
      if (!knownDevices.includes(current.device.id)) {
        anomalies.push({
          type: 'new_device',
          severity: 'medium',
          details: `New device: ${current.device.type} - ${current.device.os}`
        });
      }
    }

    // Check behavior pattern anomalies
    if (current.clickCount !== undefined) {
      const avgClicks = historical.reduce((sum, h) => sum + (h.clickCount || 0), 0) / historical.length;
      if (current.clickCount > avgClicks * 3) {
        anomalies.push({
          type: 'excessive_activity',
          severity: 'medium',
          details: `Unusual click activity: ${current.clickCount} clicks`
        });
      }
    }

    // Check API usage anomaly
    if (current.apiCallCount !== undefined) {
      const avgAPICalls = historical.reduce((sum, h) => sum + (h.apiCallCount || 0), 0) / historical.length;
      if (current.apiCallCount > avgAPICalls * 5) {
        anomalies.push({
          type: 'api_abuse',
          severity: 'high',
          details: `Excessive API calls: ${current.apiCallCount}`
        });
      }
    }

    return anomalies;
  }

  /**
   * Calculate risk score
   * @param {number} anomalyScore - Anomaly score
   * @param {Array} anomalies - Specific anomalies
   * @returns {number} Risk score (0-1)
   */
  calculateRiskScore(anomalyScore, anomalies) {
    const severityWeights = {
      low: 0.2,
      medium: 0.5,
      high: 0.8,
      critical: 1.0
    };

    const anomalyRisk = anomalies.reduce((sum, a) => 
      sum + (severityWeights[a.severity] || 0.5), 0
    ) / Math.max(anomalies.length, 1);

    return Math.min(1, anomalyScore * 0.6 + anomalyRisk * 0.4);
  }

  /**
   * Get security recommendations
   * @param {Array} anomalies - Detected anomalies
   * @param {number} riskScore - Risk score
   * @returns {Array} Recommendations
   */
  getSecurityRecommendations(anomalies, riskScore) {
    const recommendations = [];

    if (riskScore > 0.8) {
      recommendations.push({
        action: 'require_mfa',
        priority: 'high',
        description: 'Require multi-factor authentication for this session'
      });
    }

    if (anomalies.some(a => a.type === 'new_location')) {
      recommendations.push({
        action: 'verify_identity',
        priority: 'high',
        description: 'Verify user identity through additional authentication'
      });
    }

    if (anomalies.some(a => a.type === 'api_abuse')) {
      recommendations.push({
        action: 'rate_limit',
        priority: 'medium',
        description: 'Apply stricter rate limiting to API access'
      });
    }

    if (anomalies.some(a => a.type === 'new_device')) {
      recommendations.push({
        action: 'device_verification',
        priority: 'medium',
        description: 'Require device verification or approval'
      });
    }

    return recommendations;
  }

  /**
   * Calculate dynamic threshold
   * @param {Array} values - Historical values
   * @returns {number} Dynamic threshold
   */
  calculateDynamicThreshold(values) {
    const sorted = values.sort((a, b) => a - b);
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const iqr = q3 - q1;
    return q3 + 1.5 * iqr;
  }

  /**
   * Get historical behavior
   * @param {string} userId - User ID
   * @returns {Array} Historical behavior data
   */
  async getHistoricalBehavior(userId) {
    const behaviorKey = `behavior:history:${userId}`;
    return await redis.get(behaviorKey) || [];
  }

  /**
   * Store behavior data
   * @param {string} userId - User ID
   * @param {Object} behavior - Behavior data
   */
  async storeBehavior(userId, behavior) {
    const behaviorKey = `behavior:history:${userId}`;
    const history = await redis.get(behaviorKey) || [];
    
    history.push({
      ...behavior,
      timestamp: new Date().toISOString()
    });

    // Keep last 1000 records
    if (history.length > 1000) {
      history.shift();
    }

    await redis.set(behaviorKey, history);
  }

  /**
   * Store detection result
   * @param {string} userId - User ID
   * @param {Object} result - Detection result
   */
  async storeDetectionResult(userId, result) {
    const resultKey = `anomaly:results:${userId}:${Date.now()}`;
    await redis.set(resultKey, result, 86400 * 30); // Keep for 30 days
  }

  /**
   * Trigger security alert
   * @param {string} userId - User ID
   * @param {Array} anomalies - Detected anomalies
   * @param {number} riskScore - Risk score
   */
  async triggerSecurityAlert(userId, anomalies, riskScore) {
    const alertKey = `security:alert:${userId}:${Date.now()}`;
    const alert = {
      userId,
      anomalies,
      riskScore,
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    await redis.set(alertKey, alert, 86400 * 7); // Keep for 7 days
    
    logger.warn(`Security alert triggered for user ${userId}:`, alert);
    
    // Here you would integrate with your alerting system
    // e.g., send email, SMS, push notification, etc.
  }

  /**
   * Get anomaly detection metrics
   * @param {string} userId - User ID
   * @returns {Object} Detection metrics
   */
  async getDetectionMetrics(userId) {
    const pattern = `anomaly:results:${userId}:*`;
    const keys = await redis.keys(pattern);
    const results = await Promise.all(keys.map(key => redis.get(key)));

    const metrics = {
      totalDetections: results.length,
      anomalyCount: results.filter(r => r.isAnomaly).length,
      averageRiskScore: results.reduce((sum, r) => sum + r.riskScore, 0) / results.length,
      anomalyTypes: {}
    };

    results.forEach(result => {
      if (result.anomalies) {
        result.anomalies.forEach(anomaly => {
          metrics.anomalyTypes[anomaly.type] = (metrics.anomalyTypes[anomaly.type] || 0) + 1;
        });
      }
    });

    return metrics;
  }

  /**
   * Train models with new data
   * @param {string} userId - User ID
   */
  async trainModels(userId) {
    try {
      const historicalData = await this.getHistoricalBehavior(userId);
      if (historicalData.length < 100) return;

      const features = historicalData.map(d => this.extractFeatures(d));
      
      // Train autoencoder
      const trainingData = tf.tensor2d(features);
      await this.models.autoencoder.autoencoder.fit(trainingData, trainingData, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.1,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              logger.info(`Training epoch ${epoch}: loss = ${logs.loss}`);
            }
          }
        }
      });

      trainingData.dispose();
      
      logger.info(`Models trained for user ${userId}`);
    } catch (error) {
      logger.error('Model training error:', error);
    }
  }
}

module.exports = new AnomalyDetectionService();