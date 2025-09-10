import { OktaAuth } from '@okta/okta-auth-js';

const scopes = (import.meta.env.VITE_OKTA_SCOPES || 'openid,profile,email').split(',');

const oktaAuth = new OktaAuth({
  issuer: import.meta.env.VITE_OKTA_ISSUER || 'https://login.alliancels.com',
  clientId: import.meta.env.VITE_OKTA_CLIENT_ID || '0oat9b6xpeJfxVXYO4x7',
  redirectUri: import.meta.env.VITE_OKTA_REDIRECT_URI || 'https://localhost:52930/login/callback',
  scopes: scopes,
  responseType: ['code'],
  pkce: true, // Enable PKCE for SPA security
  devMode: true // Add dev mode for better debugging
});

export default oktaAuth;
