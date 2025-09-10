/**
 * Authentication utility functions for localStorage operations
 */

/**
 * Get the user email from localStorage
 * @returns The user email if available, null otherwise
 */
export const getUserEmail = (): string | null => {
  try {
    // First try to get from the dedicated userEmail key
    const email = localStorage.getItem('userEmail');
    if (email) {
      return email;
    }

    // Fallback: try to get from oktaUser object
    const oktaUser = localStorage.getItem('oktaUser');
    if (oktaUser) {
      const userData = JSON.parse(oktaUser);
      // Try different email properties that Okta might use
      return userData.email || userData.preferred_username || userData.sub || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting user email from localStorage:', error);
    return null;
  }
};

/**
 * Get the full Okta user object from localStorage
 * @returns The Okta user object if available, null otherwise
 */
export const getOktaUser = (): any | null => {
  try {
    const oktaUser = localStorage.getItem('oktaUser');
    return oktaUser ? JSON.parse(oktaUser) : null;
  } catch (error) {
    console.error('Error getting Okta user from localStorage:', error);
    return null;
  }
};

/**
 * Get the current employee object from localStorage
 * @returns The current employee object if available, null otherwise
 */
export const getCurrentEmployee = (): any | null => {
  try {
    const currentEmployee = localStorage.getItem('currentEmployee');
    return currentEmployee ? JSON.parse(currentEmployee) : null;
  } catch (error) {
    console.error('Error getting current employee from localStorage:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns true if user is authenticated, false otherwise
 */
export const isAuthenticated = (): boolean => {
  return localStorage.getItem('isAuthenticated') === 'true';
};

/**
 * Clear all authentication-related data from localStorage
 */
export const clearAuthData = (): void => {
  localStorage.removeItem('userEmail');
  localStorage.removeItem('oktaUser');
  localStorage.removeItem('currentEmployee');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('oktaAuthCode');
};

/**
 * Debug function to log all authentication-related localStorage data
 */
export const debugAuthData = (): void => {
  console.log('=== LOCALSTORAGE AUTH DEBUG ===');
  console.log('userEmail:', localStorage.getItem('userEmail'));
  console.log('oktaUser:', localStorage.getItem('oktaUser'));
  console.log('currentEmployee:', localStorage.getItem('currentEmployee'));
  console.log('isAuthenticated:', localStorage.getItem('isAuthenticated'));
  console.log('oktaAuthCode:', localStorage.getItem('oktaAuthCode'));
  
  // Try to parse JSON data
  try {
    const oktaUser = localStorage.getItem('oktaUser');
    if (oktaUser) {
      console.log('Parsed oktaUser:', JSON.parse(oktaUser));
    }
  } catch (error) {
    console.error('Error parsing oktaUser:', error);
  }
  
  try {
    const currentEmployee = localStorage.getItem('currentEmployee');
    if (currentEmployee) {
      console.log('Parsed currentEmployee:', JSON.parse(currentEmployee));
    }
  } catch (error) {
    console.error('Error parsing currentEmployee:', error);
  }
  
  console.log('================================');
};
