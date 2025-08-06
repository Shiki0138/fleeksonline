const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../config/logger');
const redis = require('../../config/redis');

/**
 * Zero Trust Architecture Manager
 * Implements "never trust, always verify" principle with continuous verification
 */
class ZeroTrustManager {
  constructor() {
    this.trustScoreThreshold = 0.7; // Minimum trust score for access
    this.contextFactors = {
      location: 0.2,
      device: 0.2,
      behavior: 0.3,
      authentication: 0.3
    };
  }

  /**
   * Calculate trust score for a session
   * @param {Object} context - Request context including user, device, location, behavior
   * @returns {Object} Trust score and decision
   */
  async calculateTrustScore(context) {
    const { userId, deviceId, location, behavior, authMethod } = context;
    
    let trustScore = 0;
    const factors = [];

    // Location verification
    const locationScore = await this.verifyLocation(userId, location);
    trustScore += locationScore * this.contextFactors.location;
    factors.push({ factor: 'location', score: locationScore });

    // Device trust verification
    const deviceScore = await this.verifyDevice(userId, deviceId);
    trustScore += deviceScore * this.contextFactors.device;
    factors.push({ factor: 'device', score: deviceScore });

    // Behavioral analysis
    const behaviorScore = await this.analyzeBehavior(userId, behavior);
    trustScore += behaviorScore * this.contextFactors.behavior;
    factors.push({ factor: 'behavior', score: behaviorScore });

    // Authentication strength
    const authScore = this.getAuthenticationScore(authMethod);
    trustScore += authScore * this.contextFactors.authentication;
    factors.push({ factor: 'authentication', score: authScore });

    // Store trust decision
    await this.storeTrustDecision(userId, {
      trustScore,
      factors,
      timestamp: new Date().toISOString(),
      decision: trustScore >= this.trustScoreThreshold ? 'allow' : 'deny'
    });

    return {
      trustScore: Math.round(trustScore * 100) / 100,
      factors,
      decision: trustScore >= this.trustScoreThreshold ? 'allow' : 'deny',
      requiresAdditionalAuth: trustScore < this.trustScoreThreshold && trustScore > 0.5
    };
  }

  /**
   * Verify location trust
   * @param {string} userId - User ID
   * @param {Object} location - Location data
   * @returns {number} Location trust score (0-1)
   */
  async verifyLocation(userId, location) {
    if (!location || !location.ip) return 0;

    const locationKey = `location:${userId}`;
    const knownLocations = await redis.get(locationKey) || [];
    
    // Check if location is known
    const isKnown = knownLocations.some(loc => 
      loc.ip === location.ip || 
      (loc.country === location.country && loc.city === location.city)
    );

    if (isKnown) return 1;

    // Check if location is suspicious (VPN, TOR, etc.)
    if (location.isVPN || location.isTOR || location.isProxy) return 0.2;

    // New location but not suspicious
    return 0.6;
  }

  /**
   * Verify device trust
   * @param {string} userId - User ID
   * @param {string} deviceId - Device identifier
   * @returns {number} Device trust score (0-1)
   */
  async verifyDevice(userId, deviceId) {
    if (!deviceId) return 0;

    const deviceKey = `device:${userId}:${deviceId}`;
    const deviceData = await redis.get(deviceKey);

    if (!deviceData) {
      // New device
      await this.registerDevice(userId, deviceId);
      return 0.3;
    }

    // Check device health
    const lastSeen = new Date(deviceData.lastSeen);
    const daysSinceLastSeen = (Date.now() - lastSeen) / (1000 * 60 * 60 * 24);

    if (daysSinceLastSeen > 30) return 0.5; // Device not seen in a while
    if (deviceData.compromised) return 0; // Known compromised device

    return 1; // Trusted device
  }

