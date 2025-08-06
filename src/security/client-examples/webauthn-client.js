/**
 * WebAuthn Client Implementation Example
 * For use in frontend applications
 */

class WebAuthnClient {
  constructor(apiBaseUrl = '/api/security') {
    this.apiBaseUrl = apiBaseUrl;
    this.isWebAuthnAvailable = this.checkWebAuthnSupport();
  }

  /**
   * Check if WebAuthn is supported
   */
  checkWebAuthnSupport() {
    return !!(navigator.credentials && navigator.credentials.create);
  }

  /**
   * Register a new WebAuthn credential
   */
  async register(authenticatorType = 'cross-platform') {
    if (!this.isWebAuthnAvailable) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    try {
      // Step 1: Get registration options from server
      const optionsResponse = await fetch(`${this.apiBaseUrl}/webauthn/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'generate-options',
          authenticatorType
        })
      });

      if (!optionsResponse.ok) {
        throw new Error('Failed to get registration options');
      }

      const { options, challengeId } = await optionsResponse.json();

      // Step 2: Convert server options to WebAuthn format
      const publicKeyCredentialCreationOptions = {
        ...options,
        challenge: this.base64ToArrayBuffer(options.challenge),
        user: {
          ...options.user,
          id: this.base64ToArrayBuffer(options.user.id)
        },
        excludeCredentials: options.excludeCredentials?.map(cred => ({
          ...cred,
          id: this.base64ToArrayBuffer(cred.id)
        }))
      };

      // Step 3: Create credential
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      // Step 4: Send credential to server for verification
      const verificationResponse = await fetch(`${this.apiBaseUrl}/webauthn/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'verify-registration',
          challengeId,
          credential: {
            id: credential.id,
            rawId: this.arrayBufferToBase64(credential.rawId),
            type: credential.type,
            response: {
              attestationObject: this.arrayBufferToBase64(credential.response.attestationObject),
              clientDataJSON: this.arrayBufferToBase64(credential.response.clientDataJSON),
              transports: credential.response.getTransports?.() || ['usb', 'ble', 'nfc', 'internal']
            }
          },
          deviceName: this.getDeviceName()
        })
      });

      if (!verificationResponse.ok) {
        throw new Error('Failed to verify registration');
      }

      const result = await verificationResponse.json();
      return result;

    } catch (error) {
      console.error('WebAuthn registration error:', error);
      throw error;
    }
  }

  /**
   * Authenticate with WebAuthn
   */
  async authenticate(userId = null) {
    if (!this.isWebAuthnAvailable) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    try {
      // Step 1: Get authentication options
      const optionsResponse = await fetch(`${this.apiBaseUrl}/webauthn/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'generate-options',
          userId // Optional for usernameless flow
        })
      });

      if (!optionsResponse.ok) {
        throw new Error('Failed to get authentication options');
      }

      const { options, challengeId } = await optionsResponse.json();

      // Step 2: Convert server options to WebAuthn format
      const publicKeyCredentialRequestOptions = {
        ...options,
        challenge: this.base64ToArrayBuffer(options.challenge),
        allowCredentials: options.allowCredentials?.map(cred => ({
          ...cred,
          id: this.base64ToArrayBuffer(cred.id)
        }))
      };

      // Step 3: Get credential
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      if (!assertion) {
        throw new Error('Failed to get credential');
      }

      // Step 4: Send assertion to server for verification
      const verificationResponse = await fetch(`${this.apiBaseUrl}/webauthn/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'verify-authentication',
          challengeId,
          credential: {
            id: assertion.id,
            rawId: this.arrayBufferToBase64(assertion.rawId),
            type: assertion.type,
            response: {
              authenticatorData: this.arrayBufferToBase64(assertion.response.authenticatorData),
              clientDataJSON: this.arrayBufferToBase64(assertion.response.clientDataJSON),
              signature: this.arrayBufferToBase64(assertion.response.signature),
              userHandle: assertion.response.userHandle ? 
                this.arrayBufferToBase64(assertion.response.userHandle) : null
            }
          }
        })
      });

      if (!verificationResponse.ok) {
        throw new Error('Failed to verify authentication');
      }

      const result = await verificationResponse.json();
      return result;

    } catch (error) {
      console.error('WebAuthn authentication error:', error);
      throw error;
    }
  }

  /**
   * List user's WebAuthn credentials
   */
  async listCredentials() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/webauthn/credentials`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to list credentials');
      }

      const { credentials } = await response.json();
      return credentials;
    } catch (error) {
      console.error('Error listing credentials:', error);
      throw error;
    }
  }

  /**
   * Remove a WebAuthn credential
   */
  async removeCredential(credentialId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/webauthn/credentials/${credentialId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to remove credential');
      }

      return await response.json();
    } catch (error) {
      console.error('Error removing credential:', error);
      throw error;
    }
  }

  /**
   * Rename a WebAuthn credential
   */
  async renameCredential(credentialId, newName) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/webauthn/credentials/${credentialId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: newName })
      });

      if (!response.ok) {
        throw new Error('Failed to rename credential');
      }

      return await response.json();
    } catch (error) {
      console.error('Error renaming credential:', error);
      throw error;
    }
  }

  /**
   * Enable passwordless authentication
   */
  async enablePasswordless() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/webauthn/passwordless`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to enable passwordless');
      }

      return await response.json();
    } catch (error) {
      console.error('Error enabling passwordless:', error);
      throw error;
    }
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Convert ArrayBuffer to base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Get device name for credential
   */
  getDeviceName() {
    const userAgent = navigator.userAgent;
    let deviceName = 'Unknown Device';

    if (/iPhone/.test(userAgent)) {
      deviceName = 'iPhone';
    } else if (/iPad/.test(userAgent)) {
      deviceName = 'iPad';
    } else if (/Android/.test(userAgent)) {
      deviceName = 'Android Device';
    } else if (/Macintosh/.test(userAgent)) {
      deviceName = 'Mac';
    } else if (/Windows/.test(userAgent)) {
      deviceName = 'Windows PC';
    } else if (/Linux/.test(userAgent)) {
      deviceName = 'Linux Device';
    }

    // Add browser info
    if (/Chrome/.test(userAgent) && !/Edg/.test(userAgent)) {
      deviceName += ' (Chrome)';
    } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
      deviceName += ' (Safari)';
    } else if (/Firefox/.test(userAgent)) {
      deviceName += ' (Firefox)';
    } else if (/Edg/.test(userAgent)) {
      deviceName += ' (Edge)';
    }

    return deviceName;
  }

  /**
   * Check if platform authenticator is available
   */
  async isPlatformAuthenticatorAvailable() {
    if (!this.isWebAuthnAvailable) {
      return false;
    }

    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if conditional mediation is available (for autofill UI)
   */
  async isConditionalMediationAvailable() {
    if (!this.isWebAuthnAvailable) {
      return false;
    }

    try {
      return await PublicKeyCredential.isConditionalMediationAvailable?.();
    } catch (error) {
      return false;
    }
  }
}

// Usage Example
/*
const webauthn = new WebAuthnClient();

// Check support
if (webauthn.isWebAuthnAvailable) {
  // Register new credential
  try {
    const registration = await webauthn.register('platform'); // or 'cross-platform'
    console.log('Registration successful:', registration);
  } catch (error) {
    console.error('Registration failed:', error);
  }

  // Authenticate
  try {
    const authentication = await webauthn.authenticate();
    console.log('Authentication successful:', authentication);
  } catch (error) {
    console.error('Authentication failed:', error);
  }

  // List credentials
  const credentials = await webauthn.listCredentials();
  console.log('User credentials:', credentials);
}
*/

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebAuthnClient;
}