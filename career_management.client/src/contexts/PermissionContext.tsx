import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { userManagementApi, type UserPermission } from '../services/userManagementApi';
import { getCurrentEmployee } from '../utils/auth';

interface PermissionContextType {
  permissions: UserPermission[];
  isSystemAdmin: boolean;
  loading: boolean;
  error: string | null;
  loadPermissions: () => Promise<void>;
  clearPermissions: () => void;
  hasPermission: (moduleCode: string, permissionCode: string) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for auth changes and clear permissions when user logs out
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'isAuthenticated' && event.newValue !== 'true') {
        console.log('🔓 User logged out, clearing permissions');
        clearPermissions();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check if user is still authenticated on mount
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated && permissions.length > 0) {
      console.log('🔓 User not authenticated, clearing permissions');
      clearPermissions();
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [permissions.length]);

  // Load permissions from localStorage on initialization
  useEffect(() => {
    const loadCachedPermissions = () => {
      try {
        const cachedPermissions = localStorage.getItem('userPermissions');
        const cachedIsSystemAdmin = localStorage.getItem('isSystemAdmin');
        const cachedTimestamp = localStorage.getItem('permissionsTimestamp');
        
        if (cachedPermissions && cachedTimestamp) {
          // Check if cache is still valid (24 hours)
          const cacheAge = Date.now() - parseInt(cachedTimestamp);
          const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
          
          if (cacheAge < maxCacheAge) {
            setPermissions(JSON.parse(cachedPermissions));
            setIsSystemAdmin(cachedIsSystemAdmin === 'true');
            console.log('✅ Loaded permissions from cache');
            return true;
          } else {
            // Cache expired, clear it
            clearPermissions();
            console.log('🕒 Permission cache expired, will reload');
          }
        }
        return false;
      } catch (error) {
        console.error('❌ Error loading cached permissions:', error);
        clearPermissions();
        return false;
      }
    };

    loadCachedPermissions();
  }, []);

  const loadPermissions = async (): Promise<void> => {
    if (loading) return; // Prevent multiple simultaneous requests
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading user permissions from API...');
      
      // Get current employee
      const employee = getCurrentEmployee();
      if (!employee?.employeeID) {
        throw new Error('No employee information found');
      }

      // Get user by employee ID
      const user = await userManagementApi.getUserByEmployeeId(employee.employeeID);
      if (!user) {
        throw new Error('User account not found for current employee');
      }

      // Get user permissions
      const userPermissions = await userManagementApi.getUserPermissions(user.userID);
      const systemAdmin = user.isSystemAdmin || false;
      
      setPermissions(userPermissions);
      setIsSystemAdmin(systemAdmin);
      
      // Cache permissions in localStorage
      localStorage.setItem('userPermissions', JSON.stringify(userPermissions));
      localStorage.setItem('isSystemAdmin', systemAdmin.toString());
      localStorage.setItem('permissionsTimestamp', Date.now().toString());
      
      console.log('✅ Permissions loaded and cached successfully');
      console.log(`📊 User has ${userPermissions.length} permissions, isSystemAdmin: ${systemAdmin}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Error loading permissions:', errorMessage);
      setError(errorMessage);
      
      // Clear invalid cache
      clearPermissions();
    } finally {
      setLoading(false);
    }
  };

  const clearPermissions = () => {
    setPermissions([]);
    setIsSystemAdmin(false);
    setError(null);
    localStorage.removeItem('userPermissions');
    localStorage.removeItem('isSystemAdmin');
    localStorage.removeItem('permissionsTimestamp');
    console.log('🧹 Permissions cache cleared');
  };

  const hasPermission = (moduleCode: string, permissionCode: string): boolean => {
    // System admins have all permissions
    if (isSystemAdmin) {
      return true;
    }
    
    // Check if user has the specific permission and it's granted
    return permissions.some(
      permission => 
        permission.moduleCode === moduleCode && 
        permission.permissionCode === permissionCode &&
        permission.isGranted
    );
  };

  const contextValue: PermissionContextType = {
    permissions,
    isSystemAdmin,
    loading,
    error,
    loadPermissions,
    clearPermissions,
    hasPermission
  };

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissionContext = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissionContext must be used within a PermissionProvider');
  }
  return context;
};