  /**
   * Analyze user behavior
   * @param {string} userId - User ID
   * @param {Object} behavior - Current behavior metrics
   * @returns {number} Behavior trust score (0-1)
   */
  async analyzeBehavior(userId, behavior) {
    if (!behavior) return 0.5;

    const behaviorKey = `behavior:${userId}`;
    const historicalBehavior = await redis.get(behaviorKey) || {};

    let score = 1;

    // Check typing patterns
    if (behavior.typingPattern && historicalBehavior.typingPattern) {
      const similarity = this.calculatePatternSimilarity(
        behavior.typingPattern,
        historicalBehavior.typingPattern
      );
      score *= similarity;
    }

    // Check access patterns
    if (behavior.accessTime) {
      const isNormalTime = this.isNormalAccessTime(
        userId,
        behavior.accessTime,
        historicalBehavior.accessPatterns
      );
      if (!isNormalTime) score *= 0.7;
    }

    // Check resource access patterns
    if (behavior.resourceAccess && historicalBehavior.resourcePatterns) {
      const isNormalAccess = this.isNormalResourceAccess(
        behavior.resourceAccess,
        historicalBehavior.resourcePatterns
      );
      if (!isNormalAccess) score *= 0.8;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get authentication method score
   * @param {string} authMethod - Authentication method used
   * @returns {number} Authentication score (0-1)
   */
  getAuthenticationScore(authMethod) {
    const authScores = {
      'biometric': 1.0,
      'webauthn': 0.95,
      'totp': 0.8,
      'sms': 0.6,
      'password': 0.5,
      'magic-link': 0.7,
      'oauth': 0.75
    };

    return authScores[authMethod] || 0.3;
  }

  /**
   * Create micro-segmented access token
   * @param {Object} user - User object
   * @param {Object} trustContext - Trust context
   * @returns {string} Micro-segmented JWT token
   */
  async createMicroSegmentedToken(user, trustContext) {
    const { trustScore, factors, resources } = trustContext;

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      trustScore,
      factors,
      // Micro-segmentation: specific resource access
      allowedResources: resources || [],
      allowedActions: this.getAllowedActions(trustScore, user.role),
      // Short-lived token for zero trust
      sessionId: uuidv4(),
      issuedAt: Date.now()
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '5m', // Very short-lived tokens
      issuer: 'zero-trust-manager',
      audience: 'fleeks-api'
    });

    // Store session context for continuous verification
    await redis.set(
      `zt-session:${payload.sessionId}`,
      { ...payload, token },
      300 // 5 minutes
    );

    return token;
  }

  /**
   * Get allowed actions based on trust score and role
   * @param {number} trustScore - Current trust score
   * @param {string} role - User role
   * @returns {Array} Allowed actions
   */
  getAllowedActions(trustScore, role) {
    const baseActions = ['read:profile', 'read:public'];
    
    if (trustScore < 0.5) return baseActions;
    
    if (trustScore < 0.7) {
      return [...baseActions, 'read:own-data', 'update:profile'];
    }

    if (trustScore < 0.9) {
      return [
        ...baseActions,
        'read:own-data',
        'write:own-data',
        'update:profile',
        'read:shared-data'
      ];
    }

    // High trust - full access based on role
    const roleActions = {
      admin: ['*'],
      user: [
        'read:own-data',
        'write:own-data',
        'update:profile',
        'read:shared-data',
        'write:shared-data'
      ],
      guest: baseActions
    };

    return roleActions[role] || baseActions;
  }

  /**
   * Continuous verification during session
   * @param {string} sessionId - Session ID
   * @param {Object} currentContext - Current request context
   * @returns {Object} Verification result
   */
  async continuousVerification(sessionId, currentContext) {
    const sessionKey = `zt-session:${sessionId}`;
    const session = await redis.get(sessionKey);

    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }

    // Recalculate trust score with current context
    const newTrustScore = await this.calculateTrustScore({
      userId: session.userId,
      ...currentContext
    });

    // Compare with initial trust score
    const trustDelta = Math.abs(newTrustScore.trustScore - session.trustScore);

    if (trustDelta > 0.3) {
      // Significant trust change - require re-authentication
      return {
        valid: false,
        reason: 'Significant trust score change',
        requireReauth: true,
        newTrustScore: newTrustScore.trustScore
      };
    }

    if (newTrustScore.decision === 'deny') {
      return {
        valid: false,
        reason: 'Trust score below threshold',
        newTrustScore: newTrustScore.trustScore
      };
    }

