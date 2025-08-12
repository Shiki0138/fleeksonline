# 🔐 Fleeks Enterprise Security System

## Overview

The Fleeks Security System implements enterprise-grade security with seamless user experience, featuring Zero Trust Architecture, passwordless authentication, AI-powered anomaly detection, DRM-protected streaming, and privacy-preserving analytics.

## 🛡️ Security Features

### 1. Zero Trust Architecture

**Never trust, always verify** - Every request is continuously validated based on multiple factors.

#### Key Components:
- **Trust Score Calculation**: Dynamic scoring based on location, device, behavior, and authentication method
- **Micro-segmented Tokens**: Short-lived tokens with specific resource permissions
- **Continuous Verification**: Real-time trust validation during sessions
- **Adaptive Access Control**: Permissions adjust based on trust level

#### Trust Factors:
- **Location** (20%): IP geolocation, VPN/TOR detection, known locations
- **Device** (20%): Device fingerprinting, health status, registration
- **Behavior** (30%): Access patterns, typing speed, resource usage
- **Authentication** (30%): Method strength (biometric > WebAuthn > password)

### 2. WebAuthn/Passwordless Authentication

**FIDO2/WebAuthn** implementation for passwordless, phishing-resistant authentication.

#### Features:
- **Multi-device Support**: Security keys, platform authenticators, mobile devices
- **Usernameless Flow**: Login without entering username
- **Credential Management**: Add, remove, rename credentials
- **Backup Eligibility**: Cloud-synced passkeys support

#### API Endpoints:
```javascript
POST /api/security/webauthn/register     // Register new credential
POST /api/security/webauthn/authenticate // Authenticate with credential
GET  /api/security/webauthn/credentials   // List user credentials
DELETE /api/security/webauthn/credentials/:id // Remove credential
```

### 3. Biometric Authentication

**Multi-modal biometric support** with advanced anti-spoofing protection.

#### Supported Biometrics:
- **Face Recognition** (95% threshold)
- **Fingerprint** (99% threshold)
- **Voice Recognition** (90% threshold)
- **Iris Scan** (99.9% threshold)
- **Palm Print** (98% threshold)

#### Security Features:
- **Anti-spoofing**: Liveness detection, quality assessment, temporal consistency
- **Template Encryption**: AES-256-GCM encryption for biometric templates
- **Backup Codes**: Recovery codes for biometric failure
- **Privacy Protection**: Templates stored with cryptographic hashing

### 4. AI-Powered Anomaly Detection

**Machine learning models** detect unusual behavior patterns in real-time.

#### Detection Methods:
- **LSTM Networks**: Sequential behavior analysis
- **Autoencoders**: Anomaly detection through reconstruction error
- **Statistical Analysis**: Z-score based outlier detection
- **Pattern Matching**: Neural network pattern recognition

#### Monitored Behaviors:
- Login times and locations
- API usage patterns
- Click and scroll patterns
- Session duration
- Error rates
- Resource access patterns

#### Response Actions:
- Require additional authentication
- Apply stricter rate limiting
- Trigger security alerts
- Block suspicious activities

### 5. DRM-Protected Video Streaming

**Multi-DRM support** for secure video content delivery.

#### Supported DRM Systems:
- **Widevine** (Google)
- **PlayReady** (Microsoft)
- **FairPlay** (Apple)

#### Features:
- **Adaptive Streaming**: DASH, HLS, Smooth Streaming
- **License Management**: Dynamic license generation
- **Device Limits**: Concurrent stream control
- **Geo-restrictions**: Location-based access control
- **HDCP Enforcement**: Output protection

#### Content Protection:
```javascript
// Initialize DRM for an asset
POST /api/security/drm/initialize
{
  "assetId": "video-123",
  "drmSystems": ["widevine", "playready"],
  "quality": ["1080p", "720p", "480p"]
}

// Request playback license
POST /api/security/drm/license/:assetId
{
  "system": "widevine",
  "keyId": "...",
  "signature": "..."
}
```

### 6. Privacy-Preserving Analytics

**GDPR/CCPA compliant** analytics with mathematical privacy guarantees.

#### Privacy Techniques:
- **Differential Privacy**: ε-differential privacy with Laplace noise
- **K-Anonymity**: Minimum group size enforcement
- **Data Minimization**: Only essential fields collected
- **Automatic Anonymization**: Cryptographic user ID hashing

#### Features:
- **Privacy Budget**: Track and limit data exposure
- **Aggregate Queries**: No individual-level data access
- **Right to Erasure**: GDPR-compliant data deletion
- **Export Controls**: Privacy-safe data exports

## 🚀 Quick Start

### 1. Installation

```bash
# Install dependencies
npm install

# Copy security environment file
cp .env.security.example .env

# Configure security settings in .env
```

### 2. Basic Setup

```javascript
// Import security module
const security = require('./src/security');

// Apply security middleware
app.use(security.middleware.securityHeaders);
app.use(security.middleware.zeroTrustVerification);
app.use(security.middleware.anomalyDetection);
app.use(security.middleware.privacyTracking);

// Mount security routes
app.use('/api/security', security.routes);
```

### 3. WebAuthn Registration Flow

```javascript
// 1. Generate registration options
const options = await fetch('/api/security/webauthn/register', {
  method: 'POST',
  body: JSON.stringify({ action: 'generate-options' })
});

// 2. Create credential on device
const credential = await navigator.credentials.create(options);

// 3. Verify registration
const result = await fetch('/api/security/webauthn/register', {
  method: 'POST',
  body: JSON.stringify({
    action: 'verify-registration',
    credential,
    challengeId: options.challengeId
  })
});
```

