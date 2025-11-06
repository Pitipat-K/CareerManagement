import { OktaAuth } from '@okta/okta-auth-js';
import { setupTokenRenewalErrorHandling } from '../utils/auth';

const scopes = (import.meta.env.VITE_OKTA_SCOPES || 'openid,profile,email').split(',');

const oktaAuth = new OktaAuth({
  issuer: import.meta.env.VITE_OKTA_ISSUER || 'https://login.alliancels.com',
  clientId: import.meta.env.VITE_OKTA_CLIENT_ID || '0oat9b6xpeJfxVXYO4x7',
  redirectUri: import.meta.env.VITE_OKTA_REDIRECT_URI || 'https://localhost:52930/login/callback',
  scopes: scopes,
  responseType: ['code'],
  pkce: true, // Enable PKCE for SPA security
  devMode: true, // Add dev mode for better debugging
  tokenManager: {
    autoRenew: true,
    autoRemove: true,
    secure: true,
    storage: 'localStorage',
    storageKey: 'okta-token-storage',
    expireEarlySeconds: 300, // Renew tokens 5 minutes before expiry
  },
  services: {
    autoRenew: true,
    autoRemove: true,
  }
});

// Setup token renewal error handling
setupTokenRenewalErrorHandling(oktaAuth);

export default oktaAuth;