    // Update session with new trust score
    await redis.set(sessionKey, {
      ...session,
      trustScore: newTrustScore.trustScore,
      lastVerified: new Date().toISOString()
    }, 300);

    return {
      valid: true,
      trustScore: newTrustScore.trustScore,
      factors: newTrustScore.factors
    };
  }

  /**
   * Register new device
   * @param {string} userId - User ID
   * @param {string} deviceId - Device ID
   */
  async registerDevice(userId, deviceId) {
    const deviceKey = `device:${userId}:${deviceId}`;
    await redis.set(deviceKey, {
      deviceId,
      userId,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      trustScore: 0.3,
      compromised: false
    });
  }

  /**
   * Store trust decision for audit
   * @param {string} userId - User ID
   * @param {Object} decision - Trust decision
   */
  async storeTrustDecision(userId, decision) {
    const auditKey = `trust-audit:${userId}:${Date.now()}`;
    await redis.set(auditKey, decision, 86400 * 30); // Keep for 30 days
  }

  /**
   * Calculate pattern similarity
   * @param {Array} pattern1 - First pattern
   * @param {Array} pattern2 - Second pattern
   * @returns {number} Similarity score (0-1)
   */
  calculatePatternSimilarity(pattern1, pattern2) {
    if (!pattern1 || !pattern2) return 0.5;

    // Simple cosine similarity
    const dotProduct = pattern1.reduce((sum, val, i) => sum + val * (pattern2[i] || 0), 0);
    const magnitude1 = Math.sqrt(pattern1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(pattern2.reduce((sum, val) => sum + val * val, 0));

    if (magnitude1 === 0 || magnitude2 === 0) return 0;

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Check if access time is normal
   * @param {string} userId - User ID
   * @param {Date} accessTime - Current access time
   * @param {Object} patterns - Historical patterns
   * @returns {boolean} Is normal access time
   */
  isNormalAccessTime(userId, accessTime, patterns) {
    if (!patterns || !patterns.timePatterns) return true;

    const hour = new Date(accessTime).getHours();
    const dayOfWeek = new Date(accessTime).getDay();

    // Check if within normal hours
    const normalHours = patterns.timePatterns[dayOfWeek] || patterns.timePatterns.default;
    if (!normalHours) return true;

    return hour >= normalHours.start && hour <= normalHours.end;
  }

  /**
   * Check if resource access is normal
   * @param {Array} resources - Resources being accessed
   * @param {Object} patterns - Historical patterns
   * @returns {boolean} Is normal resource access
   */
  isNormalResourceAccess(resources, patterns) {
    if (!patterns || !resources) return true;

    // Check if accessing unusual resources
    const unusualResources = resources.filter(r => 
      !patterns.frequentResources || 
      !patterns.frequentResources.includes(r)
    );

    // If more than 50% are unusual, flag as abnormal
    return unusualResources.length < resources.length * 0.5;
  }

  /**
   * Export trust metrics for monitoring
   * @param {string} userId - User ID
   * @returns {Object} Trust metrics
   */
  async exportTrustMetrics(userId) {
    const pattern = `trust-audit:${userId}:*`;
    const keys = await redis.keys(pattern);
    const decisions = await Promise.all(keys.map(key => redis.get(key)));

    const metrics = {
      totalDecisions: decisions.length,
      deniedCount: decisions.filter(d => d.decision === 'deny').length,
      averageTrustScore: decisions.reduce((sum, d) => sum + d.trustScore, 0) / decisions.length,
      factorAnalysis: {}
    };

    // Analyze factors
    decisions.forEach(decision => {
      decision.factors.forEach(factor => {
        if (!metrics.factorAnalysis[factor.factor]) {
          metrics.factorAnalysis[factor.factor] = {
            total: 0,
            sum: 0
          };
        }
        metrics.factorAnalysis[factor.factor].total++;
        metrics.factorAnalysis[factor.factor].sum += factor.score;
      });
    });

    // Calculate average scores per factor
    Object.keys(metrics.factorAnalysis).forEach(factor => {
      const data = metrics.factorAnalysis[factor];
      metrics.factorAnalysis[factor].average = data.sum / data.total;
    });

    return metrics;
  }
}

module.exports = new ZeroTrustManager();