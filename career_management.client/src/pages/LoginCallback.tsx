import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOktaAuth } from '@okta/okta-react';
import { getApiUrl } from '../config/api';
import { userManagementApi } from '../services/userManagementApi';

const LoginCallback = () => {
  const { oktaAuth, authState } = useOktaAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  // Helper function to find employee by email and verify user account exists
  const findEmployeeByEmail = async (email: string): Promise<boolean> => {
    try {
      console.log('Searching for employee with email:', email);
      
      const response = await fetch(getApiUrl('Employees'));
      if (response.ok) {
        const employees = await response.json();
        console.log('Total employees found:', employees.length);
        
        // Try to match by email (case-insensitive)
        const employee = employees.find((emp: any) => {
          const empEmail = emp.email?.toLowerCase()?.trim();
          const searchEmail = email?.toLowerCase()?.trim();
          return empEmail && searchEmail && empEmail === searchEmail;
        });

        if (employee) {
          console.log('✅ Employee found:', employee);
          
          // Now check if a User account exists for this employee
          try {
            console.log('Checking if User account exists for employee ID:', employee.employeeID);
            const user = await userManagementApi.getUserByEmployeeId(employee.employeeID);
            
            if (user) {
              console.log('✅ User account found:', user);
              localStorage.setItem('currentEmployee', JSON.stringify(employee));
              localStorage.setItem('isAuthenticated', 'true');
              return true;
            } else {
              console.log('❌ User account not found for employee');
              return false;
            }
          } catch (userError: any) {
            console.log('❌ User account not found for employee:', userError.response?.status);
            // If 404, user doesn't exist; clear any stored data
            if (userError.response?.status === 404) {
              console.log('User account does not exist in the system');
            }
            return false;
          }
        } else {
          console.log('❌ Employee not found with email:', email);
          return false;
        }
      } else {
        console.error('Failed to fetch employees:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error finding employee:', error);
      return false;
    }
  };

  useEffect(() => {
    const handleAuthentication = async () => {
      try {
        console.log('=== AUTHENTICATION PROCESS START ===');
        console.log('Current authState:', authState);
        console.log('AuthState isAuthenticated:', authState?.isAuthenticated);
        console.log('AuthState error:', authState?.error);
        
        // Check if we have an authorization code in the URL
        if (window.location.search.includes('code=') || window.location.search.includes('error=')) {
          console.log('OAuth callback detected, handling with Okta SDK...');
          
          try {
            // Let Okta SDK handle the callback and wait for completion
            const result = await oktaAuth.handleLoginRedirect();
            console.log('Okta SDK handleLoginRedirect completed:', result);
            
            // Force a refresh of the auth state after handling redirect
            await oktaAuth.authStateManager.updateAuthState();
            console.log('Auth state updated after redirect');
            
            // Give the SDK a moment to update internal state
            setTimeout(() => {
              window.location.reload();
            }, 100);
            return;
          } catch (error) {
            console.error('Error handling login redirect:', error);
            setError('Failed to process authentication callback');
            navigate('/login?error=callback_failed');
            return;
          }
        }
        
        // Wait for auth state to be available
        if (!authState) {
          console.log('Auth state not available yet...');
          return;
        }

        // Debug token manager state
        const tokenManager = oktaAuth.tokenManager;
        const tokens = await tokenManager.getTokensSync();
        console.log('Token manager tokens:', tokens);
        
        if (authState.isAuthenticated && authState.idToken) {
          console.log('✅ User authenticated via Okta SDK');
          console.log('ID Token:', authState.idToken);
          console.log('Access Token:', authState.accessToken);
          
          // Get user info from the ID token
          const userInfo = authState.idToken.claims;
          console.log('User info from token:', userInfo);
          
          // Store user info
          localStorage.setItem('oktaUser', JSON.stringify(userInfo));
          
          // Extract email
          const email = userInfo.email || userInfo.preferred_username;
          if (email) {
            localStorage.setItem('userEmail', email);
            console.log('User email extracted:', email);
            
            // Find employee by email and verify user account exists
            const employeeFound = await findEmployeeByEmail(email);
            if (employeeFound) {
              console.log('✅ Authentication successful, redirecting to home');
              localStorage.setItem('isAuthenticated', 'true');
              navigate('/home');
            } else {
              console.log('❌ Employee or User account not found, signing out and redirecting to login');
              // Sign out from Okta since user doesn't have access
              await oktaAuth.signOut();
              // Clear any partial auth data
              localStorage.removeItem('oktaUser');
              localStorage.removeItem('userEmail');
              localStorage.removeItem('isAuthenticated');
              navigate('/login?error=no_user_account');
            }
          } else {
            console.log('❌ No email found in user info, redirecting to login');
            navigate('/login?error=no_email_found');
          }
        } else if (authState.error) {
          console.error('Authentication error:', authState.error);
          setError('Authentication failed');
          navigate('/login?error=auth_failed');
        } else {
          console.log('User not authenticated, redirecting to login');
          console.log('AuthState details:', {
            isAuthenticated: authState.isAuthenticated,
            isPending: authState.isPending,
            idToken: !!authState.idToken,
            accessToken: !!authState.accessToken,
            error: authState.error
          });
          navigate('/login');
        }
      } catch (error) {
        console.error('Error in authentication process:', error);
        setError('Authentication process failed');
        navigate('/login?error=process_failed');
      }
    };

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('Authentication timeout');
      setError('Authentication timeout');
      navigate('/login?error=timeout');
    }, 30000); // 30 seconds timeout

    handleAuthentication();

    return () => clearTimeout(timeout);
  }, [authState, oktaAuth, navigate]);


  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-lg font-semibold">Authentication Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (!authState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Authenticating...</p>
      </div>
    </div>
  );
};

export default LoginCallback;
