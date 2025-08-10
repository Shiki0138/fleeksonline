const ZeroTrustManager = require('../zero-trust/ZeroTrustManager');
const WebAuthnService = require('../webauthn/WebAuthnService');
const BiometricAuthService = require('../biometrics/BiometricAuthService');
const AnomalyDetectionService = require('../anomaly/AnomalyDetectionService');
const logger = require('../../config/logger');

/**
 * Security Middleware
 * Integrates all security services into Express middleware
 */

/**
 * Zero Trust verification middleware
 */
const zeroTrustVerification = async (req, res, next) => {
  try {
    const context = {
      userId: req.user?.id,
      deviceId: req.headers['x-device-id'] || req.sessionID,
      location: {
        ip: req.ip,
        country: req.headers['x-country'],
        city: req.headers['x-city'],
        isVPN: req.headers['x-vpn'] === 'true',
        isTOR: req.headers['x-tor'] === 'true',
        isProxy: req.headers['x-proxy'] === 'true'
      },
      behavior: {
        accessTime: new Date(),
        userAgent: req.headers['user-agent'],
        apiCallCount: req.session?.apiCallCount || 0,
        errorCount: req.session?.errorCount || 0
      },
      authMethod: req.authMethod || 'password'
    };

    // Calculate trust score
    const trustResult = await ZeroTrustManager.calculateTrustScore(context);

    // Attach trust score to request
    req.trustScore = trustResult.trustScore;
    req.trustFactors = trustResult.factors;

    if (trustResult.decision === 'deny') {
      return res.status(403).json({
        error: 'Access denied',
        reason: 'Insufficient trust score',
        trustScore: trustResult.trustScore,
        requiresAdditionalAuth: trustResult.requiresAdditionalAuth
      });
    }

    if (trustResult.requiresAdditionalAuth) {
      return res.status(401).json({
        error: 'Additional authentication required',
        trustScore: trustResult.trustScore,
        authMethods: ['webauthn', 'biometric', 'totp']
      });
    }

    // Create micro-segmented token if needed
    if (req.user && !req.headers['x-zt-token']) {
      const token = await ZeroTrustManager.createMicroSegmentedToken(req.user, {
        trustScore: trustResult.trustScore,
        factors: trustResult.factors,
        resources: req.requestedResources || []
      });
      res.setHeader('X-ZT-Token', token);
    }

    next();
  } catch (error) {
    logger.error('Zero Trust verification error:', error);
    res.status(500).json({ error: 'Security verification failed' });
  }
};

/**
 * Continuous verification middleware
 */
const continuousVerification = async (req, res, next) => {
  try {
    if (!req.headers['x-zt-session']) {
      return next();
    }

    const sessionId = req.headers['x-zt-session'];
    const currentContext = {
      deviceId: req.headers['x-device-id'],
      location: {
        ip: req.ip,
        country: req.headers['x-country']
      },
      behavior: {
        accessTime: new Date(),
        userAgent: req.headers['user-agent']
      }
    };

    const verification = await ZeroTrustManager.continuousVerification(sessionId, currentContext);

    if (!verification.valid) {
      return res.status(403).json({
        error: 'Session invalid',
        reason: verification.reason,
        requireReauth: verification.requireReauth
      });
    }

    req.trustScore = verification.trustScore;
    next();
  } catch (error) {
    logger.error('Continuous verification error:', error);
    next();
  }
};

/**
 * WebAuthn registration middleware
 */
