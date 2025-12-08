import axios from 'axios';
import { getApiUrl } from '../config/api';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.DEV
    ? 'https://localhost:7026/api'
    : 'https://altapi.alliancels.net:44304/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to headers
axiosInstance.interceptors.request.use(
  (config: any) => {
    // Try to get custom JWT token first (from email/password login)
    let token = localStorage.getItem('jwtToken');
    
    // If no custom token, try to get Okta token
    if (!token) {
      const oktaTokenStorage = localStorage.getItem('okta-token-storage');
      if (oktaTokenStorage) {
        try {
          const tokenData = JSON.parse(oktaTokenStorage);
          console.log('🔑 Okta token data found:', { 
            hasAccessToken: !!tokenData.accessToken, 
            hasIdToken: !!tokenData.idToken 
          });
          
          // Get the access token from Okta token storage
          if (tokenData.accessToken && tokenData.accessToken.accessToken) {
            token = tokenData.accessToken.accessToken;
            console.log('✅ Using Okta access token');
          }
          // Alternatively, try idToken
          else if (tokenData.idToken && tokenData.idToken.idToken) {
            token = tokenData.idToken.idToken;
            console.log('✅ Using Okta ID token');
          } else {
            console.warn('⚠️ Okta tokens exist but could not extract accessToken or idToken');
          }
        } catch (e) {
          console.error('❌ Error parsing Okta token storage:', e);
        }
      } else {
        console.log('ℹ️ No Okta token storage found');
      }
    } else {
      console.log('✅ Using custom JWT token');
    }
    
    // Add token to Authorization header if available
    if (token) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('🔐 Authorization header added to request:', config.url);
    } else {
      console.warn('⚠️ No authentication token available for request:', config.url);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: any) => {
    if (error.response) {
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        console.error('Authentication failed - token may be invalid or expired');
        
        // Don't clear auth data if we're in the middle of Okta callback
        // (user is still authenticating)
        const isOktaCallback = window.location.pathname.includes('/login/callback') || 
                               window.location.search.includes('code=');
        
        if (!isOktaCallback) {
          // Clear authentication data
          localStorage.removeItem('jwtToken');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('currentEmployee');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('oktaUser');
          localStorage.removeItem('okta-token-storage');
          
          // Redirect to login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?error=session_expired';
          }
        } else {
          console.log('401 during Okta callback - authentication in progress');
        }
      }
      
      // Handle 403 Forbidden
      if (error.response.status === 403) {
        console.error('Access forbidden - insufficient permissions');
        // You can show a toast/notification here
        // For now, we'll just log it
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to create a configured axios instance with base URL
export const createApiClient = () => axiosInstance;

// Export the instance as default
export default axiosInstance;

// Helper function to get API URL (for backward compatibility)
export { getApiUrl };

