const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const crypto = require('crypto');
const logger = require('../../config/logger');
const redis = require('../../config/redis');

/**
 * WebAuthn Service for passwordless authentication
 * Implements FIDO2/WebAuthn standards for biometric and security key authentication
 */
class WebAuthnService {
  constructor() {
    this.rpName = process.env.WEBAUTHN_RP_NAME || 'Fleeks Security';
    this.rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
    this.origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';
    this.challengeTimeout = 60000; // 60 seconds
  }

  /**
   * Generate registration options for new credential
   * @param {Object} user - User object
   * @param {Object} options - Registration options
   * @returns {Object} Registration options
   */
  async generateRegistrationOptions(user, options = {}) {
    try {
      // Get user's existing credentials
      const credentialsKey = `webauthn:credentials:${user.id}`;
      const existingCredentials = await redis.get(credentialsKey) || [];

      // Generate registration options
      const registrationOptions = await generateRegistrationOptions({
        rpName: this.rpName,
        rpID: this.rpID,
        userID: user.id,
        userName: user.email,
        userDisplayName: `${user.firstName} ${user.lastName}`,
        timeout: this.challengeTimeout,
        attestationType: 'direct',
        excludeCredentials: existingCredentials.map(cred => ({
          id: Buffer.from(cred.credentialID, 'base64'),
          type: 'public-key',
          transports: cred.transports || ['usb', 'ble', 'nfc', 'internal']
        })),
        authenticatorSelection: {
          authenticatorAttachment: options.authenticatorType || 'cross-platform',
          userVerification: 'required',
          requireResidentKey: false
        },
        supportedAlgorithmIDs: [-7, -257] // ES256, RS256
      });

      // Store challenge for verification
      const challengeKey = `webauthn:challenge:${user.id}:${registrationOptions.challenge}`;
      await redis.set(challengeKey, {
        type: 'registration',
        userId: user.id,
        timestamp: Date.now()
      }, this.challengeTimeout / 1000);

      logger.info(`WebAuthn registration initiated for user: ${user.email}`);

      return {
        options: registrationOptions,
        challengeId: registrationOptions.challenge
      };
    } catch (error) {
      logger.error('WebAuthn registration generation error:', error);
      throw error;
    }
  }

  /**
   * Verify registration response
   * @param {Object} user - User object
   * @param {Object} credential - Credential response from client
   * @param {string} challengeId - Challenge ID
   * @returns {Object} Verification result
   */
  async verifyRegistrationResponse(user, credential, challengeId) {
    try {
      // Retrieve and validate challenge
      const challengeKey = `webauthn:challenge:${user.id}:${challengeId}`;
      const challengeData = await redis.get(challengeKey);

      if (!challengeData || challengeData.type !== 'registration') {
        throw new Error('Invalid or expired challenge');
      }

      // Clean up challenge
      await redis.del(challengeKey);

      // Verify registration
      const verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: challengeId,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        requireUserVerification: true
      });

      if (!verification.verified) {
        throw new Error('Registration verification failed');
      }

      // Store credential
      const credentialData = {
        credentialID: Buffer.from(verification.registrationInfo.credentialID).toString('base64'),
        credentialPublicKey: Buffer.from(verification.registrationInfo.credentialPublicKey).toString('base64'),
        counter: verification.registrationInfo.counter,
        transports: credential.response.transports || ['usb', 'ble', 'nfc', 'internal'],
        createdAt: new Date().toISOString(),
        lastUsed: null,
        deviceName: credential.deviceName || 'Unknown Device',
        aaguid: verification.registrationInfo.aaguid,
        fmt: verification.registrationInfo.fmt,
        userVerified: verification.registrationInfo.userVerified,
        attestationObject: credential.response.attestationObject,
        isBackupEligible: verification.registrationInfo.isBackupEligible || false,
        isBackupState: verification.registrationInfo.isBackupState || false
      };

      // Store in user's credentials
      const credentialsKey = `webauthn:credentials:${user.id}`;
      const existingCredentials = await redis.get(credentialsKey) || [];
      existingCredentials.push(credentialData);
      await redis.set(credentialsKey, existingCredentials);

      // Store credential lookup
      const lookupKey = `webauthn:lookup:${credentialData.credentialID}`;
      await redis.set(lookupKey, {
        userId: user.id,
        credentialID: credentialData.credentialID
      });

      logger.info(`WebAuthn credential registered for user: ${user.email}`);

