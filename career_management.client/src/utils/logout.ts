import { OktaAuth } from '@okta/okta-auth-js';
import { clearAuthData } from './auth';

/**
 * Centralized logout function
 * Clears all auth data, permissions cache, and signs out from Okta
 * 
 * @param oktaAuth - The Okta Auth instance
 * @param clearPermissions - Function to clear permission context (optional)
 */
export const performLogout = async (
  oktaAuth: OktaAuth,
  clearPermissions?: () => void
): Promise<void> => {
  console.log('🚪 User logging out...');
  
  // Clear permission cache from context if provided
  if (clearPermissions) {
    clearPermissions();
    console.log('✅ Permission cache cleared from context');
  }
  
  // Clear all auth data from localStorage FIRST
  // This prevents any race conditions where components try to reload permissions
  clearAuthData();
  console.log('✅ Auth data cleared from localStorage');
  
  // Try to sign out from Okta first (before redirect)
  // We do this silently and don't block on it
  oktaAuth.signOut().catch(() => {
    // Silently ignore Okta signout errors (CORS, network issues, etc.)
    // The local auth data is already cleared, which is what matters
  });
  
  // Use window.location.href for IMMEDIATE redirect (bypasses React Router)
  // This prevents components on the current page from trying to re-render with cleared auth data
  console.log('✅ Redirecting to login page...');
  window.location.href = '/login';
};

/**
 * Simple logout without permission context
 * Use this when PermissionContext is not available
 */
export const simpleLogout = async (
  oktaAuth: OktaAuth
): Promise<void> => {
  return performLogout(oktaAuth, undefined);
};

