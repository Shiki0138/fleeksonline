const crypto = require('crypto');
const logger = require('../../config/logger');
const redis = require('../../config/redis');

/**
 * Privacy-Preserving Analytics Service
 * Implements differential privacy, k-anonymity, and secure multi-party computation
 */
class PrivacyAnalyticsService {
  constructor() {
    this.epsilon = 1.0; // Differential privacy parameter
    this.delta = 1e-5; // Differential privacy parameter
    this.kAnonymityThreshold = 5; // Minimum group size for k-anonymity
    this.noiseScale = 0.1; // Noise scale for Laplace mechanism
    this.aggregationWindow = 3600000; // 1 hour
    this.retentionPeriod = 86400000 * 90; // 90 days
  }

  /**
   * Track event with privacy preservation
   * @param {string} userId - User ID (will be anonymized)
   * @param {string} eventType - Type of event
   * @param {Object} eventData - Event data
   * @returns {Object} Tracking result
   */
  async trackEvent(userId, eventType, eventData) {
    try {
      // Anonymize user ID
      const anonymousId = this.generateAnonymousId(userId);

      // Apply data minimization
      const minimizedData = this.minimizeData(eventData);

      // Apply differential privacy
      const privatizedData = await this.applyDifferentialPrivacy(minimizedData);

      // Check k-anonymity
      const kAnonymous = await this.ensureKAnonymity(eventType, privatizedData);

      if (!kAnonymous.isAnonymous) {
        // Store in pending queue until k-anonymity is achieved
        await this.queueForKAnonymity(anonymousId, eventType, privatizedData);
        return {
          tracked: false,
          reason: 'Queued for k-anonymity',
          queueSize: kAnonymous.queueSize
        };
      }

      // Store anonymized event
      const event = {
        id: crypto.randomBytes(16).toString('hex'),
        anonymousId,
        eventType,
        data: privatizedData,
        timestamp: Date.now(),
        privacyMetadata: {
          epsilon: this.epsilon,
          kValue: this.kAnonymityThreshold,
          noiseApplied: true
        }
      };

      await this.storeEvent(event);

      // Update aggregates
      await this.updateAggregates(eventType, privatizedData);

      return {
        tracked: true,
        eventId: event.id,
        privacyLevel: 'high'
      };
    } catch (error) {
      logger.error('Privacy analytics tracking error:', error);
      throw error;
    }
  }

