import React, { useState, useEffect } from 'react';
import { usePermissionContext } from '../contexts/PermissionContext';
import type { UserPermission } from '../services/userManagementApi';
import { userManagementApi } from '../services/userManagementApi';
import { getCurrentEmployee } from '../utils/auth';

interface UsePermissionsReturn {
  permissions: UserPermission[];
  hasPermission: (moduleCode: string, permissionCode: string) => boolean;
  canCreate: (moduleCode: string) => boolean;
  canRead: (moduleCode: string) => boolean;
  canUpdate: (moduleCode: string) => boolean;
  canDelete: (moduleCode: string) => boolean;
  canApprove: (moduleCode: string) => boolean;
  canManage: (moduleCode: string) => boolean;
  isSystemAdmin: boolean;
  loading: boolean;
  error: string | null;
  refetchPermissions: () => Promise<void>;
}

export const usePermissions = (): UsePermissionsReturn => {
  const {
    permissions,
    isSystemAdmin,
    loading,
    error,
    hasPermission,
    loadPermissions
  } = usePermissionContext();

  // Convenience methods for common permission checks
  const canCreate = (moduleCode: string): boolean => hasPermission(moduleCode, 'C');
  const canRead = (moduleCode: string): boolean => hasPermission(moduleCode, 'R');
  const canUpdate = (moduleCode: string): boolean => hasPermission(moduleCode, 'U');
  const canDelete = (moduleCode: string): boolean => hasPermission(moduleCode, 'D');
  const canApprove = (moduleCode: string): boolean => hasPermission(moduleCode, 'A');
  const canManage = (moduleCode: string): boolean => hasPermission(moduleCode, 'M');

  const refetchPermissions = async () => {
    await loadPermissions();
  };

  return {
    permissions,
    hasPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canApprove,
    canManage,
    isSystemAdmin,
    loading,
    error,
    refetchPermissions
  };
};

// Higher-order component for permission-based rendering
interface PermissionGuardProps {
  moduleCode: string;
  permissionCode: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoading?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  moduleCode,
  permissionCode,
  children,
  fallback = null,
  showLoading = false
}) => {
  const { hasPermission, loading } = usePermissionContext();

  if (loading && showLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>;
  }

  if (loading) {
    return <>{fallback}</>;
  }

  return hasPermission(moduleCode, permissionCode) ? <>{children}</> : <>{fallback}</>;
};

// Hook for getting current user info
export const useCurrentUser = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const employee = getCurrentEmployee();
        if (!employee?.employeeID) {
          setUser(null);
          return;
        }

        const userData = await userManagementApi.getUserByEmployeeId(employee.employeeID);
        setUser(userData);
      } catch (error) {
        console.warn('Could not load current user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return { user, loading };
};

// Component for permission-based button rendering
interface PermissionButtonProps {
  moduleCode: string;
  permissionCode: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  moduleCode,
  permissionCode,
  onClick,
  children,
  className = '',
  disabled = false,
  variant = 'primary'
}) => {
  const { hasPermission, loading } = usePermissionContext();

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>;
  }

  if (!hasPermission(moduleCode, permissionCode)) {
    return null;
  }

  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// Hook for checking multiple permissions at once
export const useModulePermissions = (moduleCode: string) => {
  const { hasPermission, loading, error } = usePermissionContext();

  return {
    canCreate: hasPermission(moduleCode, 'C'),
    canRead: hasPermission(moduleCode, 'R'),
    canUpdate: hasPermission(moduleCode, 'U'),
    canDelete: hasPermission(moduleCode, 'D'),
    canApprove: hasPermission(moduleCode, 'A'),
    canManage: hasPermission(moduleCode, 'M'),
    loading,
    error,
    hasAnyPermission: ['C', 'R', 'U', 'D', 'A', 'M'].some(code => hasPermission(moduleCode, code))
  };
};
