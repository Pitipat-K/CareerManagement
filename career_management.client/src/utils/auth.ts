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
 * Get the user's full name from localStorage
 * @returns The user's full name if available, null otherwise
 */
export const getUserFullName = (): string | null => {
  try {
    const employee = getCurrentEmployee();
    if (employee) {
      return `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || null;
    }

    const oktaUser = getOktaUser();
    if (oktaUser) {
      return oktaUser.name || oktaUser.given_name + ' ' + oktaUser.family_name || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting user full name:', error);
    return null;
  }
};

/**
 * Get the user's first name from localStorage
 * @returns The user's first name if available, null otherwise
 */
export const getUserFirstName = (): string | null => {
  try {
    const employee = getCurrentEmployee();
    if (employee?.firstName) {
      return employee.firstName;
    }

    const oktaUser = getOktaUser();
    if (oktaUser?.given_name) {
      return oktaUser.given_name;
    }

    return null;
  } catch (error) {
    console.error('Error getting user first name:', error);
    return null;
  }
};

/**
 * Get the user's last name from localStorage
 * @returns The user's last name if available, null otherwise
 */
export const getUserLastName = (): string | null => {
  try {
    const employee = getCurrentEmployee();
    if (employee?.lastName) {
      return employee.lastName;
    }

    const oktaUser = getOktaUser();
    if (oktaUser?.family_name) {
      return oktaUser.family_name;
    }

    return null;
  } catch (error) {
    console.error('Error getting user last name:', error);
    return null;
  }
};

/**
 * Get the user's preferred username from localStorage
 * @returns The user's preferred username if available, null otherwise
 */
export const getUserPreferredUsername = (): string | null => {
  try {
    const oktaUser = getOktaUser();
    if (oktaUser?.preferred_username) {
      return oktaUser.preferred_username;
    }

    return getUserEmail();
  } catch (error) {
    console.error('Error getting user preferred username:', error);
    return null;
  }
};

/**
 * Get the user's profile URL from Okta
 * @returns The user's profile URL if available, null otherwise
 */
export const getUserProfileUrl = (): string | null => {
  try {
    const oktaUser = getOktaUser();
    if (oktaUser?.profile) {
      return oktaUser.profile;
    }

    return null;
  } catch (error) {
    console.error('Error getting user profile URL:', error);
    return null;
  }
};

/**
 * Get the user's profile picture URL from Okta
 * @returns The user's profile picture URL if available, null otherwise
 */
export const getUserProfilePicture = (): string | null => {
  try {
    const oktaUser = getOktaUser();
    if (oktaUser?.picture) {
      return oktaUser.picture;
    }

    return null;
  } catch (error) {
    console.error('Error getting user profile picture:', error);
    return null;
  }
};

/**
 * Get a specific profile claim from the Okta user object
 * @param claimName - The name of the claim to retrieve
 * @returns The claim value if available, null otherwise
 */
export const getProfileClaim = (claimName: string): string | number | boolean | null => {
  try {
    const oktaUser = getOktaUser();
    if (oktaUser && claimName in oktaUser) {
      return oktaUser[claimName];
    }

    return null;
  } catch (error) {
    console.error(`Error getting profile claim ${claimName}:`, error);
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
  // Clear permission cache
  localStorage.removeItem('userPermissions');
  localStorage.removeItem('isSystemAdmin');
  localStorage.removeItem('permissionsTimestamp');
  // Clear Okta token storage
  localStorage.removeItem('okta-token-storage');
  localStorage.removeItem('okta-cache-storage');
};

/**
 * Handle token renewal errors gracefully
 * @param oktaAuth - The Okta Auth instance
 * @param error - The error that occurred during token renewal
 */
export const handleTokenRenewalError = async (oktaAuth: any, error: any): Promise<void> => {
  console.error('Token renewal error:', error);
  
  // If there are no existing tokens, clear auth data and redirect to login
  if (error.message?.includes('no existing token') || error.name === 'AuthSdkError') {
    console.log('No existing tokens found, clearing auth data and redirecting to login');
    clearAuthData();
    
    try {
      // Clear Okta token storage
      await oktaAuth.tokenManager.clear();
      // Sign out from Okta
      await oktaAuth.signOut({ clearTokensAfterRedirect: false });
    } catch (signOutError) {
      console.error('Error during sign out:', signOutError);
    }
    
    // Redirect to login
    window.location.href = '/login';
  }
};

/**
 * Setup token renewal error handling for Okta Auth
 * @param oktaAuth - The Okta Auth instance
 */
export const setupTokenRenewalErrorHandling = (oktaAuth: any): void => {
  // Handle token renewal errors
  oktaAuth.tokenManager.on('error', (error: any) => {
    console.error('Token manager error:', error);
    handleTokenRenewalError(oktaAuth, error);
  });

  // Handle expired tokens
  oktaAuth.tokenManager.on('expired', async (key: string, expiredToken: any) => {
    console.log(`Token expired: ${key}`, expiredToken);
    try {
      // Try to renew the token
      await oktaAuth.tokenManager.renew(key);
    } catch (renewError) {
      console.error(`Failed to renew ${key} token:`, renewError);
      handleTokenRenewalError(oktaAuth, renewError);
    }
  });
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
