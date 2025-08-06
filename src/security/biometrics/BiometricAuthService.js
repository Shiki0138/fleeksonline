const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const logger = require('../../config/logger');
const redis = require('../../config/redis');

/**
 * Biometric Authentication Service
 * Handles biometric authentication including face, fingerprint, and voice recognition
 */
class BiometricAuthService {
  constructor() {
    this.biometricModes = ['face', 'fingerprint', 'voice', 'iris', 'palm'];
    this.templateExpiry = 365 * 24 * 60 * 60; // 1 year
    this.verificationThreshold = {
      face: 0.95,
      fingerprint: 0.99,
      voice: 0.90,
      iris: 0.999,
      palm: 0.98
    };
  }

  /**
   * Enroll biometric data
   * @param {string} userId - User ID
   * @param {string} biometricType - Type of biometric
   * @param {Object} biometricData - Biometric template data
   * @returns {Object} Enrollment result
   */
  async enrollBiometric(userId, biometricType, biometricData) {
    try {
      if (!this.biometricModes.includes(biometricType)) {
        throw new Error('Invalid biometric type');
      }

      // Generate unique template ID
      const templateId = crypto.randomBytes(32).toString('hex');

      // Process and encrypt biometric template
      const encryptedTemplate = await this.encryptBiometricTemplate(biometricData);

      // Store biometric template
      const templateKey = `biometric:${userId}:${biometricType}:${templateId}`;
      const templateData = {
        templateId,
        userId,
        biometricType,
        enrolledAt: new Date().toISOString(),
        lastUsed: null,
        useCount: 0,
        deviceInfo: biometricData.deviceInfo || {},
        quality: biometricData.quality || 1.0,
        encryptedTemplate: encryptedTemplate,
        isActive: true,
        antiSpoofingLevel: biometricData.antiSpoofingLevel || 'high'
      };

      await redis.set(templateKey, templateData, this.templateExpiry);

      // Add to user's biometric index
      const indexKey = `biometric:index:${userId}`;
      const biometricIndex = await redis.get(indexKey) || {};
      
      if (!biometricIndex[biometricType]) {
        biometricIndex[biometricType] = [];
      }
      
      biometricIndex[biometricType].push({
        templateId,
        enrolledAt: templateData.enrolledAt,
        deviceInfo: templateData.deviceInfo
      });

      await redis.set(indexKey, biometricIndex);

      // Generate backup codes for biometric recovery
      const backupCodes = await this.generateBackupCodes(userId, templateId);

      logger.info(`Biometric enrolled: ${biometricType} for user ${userId}`);

      return {
        success: true,
        templateId,
        biometricType,
        backupCodes,
        antiSpoofingLevel: templateData.antiSpoofingLevel
      };
    } catch (error) {
      logger.error('Biometric enrollment error:', error);
      throw error;
    }
  }

  /**
   * Verify biometric authentication
   * @param {string} userId - User ID
   * @param {string} biometricType - Type of biometric
   * @param {Object} biometricData - Biometric data to verify
   * @returns {Object} Verification result
   */
  async verifyBiometric(userId, biometricType, biometricData) {
    try {
      // Get user's biometric templates
      const indexKey = `biometric:index:${userId}`;
      const biometricIndex = await redis.get(indexKey);

      if (!biometricIndex || !biometricIndex[biometricType]) {
        throw new Error('No biometric templates found');
      }

      // Anti-spoofing checks
      const antiSpoofingResult = await this.performAntiSpoofingChecks(biometricData);
      if (!antiSpoofingResult.passed) {
        await this.logBiometricAttempt(userId, biometricType, false, 'spoofing_detected');
        throw new Error('Anti-spoofing check failed');
      }

      // Try matching against all templates
      let bestMatch = null;
      let bestScore = 0;

      for (const template of biometricIndex[biometricType]) {
        const templateKey = `biometric:${userId}:${biometricType}:${template.templateId}`;
        const templateData = await redis.get(templateKey);

        if (!templateData || !templateData.isActive) continue;

        // Decrypt and match template
        const decryptedTemplate = await this.decryptBiometricTemplate(templateData.encryptedTemplate);
        const matchScore = await this.matchBiometric(
          biometricType,
          biometricData,
          decryptedTemplate
        );

        if (matchScore > bestScore) {
          bestScore = matchScore;
          bestMatch = templateData;
        }
      }

      // Check if match meets threshold
      const threshold = this.verificationThreshold[biometricType];
      const verified = bestScore >= threshold;

      if (verified && bestMatch) {
        // Update template usage
        bestMatch.lastUsed = new Date().toISOString();
        bestMatch.useCount++;
        
        const templateKey = `biometric:${userId}:${biometricType}:${bestMatch.templateId}`;
        await redis.set(templateKey, bestMatch, this.templateExpiry);
      }

      // Log attempt
      await this.logBiometricAttempt(userId, biometricType, verified, 
        verified ? 'success' : 'match_failed', bestScore);

      return {
        verified,
        matchScore: bestScore,
        threshold,
        antiSpoofing: antiSpoofingResult,
        templateId: verified ? bestMatch.templateId : null
      };
    } catch (error) {
      logger.error('Biometric verification error:', error);
      throw error;
    }
  }