const webAuthnRegistration = async (req, res, next) => {
  try {
    const { action } = req.body;

    if (action === 'generate-options') {
      const options = await WebAuthnService.generateRegistrationOptions(req.user, {
        authenticatorType: req.body.authenticatorType
      });
      return res.json(options);
    }

    if (action === 'verify-registration') {
      const { credential, challengeId } = req.body;
      const result = await WebAuthnService.verifyRegistrationResponse(
        req.user,
        credential,
        challengeId
      );
      return res.json(result);
    }

    next();
  } catch (error) {
    logger.error('WebAuthn registration error:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * WebAuthn authentication middleware
 */
const webAuthnAuthentication = async (req, res, next) => {
  try {
    const { action } = req.body;

    if (action === 'generate-options') {
      const userId = req.body.userId || null; // For usernameless flow
      const options = await WebAuthnService.generateAuthenticationOptions(userId);
      return res.json(options);
    }

    if (action === 'verify-authentication') {
      const { credential, challengeId } = req.body;
      const result = await WebAuthnService.verifyAuthenticationResponse(
        credential,
        challengeId
      );
      
      if (result.verified) {
        req.authMethod = 'webauthn';
        req.userId = result.userId;
        req.deviceName = result.deviceName;
      }
      
      return res.json(result);
    }

    next();
  } catch (error) {
    logger.error('WebAuthn authentication error:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Biometric authentication middleware
 */
const biometricAuthentication = async (req, res, next) => {
  try {
    const { biometricType, biometricData, action } = req.body;

    if (action === 'enroll') {
      const result = await BiometricAuthService.enrollBiometric(
        req.user.id,
        biometricType,
        biometricData
      );
      return res.json(result);
    }

    if (action === 'verify') {
      const result = await BiometricAuthService.verifyBiometric(
        req.user?.id || req.body.userId,
        biometricType,
        biometricData
      );
      
      if (result.verified) {
        req.authMethod = 'biometric';
        req.biometricType = biometricType;
      }
      
      return res.json(result);
    }

    next();
  } catch (error) {
    logger.error('Biometric authentication error:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Anomaly detection middleware
 */
const anomalyDetection = async (req, res, next) => {
  try {
    if (!req.user) return next();

    // Collect behavior data
    const behavior = {
      loginTime: req.session?.loginTime || new Date(),
      location: {
        ip: req.ip,
        country: req.headers['x-country'],
        city: req.headers['x-city']
      },
      device: {
        id: req.headers['x-device-id'] || req.sessionID,
        type: req.device?.type || 'unknown',
        os: req.headers['x-os'] || 'unknown'
      },
      sessionDuration: req.session?.loginTime ? 
        Date.now() - new Date(req.session.loginTime).getTime() : 0,
      clickCount: req.session?.clickCount || 0,
      apiCallCount: req.session?.apiCallCount || 0,
      errorCount: req.session?.errorCount || 0,
      userAgent: req.headers['user-agent']
    };

    // Increment counters
    if (req.session) {
      req.session.apiCallCount = (req.session.apiCallCount || 0) + 1;
    }

    // Analyze behavior
    const analysis = await AnomalyDetectionService.analyzeBehavior(req.user.id, behavior);

    // Attach analysis to request
    req.anomalyAnalysis = analysis;

    if (analysis.isAnomaly && analysis.riskScore > 0.8) {
      // High risk anomaly detected
      logger.warn(`High risk anomaly detected for user ${req.user.id}:`, analysis);

      // Apply recommendations
      for (const recommendation of analysis.recommendations) {
        switch (recommendation.action) {
          case 'require_mfa':
            if (!req.mfaVerified) {
              return res.status(401).json({
                error: 'Additional authentication required',
                reason: 'Unusual activity detected',
                mfaRequired: true
              });
            }
            break;
          
          case 'rate_limit':
            req.rateLimitMultiplier = 0.5; // Reduce rate limit
            break;
          
          case 'verify_identity':
            req.identityVerificationRequired = true;
            break;
        }
      }
    }

    next();
  } catch (error) {
    logger.error('Anomaly detection error:', error);
    next(); // Don't block on anomaly detection errors
  }
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  // HSTS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self' wss: https:; " +
    "media-src 'self' blob:; " +
    "object-src 'none'; " +
    "frame-ancestors 'none';"
  );
  
  // Other security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()'
  );
  
  next();
};

/**
 * Privacy tracking middleware
 */
const privacyTracking = async (req, res, next) => {
  try {
    // Track response after request completes
    res.on('finish', async () => {
      if (req.user && req.trackingEnabled !== false) {
        const PrivacyAnalyticsService = require('../privacy/PrivacyAnalyticsService');
        
        await PrivacyAnalyticsService.trackEvent(req.user.id, 'api_request', {
          action: req.method,
          category: req.baseUrl || req.path,
          success: res.statusCode < 400,
          duration: Date.now() - req.startTime,
          error_type: res.statusCode >= 400 ? `HTTP_${res.statusCode}` : null,
          device_type: req.device?.type,
          browser: req.headers['user-agent'],
          os: req.headers['x-os'],
          country: req.headers['x-country']
        });
      }
    });

    next();
  } catch (error) {
    logger.error('Privacy tracking error:', error);
    next();
  }
};

/**
 * Request timing middleware
 */
const requestTiming = (req, res, next) => {
  req.startTime = Date.now();
  next();
};

/**
 * Error counter middleware
 */
const errorCounter = (err, req, res, next) => {
  if (req.session) {
    req.session.errorCount = (req.session.errorCount || 0) + 1;
  }
  next(err);
};

module.exports = {
  zeroTrustVerification,
  continuousVerification,
  webAuthnRegistration,
  webAuthnAuthentication,
  biometricAuthentication,
  anomalyDetection,
  securityHeaders,
  privacyTracking,
  requestTiming,
  errorCounter
};