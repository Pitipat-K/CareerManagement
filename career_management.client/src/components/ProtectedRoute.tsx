import type { ReactNode } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { usePermissionContext } from '../contexts/PermissionContext';
import { getCurrentEmployee } from '../utils/auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { authState } = useOktaAuth();
  const { permissions, loading: permissionsLoading, loadPermissions, error } = usePermissionContext();
  
  // Check both Okta auth state and our localStorage flag
  const isAuthenticated = authState?.isAuthenticated || localStorage.getItem('isAuthenticated') === 'true';

  // Load permissions when user is authenticated and permissions are not loaded
  useEffect(() => {
    if (isAuthenticated && permissions.length === 0 && !permissionsLoading && !error) {
      console.log('🔐 User authenticated, loading permissions...');
      loadPermissions().catch((err) => {
        console.error('Failed to load permissions:', err);
        // If permission loading fails, it might mean user is not properly authenticated
        // The error state will be set by loadPermissions
      });
    }
  }, [isAuthenticated, permissions.length, permissionsLoading, error, loadPermissions]);

  // Show loading while auth state is being determined
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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If there's an error loading permissions and no employee data, redirect to login
  // This handles the case where user logged out but the component tried to load permissions
  if (error && !getCurrentEmployee()) {
    console.warn('⚠️ Permission loading error with no employee data, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Show loading while permissions are being loaded (only on first load)
  if (permissionsLoading && permissions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
