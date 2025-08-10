const ZeroTrustManager = require('./zero-trust/ZeroTrustManager');
const WebAuthnService = require('./webauthn/WebAuthnService');
const BiometricAuthService = require('./biometrics/BiometricAuthService');
const AnomalyDetectionService = require('./anomaly/AnomalyDetectionService');
const DRMStreamingService = require('./drm/DRMStreamingService');
const PrivacyAnalyticsService = require('./privacy/PrivacyAnalyticsService');
const securityMiddleware = require('./middleware/securityMiddleware');
const securityRoutes = require('./routes/securityRoutes');

/**
 * Security Module
 * Exports all security services and middleware
 */
module.exports = {
  // Services
  ZeroTrustManager,
  WebAuthnService,
  BiometricAuthService,
  AnomalyDetectionService,
  DRMStreamingService,
  PrivacyAnalyticsService,
  
  // Middleware
  middleware: securityMiddleware,
  
  // Routes
  routes: securityRoutes,
  
  // Initialize security module
  initialize: async () => {
    try {
      // Initialize anomaly detection models
      await AnomalyDetectionService.initializeModels();
      
      // Any other initialization
      console.log('Security module initialized');
    } catch (error) {
      console.error('Security module initialization error:', error);
    }
  }
};