      return {
        verified: true,
        credentialID: credentialData.credentialID,
        deviceName: credentialData.deviceName,
        isBackupEligible: credentialData.isBackupEligible
      };
    } catch (error) {
      logger.error('WebAuthn registration verification error:', error);
      throw error;
    }
  }

  /**
   * Generate authentication options
   * @param {string} userId - User ID (optional for usernameless flow)
   * @returns {Object} Authentication options
   */
  async generateAuthenticationOptions(userId = null) {
    try {
      let allowCredentials = [];

      if (userId) {
        // Get user's credentials for username flow
        const credentialsKey = `webauthn:credentials:${userId}`;
        const credentials = await redis.get(credentialsKey) || [];
        
        allowCredentials = credentials.map(cred => ({
          id: Buffer.from(cred.credentialID, 'base64'),
          type: 'public-key',
          transports: cred.transports
        }));
      }

      // Generate authentication options
      const authenticationOptions = await generateAuthenticationOptions({
        timeout: this.challengeTimeout,
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
        userVerification: 'required',
        rpID: this.rpID
      });

      // Store challenge
      const challengeKey = `webauthn:auth-challenge:${authenticationOptions.challenge}`;
      await redis.set(challengeKey, {
        type: 'authentication',
        userId: userId,
        timestamp: Date.now()
      }, this.challengeTimeout / 1000);

      return {
        options: authenticationOptions,
        challengeId: authenticationOptions.challenge
      };
    } catch (error) {
      logger.error('WebAuthn authentication generation error:', error);
      throw error;
    }
  }

  /**
   * Verify authentication response
   * @param {Object} credential - Credential response from client
   * @param {string} challengeId - Challenge ID
   * @returns {Object} Verification result with user info
   */
  async verifyAuthenticationResponse(credential, challengeId) {
    try {
      // Retrieve challenge
      const challengeKey = `webauthn:auth-challenge:${challengeId}`;
      const challengeData = await redis.get(challengeKey);

      if (!challengeData || challengeData.type !== 'authentication') {
        throw new Error('Invalid or expired challenge');
      }

      // Clean up challenge
      await redis.del(challengeKey);

      // Look up credential
      const credentialID = credential.id;
      const lookupKey = `webauthn:lookup:${credentialID}`;
      const lookupData = await redis.get(lookupKey);

      if (!lookupData) {
        throw new Error('Credential not found');
      }

      // Get user's credentials
      const credentialsKey = `webauthn:credentials:${lookupData.userId}`;
      const credentials = await redis.get(credentialsKey) || [];
      const authenticator = credentials.find(c => c.credentialID === credentialID);

      if (!authenticator) {
        throw new Error('Authenticator not found');
      }

      // Verify authentication
      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: challengeId,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        authenticator: {
          credentialID: Buffer.from(authenticator.credentialID, 'base64'),
          credentialPublicKey: Buffer.from(authenticator.credentialPublicKey, 'base64'),
          counter: authenticator.counter
        },
        requireUserVerification: true
      });

      if (!verification.verified) {
        throw new Error('Authentication verification failed');
      }

      // Update counter
      authenticator.counter = verification.authenticationInfo.newCounter;
      authenticator.lastUsed = new Date().toISOString();

      // Update stored credentials
      const updatedCredentials = credentials.map(c => 
        c.credentialID === credentialID ? authenticator : c
      );
      await redis.set(credentialsKey, updatedCredentials);

      // Log authentication
      await this.logAuthentication(lookupData.userId, {
        credentialID,
        deviceName: authenticator.deviceName,
        userVerified: verification.authenticationInfo.userVerified,
        success: true
      });

      logger.info(`WebAuthn authentication successful for credential: ${credentialID}`);

      return {
        verified: true,
        userId: lookupData.userId,
        credentialID,
        deviceName: authenticator.deviceName,
        isBackupState: authenticator.isBackupState
      };
    } catch (error) {
      logger.error('WebAuthn authentication verification error:', error);
      throw error;
    }
  }

  /**
   * List user's registered credentials
   * @param {string} userId - User ID
   * @returns {Array} List of credentials
   */
  async listUserCredentials(userId) {
    try {
      const credentialsKey = `webauthn:credentials:${userId}`;
      const credentials = await redis.get(credentialsKey) || [];

      return credentials.map(cred => ({
        credentialID: cred.credentialID,
        deviceName: cred.deviceName,
        createdAt: cred.createdAt,
        lastUsed: cred.lastUsed,
        transports: cred.transports,
        isBackupEligible: cred.isBackupEligible,
        isBackupState: cred.isBackupState
      }));
    } catch (error) {
      logger.error('Error listing user credentials:', error);
      throw error;
    }
  }

  /**
   * Remove a credential
   * @param {string} userId - User ID
   * @param {string} credentialID - Credential ID to remove
   * @returns {boolean} Success status
   */
  async removeCredential(userId, credentialID) {
    try {
      const credentialsKey = `webauthn:credentials:${userId}`;
      const credentials = await redis.get(credentialsKey) || [];

      const filteredCredentials = credentials.filter(c => c.credentialID !== credentialID);

      if (filteredCredentials.length === credentials.length) {
        throw new Error('Credential not found');
      }

      await redis.set(credentialsKey, filteredCredentials);

      // Remove lookup
      const lookupKey = `webauthn:lookup:${credentialID}`;
      await redis.del(lookupKey);

      logger.info(`WebAuthn credential removed: ${credentialID} for user: ${userId}`);

      return true;
    } catch (error) {
      logger.error('Error removing credential:', error);
      throw error;
    }
  }

  /**
   * Rename a credential
   * @param {string} userId - User ID
   * @param {string} credentialID - Credential ID
   * @param {string} newName - New device name
   * @returns {boolean} Success status
   */
  async renameCredential(userId, credentialID, newName) {
    try {
      const credentialsKey = `webauthn:credentials:${userId}`;
      const credentials = await redis.get(credentialsKey) || [];

      const credential = credentials.find(c => c.credentialID === credentialID);
      if (!credential) {
        throw new Error('Credential not found');
      }

      credential.deviceName = newName;
      await redis.set(credentialsKey, credentials);

      logger.info(`WebAuthn credential renamed: ${credentialID} to ${newName}`);

      return true;
    } catch (error) {
      logger.error('Error renaming credential:', error);
      throw error;
    }
  }

  /**
   * Check if user has WebAuthn credentials
   * @param {string} userId - User ID
   * @returns {boolean} Has credentials
   */
  async hasCredentials(userId) {
    try {
      const credentialsKey = `webauthn:credentials:${userId}`;
      const credentials = await redis.get(credentialsKey) || [];
      return credentials.length > 0;
    } catch (error) {
      logger.error('Error checking credentials:', error);
      return false;
    }
  }

  /**
   * Log authentication attempt
   * @param {string} userId - User ID
   * @param {Object} details - Authentication details
   */
  async logAuthentication(userId, details) {
    const logKey = `webauthn:auth-log:${userId}:${Date.now()}`;
    await redis.set(logKey, {
      ...details,
      timestamp: new Date().toISOString()
    }, 86400 * 30); // Keep for 30 days
  }

  /**
   * Get authentication history
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to return
   * @returns {Array} Authentication history
   */
  async getAuthenticationHistory(userId, limit = 10) {
    try {
      const pattern = `webauthn:auth-log:${userId}:*`;
      const keys = await redis.keys(pattern);
      
      // Sort by timestamp (descending)
      keys.sort((a, b) => {
        const timeA = parseInt(a.split(':').pop());
        const timeB = parseInt(b.split(':').pop());
        return timeB - timeA;
      });

      const limitedKeys = keys.slice(0, limit);
      const history = await Promise.all(limitedKeys.map(key => redis.get(key)));

      return history;
    } catch (error) {
      logger.error('Error getting authentication history:', error);
      return [];
    }
  }

  /**
   * Enable passwordless authentication for user
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  async enablePasswordless(userId) {
    try {
      const settingsKey = `webauthn:settings:${userId}`;
      await redis.set(settingsKey, {
        passwordlessEnabled: true,
        enabledAt: new Date().toISOString()
      });

      logger.info(`Passwordless authentication enabled for user: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error enabling passwordless:', error);
      throw error;
    }
  }

  /**
   * Check if passwordless is enabled
   * @param {string} userId - User ID
   * @returns {boolean} Passwordless enabled status
   */
  async isPasswordlessEnabled(userId) {
    try {
      const settingsKey = `webauthn:settings:${userId}`;
      const settings = await redis.get(settingsKey);
      return settings?.passwordlessEnabled || false;
    } catch (error) {
      logger.error('Error checking passwordless status:', error);
      return false;
    }
  }
}

module.exports = new WebAuthnService();