## 🔧 Configuration

### Environment Variables

Key security environment variables:

```bash
# Zero Trust
ZERO_TRUST_THRESHOLD=0.7              # Minimum trust score (0-1)

# WebAuthn
WEBAUTHN_RP_NAME="Your App Name"      # Relying party name
WEBAUTHN_RP_ID=localhost              # Domain for WebAuthn
WEBAUTHN_ORIGIN=https://localhost:3000 # Origin URL

# Privacy
PRIVACY_EPSILON=1.0                   # Differential privacy parameter
PRIVACY_K_ANONYMITY=5                 # Minimum group size

# Anomaly Detection
ANOMALY_DETECTION_THRESHOLD=0.85      # Detection sensitivity (0-1)
```

### Security Headers

Automatically applied headers:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

## 📊 Monitoring & Metrics

### Trust Score Metrics

```javascript
GET /api/security/trust/metrics

{
  "totalDecisions": 1000,
  "deniedCount": 23,
  "averageTrustScore": 0.82,
  "factorAnalysis": {
    "location": { "average": 0.91 },
    "device": { "average": 0.88 },
    "behavior": { "average": 0.76 },
    "authentication": { "average": 0.93 }
  }
}
```

### Anomaly Detection Metrics

```javascript
GET /api/security/anomaly/metrics

{
  "totalDetections": 500,
  "anomalyCount": 12,
  "averageRiskScore": 0.23,
  "anomalyTypes": {
    "unusual_login_time": 4,
    "new_location": 3,
    "excessive_activity": 5
  }
}
```

### Privacy Report

```javascript
GET /api/security/privacy/report

{
  "configuration": {
    "epsilon": 1.0,
    "kAnonymityThreshold": 5,
    "retentionPeriod": "90 days"
  },
  "compliance": {
    "gdpr": true,
    "ccpa": true,
    "differentialPrivacy": true
  }
}
```

## 🛠️ Advanced Usage

### Custom Trust Score Calculation

```javascript
// Extend ZeroTrustManager
const customTrustCalculation = async (context) => {
  const baseScore = await ZeroTrustManager.calculateTrustScore(context);
  
  // Add custom factors
  if (context.customFactor) {
    baseScore.trustScore *= context.customFactor;
  }
  
  return baseScore;
};
```

### Biometric Enrollment with Custom Options

```javascript
const enrollmentResult = await BiometricAuthService.enrollBiometric(
  userId,
  'face',
  {
    template: faceData,
    quality: 0.95,
    antiSpoofingLevel: 'high',
    deviceInfo: {
      model: 'iPhone 15',
      os: 'iOS 17'
    }
  }
);
```

### DRM License Customization

```javascript
// Custom license restrictions
const licenseResponse = await DRMStreamingService.requestLicense(
  assetId,
  'widevine',
  {
    ...licenseRequest,
    customRestrictions: {
      maxResolution: '1080p',
      offlinePlayback: false,
      hdcpVersion: '2.2'
    }
  }
);
```

## 🔒 Security Best Practices

1. **Environment Security**
   - Use strong, unique secrets for all keys
   - Rotate secrets regularly
   - Never commit secrets to version control

2. **WebAuthn Implementation**
   - Always verify origin and RP ID
   - Implement proper challenge handling
   - Support multiple credentials per user

3. **Biometric Security**
   - Enforce anti-spoofing checks
   - Encrypt templates at rest
   - Provide alternative authentication methods

4. **Zero Trust Principles**
   - Verify every request
   - Use short-lived tokens
   - Implement least privilege access
   - Monitor and log all activities

5. **Privacy Compliance**
   - Minimize data collection
   - Implement data retention policies
   - Provide user data controls
   - Regular privacy audits

## 🚨 Incident Response

### Security Alert Handling

When anomalies are detected:

1. **Automatic Actions**:
   - Additional authentication required
   - Rate limiting applied
   - Session terminated if severe

2. **Manual Review**:
   - Check anomaly detection logs
   - Review trust score factors
   - Investigate behavior patterns

3. **User Communication**:
   - Notify user of suspicious activity
   - Provide secure recovery options
   - Document incident

## 📚 API Reference

Complete API documentation for all security endpoints:

### Authentication
- `POST /api/security/webauthn/register` - Register WebAuthn credential
- `POST /api/security/webauthn/authenticate` - Authenticate with WebAuthn
- `POST /api/security/biometric` - Biometric enrollment/verification

### Trust & Security
- `GET /api/security/trust/score` - Get current trust score
- `GET /api/security/trust/metrics` - Trust system metrics
- `GET /api/security/anomaly/metrics` - Anomaly detection metrics

### DRM
- `POST /api/security/drm/initialize` - Initialize DRM for asset
- `POST /api/security/drm/license/:assetId` - Request playback license
- `GET /api/security/drm/manifest/:assetId/:format` - Get streaming manifest

### Privacy
- `POST /api/security/privacy/analytics/query` - Query analytics
- `GET /api/security/privacy/export` - Export user data
- `DELETE /api/security/privacy/data` - Delete user data
- `GET /api/security/privacy/report` - Privacy compliance report

## 🤝 Contributing

When contributing to security features:

1. Follow OWASP guidelines
2. Add comprehensive tests
3. Document security implications
4. Request security review

## 📞 Support

For security concerns:
- Email: security@fleeks.com
- Bug Bounty: https://fleeks.com/security/bug-bounty

## 📄 License

This security system is part of the Fleeks platform and subject to the platform's licensing terms.