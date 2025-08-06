const express = require('express');
const router = express.Router();
const {
  webAuthnRegistration,
  webAuthnAuthentication,
  biometricAuthentication,
  zeroTrustVerification
} = require('../middleware/securityMiddleware');
const WebAuthnService = require('../webauthn/WebAuthnService');
const BiometricAuthService = require('../biometrics/BiometricAuthService');
const DRMStreamingService = require('../drm/DRMStreamingService');
const PrivacyAnalyticsService = require('../privacy/PrivacyAnalyticsService');
const auth = require('../../middleware/auth');
const logger = require('../../config/logger');

/**
 * WebAuthn Routes
 */

// WebAuthn registration
router.post('/webauthn/register', auth, webAuthnRegistration);

// WebAuthn authentication
router.post('/webauthn/authenticate', webAuthnAuthentication);

// List WebAuthn credentials
router.get('/webauthn/credentials', auth, async (req, res) => {
  try {
    const credentials = await WebAuthnService.listUserCredentials(req.user.id);
    res.json({ credentials });
  } catch (error) {
    logger.error('Error listing credentials:', error);
    res.status(500).json({ error: 'Failed to list credentials' });
  }
});

// Remove WebAuthn credential
router.delete('/webauthn/credentials/:credentialId', auth, async (req, res) => {
  try {
    await WebAuthnService.removeCredential(req.user.id, req.params.credentialId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error removing credential:', error);
    res.status(400).json({ error: error.message });
  }
});

// Rename WebAuthn credential
router.put('/webauthn/credentials/:credentialId', auth, async (req, res) => {
  try {
    const { name } = req.body;
    await WebAuthnService.renameCredential(req.user.id, req.params.credentialId, name);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error renaming credential:', error);
    res.status(400).json({ error: error.message });
  }
});

// Enable passwordless
router.post('/webauthn/passwordless', auth, async (req, res) => {
  try {
    const hasCredentials = await WebAuthnService.hasCredentials(req.user.id);
    if (!hasCredentials) {
      return res.status(400).json({ error: 'No WebAuthn credentials registered' });
    }

    await WebAuthnService.enablePasswordless(req.user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error enabling passwordless:', error);
    res.status(500).json({ error: 'Failed to enable passwordless' });
  }
});

/**
 * Biometric Routes
 */

// Biometric enrollment/verification
router.post('/biometric', auth, biometricAuthentication);

// List biometric enrollments
router.get('/biometric/enrollments', auth, async (req, res) => {
  try {
    const enrollments = await BiometricAuthService.listBiometricEnrollments(req.user.id);
    res.json({ enrollments });
  } catch (error) {
    logger.error('Error listing enrollments:', error);
    res.status(500).json({ error: 'Failed to list enrollments' });
  }
});

// Revoke biometric
router.delete('/biometric/:templateId', auth, async (req, res) => {
  try {
    await BiometricAuthService.revokeBiometric(req.user.id, req.params.templateId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error revoking biometric:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * DRM Streaming Routes
 */

// Initialize DRM for asset
router.post('/drm/initialize', auth, async (req, res) => {
  try {
    const { assetId, options } = req.body;
    const result = await DRMStreamingService.initializeDRM(assetId, options);
    res.json(result);
  } catch (error) {
    logger.error('DRM initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize DRM' });
  }
});

// Request license
router.post('/drm/license/:assetId', auth, zeroTrustVerification, async (req, res) => {
  try {
    const { assetId } = req.params;
    const { system } = req.body;
    
    const licenseRequest = {
      ...req.body,
      userId: req.user.id,
      deviceId: req.headers['x-device-id'] || req.sessionID
    };

    const license = await DRMStreamingService.requestLicense(assetId, system, licenseRequest);
    res.json(license);
  } catch (error) {
    logger.error('License request error:', error);
    res.status(403).json({ error: error.message });
  }
});

// Get manifest
router.get('/drm/manifest/:assetId/:format', async (req, res) => {
  try {
    const { assetId, format } = req.params;
    const redis = require('../../config/redis');
    
    const manifestKey = `drm:manifest:${format}:${assetId}`;
    const manifest = await redis.get(manifestKey);
    
    if (!manifest) {
      return res.status(404).json({ error: 'Manifest not found' });
    }

    const contentType = {
      dash: 'application/dash+xml',
      hls: 'application/vnd.apple.mpegurl',
      smooth: 'application/vnd.ms-sstr+xml'
    };

    res.type(contentType[format] || 'text/plain');
    res.send(manifest);
  } catch (error) {
    logger.error('Manifest retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve manifest' });
  }
});

// Stream encrypted segment
router.get('/drm/stream/:assetId/:quality/segment:segmentNumber.m4s', 
  auth, 
  zeroTrustVerification, 
  async (req, res) => {
    try {
      const { assetId, quality, segmentNumber } = req.params;
      
      // This would fetch the actual video segment
      // For demo, we'll return a placeholder
      const segment = Buffer.from('Video segment data');
      
      // Encrypt segment
      const encrypted = await DRMStreamingService.encryptSegment(
        segment, 
        assetId, 
        parseInt(segmentNumber)
      );
      
      res.type('video/mp4');
      res.send(encrypted);
    } catch (error) {
      logger.error('Segment streaming error:', error);
      res.status(500).json({ error: 'Failed to stream segment' });
    }
});

/**
 * Privacy Analytics Routes
 */

// Query analytics
router.post('/privacy/analytics/query', auth, async (req, res) => {
  try {
    const query = {
      ...req.body,
      userId: req.user.id
    };
    
    const results = await PrivacyAnalyticsService.queryAnalytics(query);
    res.json(results);
  } catch (error) {
    logger.error('Analytics query error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Export user data (GDPR)
router.get('/privacy/export', auth, async (req, res) => {
  try {
    const exportData = await PrivacyAnalyticsService.exportData({
      userId: req.user.id,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    });
    
    res.json(exportData);
  } catch (error) {
    logger.error('Data export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Delete user data (GDPR)
router.delete('/privacy/data', auth, async (req, res) => {
  try {
    const result = await PrivacyAnalyticsService.deleteUserData(req.user.id);
    res.json(result);
  } catch (error) {
    logger.error('Data deletion error:', error);
    res.status(500).json({ error: 'Failed to delete data' });
  }
});

// Get privacy report
router.get('/privacy/report', async (req, res) => {
  try {
    const report = await PrivacyAnalyticsService.getPrivacyReport();
    res.json(report);
  } catch (error) {
    logger.error('Privacy report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Disable tracking
router.post('/privacy/tracking/disable', auth, async (req, res) => {
  try {
    req.session.trackingEnabled = false;
    res.json({ success: true, trackingEnabled: false });
  } catch (error) {
    logger.error('Tracking disable error:', error);
    res.status(500).json({ error: 'Failed to disable tracking' });
  }
});

/**
 * Zero Trust Routes
 */

// Get trust score
router.get('/trust/score', auth, zeroTrustVerification, async (req, res) => {
  res.json({
    trustScore: req.trustScore,
    factors: req.trustFactors
  });
});

// Get trust metrics
router.get('/trust/metrics', auth, async (req, res) => {
  try {
    const ZeroTrustManager = require('../zero-trust/ZeroTrustManager');
    const metrics = await ZeroTrustManager.exportTrustMetrics(req.user.id);
    res.json(metrics);
  } catch (error) {
    logger.error('Trust metrics error:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

/**
 * Anomaly Detection Routes
 */

// Get anomaly metrics
router.get('/anomaly/metrics', auth, async (req, res) => {
  try {
    const AnomalyDetectionService = require('../anomaly/AnomalyDetectionService');
    const metrics = await AnomalyDetectionService.getDetectionMetrics(req.user.id);
    res.json(metrics);
  } catch (error) {
    logger.error('Anomaly metrics error:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Train anomaly models
router.post('/anomaly/train', auth, async (req, res) => {
  try {
    const AnomalyDetectionService = require('../anomaly/AnomalyDetectionService');
    await AnomalyDetectionService.trainModels(req.user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Model training error:', error);
    res.status(500).json({ error: 'Failed to train models' });
  }
});

module.exports = router;