  /**
   * Perform anti-spoofing checks
   * @param {Object} biometricData - Biometric data
   * @returns {Object} Anti-spoofing result
   */
  async performAntiSpoofingChecks(biometricData) {
    const checks = {
      liveness: false,
      quality: false,
      consistency: false,
      environmental: false
    };

    // Liveness detection
    if (biometricData.liveness) {
      checks.liveness = biometricData.liveness.score > 0.95;
    }

    // Quality assessment
    if (biometricData.quality) {
      checks.quality = biometricData.quality > 0.8;
    }

    // Temporal consistency (for video-based biometrics)
    if (biometricData.frames && biometricData.frames.length > 1) {
      checks.consistency = this.checkTemporalConsistency(biometricData.frames);
    }

    // Environmental checks
    if (biometricData.environment) {
      checks.environmental = this.checkEnvironmentalFactors(biometricData.environment);
    }

    const passedChecks = Object.values(checks).filter(v => v === true).length;
    const totalChecks = Object.keys(checks).length;
    const passed = passedChecks >= Math.ceil(totalChecks * 0.75); // 75% must pass

    return {
      passed,
      checks,
      score: passedChecks / totalChecks,
      confidence: biometricData.confidence || 0
    };
  }

  /**
   * Match biometric data
   * @param {string} biometricType - Type of biometric
   * @param {Object} inputData - Input biometric data
   * @param {Object} templateData - Stored template data
   * @returns {number} Match score (0-1)
   */
  async matchBiometric(biometricType, inputData, templateData) {
    // This is a simplified matching algorithm
    // In production, use specialized biometric matching libraries
    
    switch (biometricType) {
      case 'face':
        return this.matchFaceBiometric(inputData, templateData);
      case 'fingerprint':
        return this.matchFingerprintBiometric(inputData, templateData);
      case 'voice':
        return this.matchVoiceBiometric(inputData, templateData);
      case 'iris':
        return this.matchIrisBiometric(inputData, templateData);
      case 'palm':
        return this.matchPalmBiometric(inputData, templateData);
      default:
        throw new Error('Unsupported biometric type');
    }
  }

  /**
   * Match face biometric
   * @param {Object} inputData - Input face data
   * @param {Object} templateData - Template face data
   * @returns {number} Match score
   */
  matchFaceBiometric(inputData, templateData) {
    // Simplified face matching using feature vectors
    if (!inputData.features || !templateData.features) return 0;

    const distance = this.euclideanDistance(inputData.features, templateData.features);
    const maxDistance = Math.sqrt(inputData.features.length); // Normalize
    
    return Math.max(0, 1 - (distance / maxDistance));
  }