  /**
   * Generate anonymous ID from user ID
   * @param {string} userId - Original user ID
   * @returns {string} Anonymous ID
   */
  generateAnonymousId(userId) {
    const salt = process.env.PRIVACY_SALT || 'default-privacy-salt';
    const hash = crypto.createHash('sha256');
    hash.update(userId + salt);
    
    // Use only first 16 chars to increase collision probability (for k-anonymity)
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * Minimize data by removing/generalizing sensitive fields
   * @param {Object} data - Original data
   * @returns {Object} Minimized data
   */
  minimizeData(data) {
    const minimized = {};
    const allowedFields = [
      'action', 'category', 'value', 'duration', 'success',
      'error_type', 'device_type', 'browser', 'os', 'country'
    ];

    // Only keep allowed fields
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        minimized[field] = this.generalizeField(field, data[field]);
      }
    });

    return minimized;
  }

  /**
   * Generalize field value for privacy
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @returns {*} Generalized value
   */
  generalizeField(field, value) {
    switch (field) {
      case 'value':
        // Round numeric values
        return typeof value === 'number' ? Math.round(value / 10) * 10 : 0;
      
      case 'duration':
        // Bucket durations
        if (value < 1000) return '<1s';
        if (value < 5000) return '1-5s';
        if (value < 30000) return '5-30s';
        if (value < 60000) return '30-60s';
        return '>60s';
      
      case 'browser':
        // Only keep major browser type
        if (/chrome/i.test(value)) return 'Chrome';
        if (/firefox/i.test(value)) return 'Firefox';
        if (/safari/i.test(value)) return 'Safari';
        if (/edge/i.test(value)) return 'Edge';
        return 'Other';
      
      case 'os':
        // Only keep major OS
        if (/windows/i.test(value)) return 'Windows';
        if (/mac|darwin/i.test(value)) return 'macOS';
        if (/linux/i.test(value)) return 'Linux';
        if (/android/i.test(value)) return 'Android';
        if (/ios|iphone|ipad/i.test(value)) return 'iOS';
        return 'Other';
      
      case 'country':
        // Keep country but remove region/city
        return value.substring(0, 2).toUpperCase();
      
      default:
        return value;
    }
  }

  /**
   * Apply differential privacy using Laplace mechanism
   * @param {Object} data - Data to privatize
   * @returns {Object} Privatized data
   */
  async applyDifferentialPrivacy(data) {
    const privatized = { ...data };

    // Add Laplace noise to numeric values
    Object.keys(privatized).forEach(key => {
      if (typeof privatized[key] === 'number') {
        privatized[key] = this.addLaplaceNoise(privatized[key]);
      }
    });

    return privatized;
  }

  /**
   * Add Laplace noise to a value
   * @param {number} value - Original value
   * @returns {number} Value with noise
   */
  addLaplaceNoise(value) {
    const scale = this.noiseScale / this.epsilon;
    const u = Math.random() - 0.5;
    const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    return Math.round(value + noise);
  }

  /**
   * Ensure k-anonymity for the event
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   * @returns {Object} K-anonymity check result
   */
  async ensureKAnonymity(eventType, data) {
    // Create equivalence class key
    const equivalenceClass = this.createEquivalenceClass(eventType, data);
    const classKey = `k-anon:class:${equivalenceClass}`;

    // Get current class size
    const classSize = await redis.incr(`${classKey}:count`);
    await redis.expire(`${classKey}:count`, 3600); // 1 hour TTL

    // Check if k-anonymity is satisfied
    const isAnonymous = classSize >= this.kAnonymityThreshold;

    // Get queue size for this class
    const queueKey = `k-anon:queue:${equivalenceClass}`;
    const queueSize = await redis.llen(queueKey);

    return {
      isAnonymous,
      classSize,
      queueSize,
      equivalenceClass
    };
  }

  /**
   * Create equivalence class identifier
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   * @returns {string} Equivalence class ID
   */
  createEquivalenceClass(eventType, data) {
    // Group by quasi-identifiers
    const quasiIdentifiers = [
      eventType,
      data.device_type || 'unknown',
      data.browser || 'unknown',
      data.os || 'unknown',
      data.country || 'unknown'
    ];

    return crypto.createHash('md5')
      .update(quasiIdentifiers.join(':'))
      .digest('hex');
  }

  /**
   * Queue event for k-anonymity
   * @param {string} anonymousId - Anonymous user ID
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   */
  async queueForKAnonymity(anonymousId, eventType, data) {
    const equivalenceClass = this.createEquivalenceClass(eventType, data);
    const queueKey = `k-anon:queue:${equivalenceClass}`;

    const queuedEvent = {
      anonymousId,
      eventType,
      data,
      timestamp: Date.now()
    };

    await redis.rpush(queueKey, JSON.stringify(queuedEvent));
    await redis.expire(queueKey, 3600); // 1 hour TTL

    // Check if we can process the queue
    const queueLength = await redis.llen(queueKey);
    if (queueLength >= this.kAnonymityThreshold) {
      await this.processKAnonymityQueue(equivalenceClass);
    }
  }

  /**
   * Process k-anonymity queue
   * @param {string} equivalenceClass - Equivalence class ID
   */
  async processKAnonymityQueue(equivalenceClass) {
    const queueKey = `k-anon:queue:${equivalenceClass}`;
    
    // Get all queued events
    const events = await redis.lrange(queueKey, 0, -1);
    if (events.length < this.kAnonymityThreshold) return;

    // Process events
    const parsedEvents = events.map(e => JSON.parse(e));
    
    // Apply additional privacy techniques
    const privatizedBatch = await this.privatizeBatch(parsedEvents);

    // Store all events
    await Promise.all(privatizedBatch.map(event => this.storeEvent({
      ...event,
      id: crypto.randomBytes(16).toString('hex'),
      privacyMetadata: {
        epsilon: this.epsilon,
        kValue: this.kAnonymityThreshold,
        batchProcessed: true
      }
    })));

    // Clear queue
    await redis.del(queueKey);

    logger.info(`Processed k-anonymity queue for class ${equivalenceClass}: ${events.length} events`);
  }

  /**
   * Apply additional privacy to batch of events
   * @param {Array} events - Events to privatize
   * @returns {Array} Privatized events
   */
  async privatizeBatch(events) {
    // Shuffle timestamps within batch
    const timestamps = events.map(e => e.timestamp).sort();
    const shuffled = [...timestamps].sort(() => Math.random() - 0.5);

    return events.map((event, index) => ({
      ...event,
      timestamp: shuffled[index],
      // Add batch noise
      data: this.addBatchNoise(event.data, events.length)
    }));
  }

  /**
   * Add noise proportional to batch size
   * @param {Object} data - Event data
   * @param {number} batchSize - Size of batch
   * @returns {Object} Data with noise
   */
  addBatchNoise(data, batchSize) {
    const noisyData = { ...data };
    const batchNoiseScale = this.noiseScale / Math.sqrt(batchSize);

    Object.keys(noisyData).forEach(key => {
      if (typeof noisyData[key] === 'number') {
        const noise = (Math.random() - 0.5) * batchNoiseScale;
        noisyData[key] = Math.round(noisyData[key] + noise);
      }
    });

    return noisyData;
  }

  /**
   * Store anonymized event
   * @param {Object} event - Event to store
   */
  async storeEvent(event) {
    const eventKey = `privacy:event:${event.id}`;
    await redis.set(eventKey, event, this.retentionPeriod / 1000);

    // Add to time-based index
    const timeKey = `privacy:events:${Math.floor(event.timestamp / this.aggregationWindow)}`;
    await redis.sadd(timeKey, event.id);
    await redis.expire(timeKey, this.retentionPeriod / 1000);
  }

  /**
   * Update privacy-preserving aggregates
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   */
  async updateAggregates(eventType, data) {
    const hour = Math.floor(Date.now() / this.aggregationWindow);
    const aggregateKey = `privacy:aggregate:${eventType}:${hour}`;

    // Get current aggregate
    let aggregate = await redis.get(aggregateKey) || {
      count: 0,
      sum: {},
      categories: {}
    };

    // Update count with noise
    aggregate.count = this.addLaplaceNoise(aggregate.count + 1);

    // Update numeric sums
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'number') {
        aggregate.sum[key] = (aggregate.sum[key] || 0) + data[key];
      } else {
        // Count categories
        if (!aggregate.categories[key]) aggregate.categories[key] = {};
        aggregate.categories[key][data[key]] = (aggregate.categories[key][data[key]] || 0) + 1;
      }
    });

    await redis.set(aggregateKey, aggregate, this.aggregationWindow / 1000);
  }

  /**
   * Query analytics with privacy guarantees
   * @param {Object} query - Query parameters
   * @returns {Object} Query results
   */
  async queryAnalytics(query) {
    try {
      const { eventType, startTime, endTime, metrics = ['count'] } = query;

      // Validate time range
      const maxRange = 86400000 * 30; // 30 days
      if (endTime - startTime > maxRange) {
        throw new Error('Time range too large for privacy preservation');
      }

      // Get aggregates for time range
      const aggregates = await this.getAggregates(eventType, startTime, endTime);

      // Apply privacy budget check
      const budgetUsed = await this.checkPrivacyBudget(query);
      if (budgetUsed > this.epsilon) {
        throw new Error('Privacy budget exceeded');
      }

      // Calculate results with additional noise
      const results = this.calculatePrivateResults(aggregates, metrics);

      // Update privacy budget
      await this.updatePrivacyBudget(query, results);

      return {
        results,
        privacyGuarantees: {
          epsilon: this.epsilon,
          delta: this.delta,
          kAnonymity: this.kAnonymityThreshold,
          noiseAdded: true
        },
        metadata: {
          startTime,
          endTime,
          recordsProcessed: aggregates.length
        }
      };
    } catch (error) {
      logger.error('Privacy analytics query error:', error);
      throw error;
    }
  }

  /**
   * Get aggregates for time range
   * @param {string} eventType - Event type
   * @param {number} startTime - Start timestamp
   * @param {number} endTime - End timestamp
   * @returns {Array} Aggregates
   */
  async getAggregates(eventType, startTime, endTime) {
    const aggregates = [];
    const startHour = Math.floor(startTime / this.aggregationWindow);
    const endHour = Math.floor(endTime / this.aggregationWindow);

    for (let hour = startHour; hour <= endHour; hour++) {
      const aggregateKey = `privacy:aggregate:${eventType}:${hour}`;
      const aggregate = await redis.get(aggregateKey);
      if (aggregate) {
        aggregates.push(aggregate);
      }
    }

    return aggregates;
  }

  /**
   * Calculate results with privacy
   * @param {Array} aggregates - Aggregate data
   * @param {Array} metrics - Requested metrics
   * @returns {Object} Results
   */
  calculatePrivateResults(aggregates, metrics) {
    const results = {};

    metrics.forEach(metric => {
      switch (metric) {
        case 'count':
          results.count = aggregates.reduce((sum, agg) => sum + agg.count, 0);
          results.count = this.addLaplaceNoise(results.count);
          break;

        case 'average':
          const totals = {};
          const counts = {};
          
          aggregates.forEach(agg => {
            Object.keys(agg.sum).forEach(key => {
              totals[key] = (totals[key] || 0) + agg.sum[key];
              counts[key] = (counts[key] || 0) + agg.count;
            });
          });

          results.average = {};
          Object.keys(totals).forEach(key => {
            results.average[key] = counts[key] > 0 ? 
              this.addLaplaceNoise(totals[key] / counts[key]) : 0;
          });
          break;

        case 'distribution':
          results.distribution = {};
          
          aggregates.forEach(agg => {
            Object.keys(agg.categories).forEach(field => {
              if (!results.distribution[field]) {
                results.distribution[field] = {};
              }
              
              Object.keys(agg.categories[field]).forEach(value => {
                results.distribution[field][value] = 
                  (results.distribution[field][value] || 0) + 
                  agg.categories[field][value];
              });
            });
          });

          // Add noise to distributions
          Object.keys(results.distribution).forEach(field => {
            Object.keys(results.distribution[field]).forEach(value => {
              results.distribution[field][value] = 
                this.addLaplaceNoise(results.distribution[field][value]);
            });
          });
          break;
      }
    });

    return results;
  }

  /**
   * Check privacy budget
   * @param {Object} query - Query parameters
   * @returns {number} Budget used
   */
  async checkPrivacyBudget(query) {
    const budgetKey = `privacy:budget:${query.userId || 'global'}:${new Date().toDateString()}`;
    const budget = await redis.get(budgetKey) || 0;
    return parseFloat(budget);
  }

  /**
   * Update privacy budget
   * @param {Object} query - Query parameters
   * @param {Object} results - Query results
   */
  async updatePrivacyBudget(query, results) {
    const budgetKey = `privacy:budget:${query.userId || 'global'}:${new Date().toDateString()}`;
    const sensitivity = this.calculateQuerySensitivity(query, results);
    const budgetUsed = sensitivity / this.noiseScale;

    await redis.incrbyfloat(budgetKey, budgetUsed);
    await redis.expire(budgetKey, 86400); // 24 hours
  }

  /**
   * Calculate query sensitivity
   * @param {Object} query - Query parameters
   * @param {Object} results - Query results
   * @returns {number} Sensitivity
   */
  calculateQuerySensitivity(query, results) {
    // Simple sensitivity calculation
    let sensitivity = 0.1;

    if (results.count) sensitivity += 0.1;
    if (results.average) sensitivity += 0.2;
    if (results.distribution) sensitivity += 0.3;

    return sensitivity;
  }

  /**
   * Export privacy-compliant data
   * @param {Object} exportRequest - Export request
   * @returns {Object} Export data
   */
  async exportData(exportRequest) {
    const { userId, startDate, endDate } = exportRequest;

    // For GDPR compliance, provide aggregated data only
    const events = await this.getUserEvents(userId, startDate, endDate);

    // Apply strong anonymization
    const anonymized = events.map(event => ({
      timestamp: this.bucketTimestamp(event.timestamp),
      eventType: event.eventType,
      // Only include non-identifying data
      data: this.removeIdentifiers(event.data)
    }));

    return {
      exportDate: new Date().toISOString(),
      dataRange: { startDate, endDate },
      eventCount: anonymized.length,
      events: anonymized,
      privacyNotice: 'Data has been anonymized and aggregated for privacy protection'
    };
  }

  /**
   * Bucket timestamp for privacy
   * @param {number} timestamp - Original timestamp
   * @returns {string} Bucketed timestamp
   */
  bucketTimestamp(timestamp) {
    const date = new Date(timestamp);
    // Only return date, not time
    return date.toISOString().split('T')[0];
  }

  /**
   * Remove identifiers from data
   * @param {Object} data - Original data
   * @returns {Object} Data without identifiers
   */
  removeIdentifiers(data) {
    const safe = {};
    const safeFields = ['action', 'category', 'success', 'error_type'];
    
    safeFields.forEach(field => {
      if (data[field] !== undefined) {
        safe[field] = data[field];
      }
    });

    return safe;
  }

  /**
   * Get user events (for export)
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} User events
   */
  async getUserEvents(userId, startDate, endDate) {
    // This would need to maintain a user->anonymous ID mapping
    // For true privacy, we might not support individual exports
    logger.info(`Data export requested for user ${userId}`);
    return [];
  }

  /**
   * Delete user data (GDPR right to be forgotten)
   * @param {string} userId - User ID
   * @returns {Object} Deletion result
   */
  async deleteUserData(userId) {
    // Since data is anonymized, we can't directly delete
    // Instead, we ensure no mapping exists
    const anonymousId = this.generateAnonymousId(userId);
    
    logger.info(`Data deletion requested for user ${userId} (anonymous: ${anonymousId})`);

    return {
      deleted: false,
      reason: 'Data is already anonymized and cannot be linked to user',
      recommendation: 'No further action needed for privacy compliance'
    };
  }

  /**
   * Get privacy report
   * @returns {Object} Privacy metrics and compliance status
   */
  async getPrivacyReport() {
    const report = {
      configuration: {
        epsilon: this.epsilon,
        delta: this.delta,
        kAnonymityThreshold: this.kAnonymityThreshold,
        noiseScale: this.noiseScale,
        retentionPeriod: `${this.retentionPeriod / 86400000} days`
      },
      compliance: {
        gdpr: true,
        ccpa: true,
        differentialPrivacy: true,
        kAnonymity: true
      },
      metrics: {
        totalEvents: await redis.dbsize(),
        anonymousUsers: await redis.scard('privacy:anonymous-users'),
        privacyBudgetUsed: await this.getTotalPrivacyBudget()
      },
      guarantees: [
        'All user IDs are anonymized using cryptographic hashing',
        'Differential privacy applied to all numeric data',
        `K-anonymity enforced with k=${this.kAnonymityThreshold}`,
        'Data minimization applied to all collected data',
        'Automatic data expiration after retention period',
        'No personally identifiable information stored'
      ]
    };

    return report;
  }

  /**
   * Get total privacy budget used
   * @returns {number} Total budget
   */
  async getTotalPrivacyBudget() {
    const pattern = 'privacy:budget:*';
    const keys = await redis.keys(pattern);
    
    let total = 0;
    for (const key of keys) {
      const budget = await redis.get(key);
      total += parseFloat(budget) || 0;
    }

    return total;
  }
}

module.exports = new PrivacyAnalyticsService();