  /**
   * Match fingerprint biometric
   * @param {Object} inputData - Input fingerprint data
   * @param {Object} templateData - Template fingerprint data
   * @returns {number} Match score
   */
  matchFingerprintBiometric(inputData, templateData) {
    // Simplified minutiae matching
    if (!inputData.minutiae || !templateData.minutiae) return 0;

    const matchedMinutiae = inputData.minutiae.filter(m1 =>
      templateData.minutiae.some(m2 =>
        Math.abs(m1.x - m2.x) < 5 &&
        Math.abs(m1.y - m2.y) < 5 &&
        Math.abs(m1.angle - m2.angle) < 10
      )
    );

    return matchedMinutiae.length / Math.max(inputData.minutiae.length, templateData.minutiae.length);
  }

  /**
   * Match voice biometric
   * @param {Object} inputData - Input voice data
   * @param {Object} templateData - Template voice data
   * @returns {number} Match score
   */
  matchVoiceBiometric(inputData, templateData) {
    // Simplified voice matching using MFCC features
    if (!inputData.mfcc || !templateData.mfcc) return 0;

    const correlation = this.calculateCorrelation(inputData.mfcc, templateData.mfcc);
    return (correlation + 1) / 2; // Normalize to 0-1
  }

  /**
   * Match iris biometric
   * @param {Object} inputData - Input iris data
   * @param {Object} templateData - Template iris data
   * @returns {number} Match score
   */
  matchIrisBiometric(inputData, templateData) {
    // Simplified iris matching using iris codes
    if (!inputData.irisCode || !templateData.irisCode) return 0;

    const hammingDistance = this.hammingDistance(inputData.irisCode, templateData.irisCode);
    const maxDistance = inputData.irisCode.length;

    return 1 - (hammingDistance / maxDistance);
  }

  /**
   * Match palm biometric
   * @param {Object} inputData - Input palm data
   * @param {Object} templateData - Template palm data
   * @returns {number} Match score
   */
  matchPalmBiometric(inputData, templateData) {
    // Simplified palm matching using palm print features
    if (!inputData.palmFeatures || !templateData.palmFeatures) return 0;

    const similarity = this.cosineSimilarity(inputData.palmFeatures, templateData.palmFeatures);
    return similarity;
  }

  /**
   * Encrypt biometric template
   * @param {Object} template - Biometric template
   * @returns {string} Encrypted template
   */
  async encryptBiometricTemplate(template) {
    const key = Buffer.from(process.env.BIOMETRIC_ENCRYPTION_KEY || crypto.randomBytes(32));
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(template), 'utf8'),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64')
    };
  }

  /**
   * Decrypt biometric template
   * @param {Object} encryptedData - Encrypted template data
   * @returns {Object} Decrypted template
   */
  async decryptBiometricTemplate(encryptedData) {
    const key = Buffer.from(process.env.BIOMETRIC_ENCRYPTION_KEY || crypto.randomBytes(32));
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(encryptedData.iv, 'base64')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedData.encrypted, 'base64')),
      decipher.final()
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  }

  /**
   * Generate backup codes for biometric recovery
   * @param {string} userId - User ID
   * @param {string} templateId - Template ID
   * @returns {Array} Backup codes
   */
  async generateBackupCodes(userId, templateId) {
    const codes = [];
    const codeCount = 8;

    for (let i = 0; i < codeCount; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);

      // Store hashed code
      const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
      const codeKey = `biometric:backup:${userId}:${hashedCode}`;
      
      await redis.set(codeKey, {
        templateId,
        used: false,
        createdAt: new Date().toISOString()
      }, 365 * 24 * 60 * 60); // 1 year expiry
    }

    return codes;
  }

  /**
   * Revoke biometric template
   * @param {string} userId - User ID
   * @param {string} templateId - Template ID
   * @returns {boolean} Success status
   */
  async revokeBiometric(userId, templateId) {
    try {
      // Find template type
      const indexKey = `biometric:index:${userId}`;
      const biometricIndex = await redis.get(indexKey) || {};
      
      let biometricType = null;
      for (const [type, templates] of Object.entries(biometricIndex)) {
        if (templates.some(t => t.templateId === templateId)) {
          biometricType = type;
          break;
        }
      }

      if (!biometricType) {
        throw new Error('Template not found');
      }

      // Mark template as inactive
      const templateKey = `biometric:${userId}:${biometricType}:${templateId}`;
      const templateData = await redis.get(templateKey);
      
      if (templateData) {
        templateData.isActive = false;
        templateData.revokedAt = new Date().toISOString();
        await redis.set(templateKey, templateData, this.templateExpiry);
      }

      logger.info(`Biometric template revoked: ${templateId} for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error revoking biometric:', error);
      throw error;
    }
  }

  /**
   * List user's biometric enrollments
   * @param {string} userId - User ID
   * @returns {Object} Biometric enrollments by type
   */
  async listBiometricEnrollments(userId) {
    try {
      const indexKey = `biometric:index:${userId}`;
      const biometricIndex = await redis.get(indexKey) || {};
      
      const enrollments = {};

      for (const [type, templates] of Object.entries(biometricIndex)) {
        enrollments[type] = await Promise.all(templates.map(async (template) => {
          const templateKey = `biometric:${userId}:${type}:${template.templateId}`;
          const templateData = await redis.get(templateKey);
          
          return {
            templateId: template.templateId,
            enrolledAt: template.enrolledAt,
            deviceInfo: template.deviceInfo,
            isActive: templateData?.isActive || false,
            lastUsed: templateData?.lastUsed,
            useCount: templateData?.useCount || 0
          };
        }));
      }

      return enrollments;
    } catch (error) {
      logger.error('Error listing biometric enrollments:', error);
      throw error;
    }
  }

  /**
   * Log biometric authentication attempt
   * @param {string} userId - User ID
   * @param {string} biometricType - Type of biometric
   * @param {boolean} success - Success status
   * @param {string} reason - Reason for failure
   * @param {number} score - Match score
   */
  async logBiometricAttempt(userId, biometricType, success, reason, score = 0) {
    const logKey = `biometric:log:${userId}:${Date.now()}`;
    await redis.set(logKey, {
      biometricType,
      success,
      reason,
      score,
      timestamp: new Date().toISOString()
    }, 86400 * 30); // Keep for 30 days
  }

  // Utility functions
  euclideanDistance(vec1, vec2) {
    return Math.sqrt(vec1.reduce((sum, val, i) => sum + Math.pow(val - vec2[i], 2), 0));
  }

  calculateCorrelation(vec1, vec2) {
    const n = vec1.length;
    const sum1 = vec1.reduce((a, b) => a + b);
    const sum2 = vec2.reduce((a, b) => a + b);
    const sum1Sq = vec1.reduce((a, b) => a + b * b);
    const sum2Sq = vec2.reduce((a, b) => a + b * b);
    const pSum = vec1.reduce((a, b, i) => a + b * vec2[i], 0);

    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));

    return den === 0 ? 0 : num / den;
  }

  hammingDistance(str1, str2) {
    return str1.split('').filter((char, i) => char !== str2[i]).length;
  }

  cosineSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

    return mag1 && mag2 ? dotProduct / (mag1 * mag2) : 0;
  }

  checkTemporalConsistency(frames) {
    // Check if biometric features are consistent across frames
    // This is a simplified check - real implementation would be more sophisticated
    if (frames.length < 2) return true;

    const similarities = [];
    for (let i = 1; i < frames.length; i++) {
      if (frames[i].features && frames[i-1].features) {
        const similarity = this.cosineSimilarity(frames[i].features, frames[i-1].features);
        similarities.push(similarity);
      }
    }

    const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
    return avgSimilarity > 0.85; // High similarity expected between consecutive frames
  }

  checkEnvironmentalFactors(environment) {
    // Check if environmental conditions are suitable
    const checks = {
      lighting: environment.lighting >= 100 && environment.lighting <= 1000, // lux
      noise: environment.noiseLevel < 60, // dB
      motion: environment.motion < 0.1, // g-force
      temperature: environment.temperature >= 15 && environment.temperature <= 30 // Celsius
    };

    const passedChecks = Object.values(checks).filter(v => v === true).length;
    return passedChecks >= Object.keys(checks).length * 0.75;
  }
}

module.exports = new BiometricAuthService();