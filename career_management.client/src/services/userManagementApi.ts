import axios from 'axios';
import { getApiUrl } from '../config/api';

// Types
export interface User {
  userID: number;
  employeeID: number;
  username: string;
  isSystemAdmin: boolean;
  lastLoginDate?: string;
  loginAttempts: number;
  isLocked: boolean;
  lockoutEndDate?: string;
  createdDate: string;
  isActive: boolean;
  employeeFullName: string;
  employeeEmail?: string;
  departmentName?: string;
  positionTitle?: string;
  roles: UserRole[];
  roleCount: number;
  roleNames: string;
}

export interface UserRole {
  userRoleID: number;
  roleID: number;
  roleName: string;
  roleCode: string;
  assignedDate: string;
  expiryDate?: string;
  isActive: boolean;
  assignedByName?: string;
}

export interface Role {
  roleID: number;
  roleName: string;
  roleDescription?: string;
  roleCode: string;
  isSystemRole: boolean;
  departmentID?: number;
  departmentName?: string;
  companyID?: number;
  companyName?: string;
  isActive: boolean;
  createdDate: string;
  permissionCount: number;
  userCount: number;
  permissions: Permission[];
}

export interface Permission {
  permissionID: number;
  moduleID: number;
  moduleName: string;
  moduleCode: string;
  permissionTypeID: number;
  permissionName: string;
  permissionCode: string;
  permissionFullName: string;
  description?: string;
  isActive: boolean;
}

export interface UserPermission {
  userID: number;
  userFullName: string;
  moduleName: string;
  moduleCode: string;
  permissionName: string;
  permissionCode: string;
  permissionFullName: string;
  roleName: string;
  permissionSource: string;
  isGranted: boolean;
  effectiveDate: string;
  expiryDate?: string;
}

export interface CreateUserRequest {
  employeeID: number;
  username?: string;
  isSystemAdmin?: boolean;
  defaultRoleCode?: string;
}

export interface UpdateUserRequest {
  username?: string;
  isSystemAdmin?: boolean;
  isActive?: boolean;
  isLocked?: boolean;
}

export interface AssignRoleRequest {
  roleID: number;
  expiryDate?: string;
  reason?: string;
}

export interface RemoveRoleRequest {
  roleID: number;
  reason?: string;
}

export interface PermissionCheckRequest {
  userID: number;
  moduleCode: string;
  permissionCode: string;
}

export interface PermissionCheckResponse {
  hasPermission: boolean;
  reason: string;
  sources: string[];
}

export interface SetPasswordRequest {
  employeeID: number;
  oldPassword?: string;
  newPassword: string;
}

export interface CreateRoleRequest {
  roleName: string;
  roleDescription?: string;
  roleCode: string;
  departmentID?: number;
  companyID?: number;
  permissionIDs: number[];
}

export interface UpdateRoleRequest {
  roleName?: string;
  roleDescription?: string;
  isActive?: boolean;
  permissionIDs?: number[];
}

export interface PermissionOverrideRequest {
  userID: number;
  permissionID: number;
  isGranted: boolean;
  reason?: string;
  expiryDate?: string;
}

// API Service Class
export class UserManagementApi {
  private static instance: UserManagementApi;

  public static getInstance(): UserManagementApi {
    if (!UserManagementApi.instance) {
      UserManagementApi.instance = new UserManagementApi();
    }
    return UserManagementApi.instance;
  }

  // User Management
  async getUsers(): Promise<User[]> {
    const response = await axios.get(getApiUrl('Users'));
    return response.data;
  }

  async getUser(id: number): Promise<User> {
    const response = await axios.get(getApiUrl(`Users/${id}`));
    return response.data;
  }

  async getUserByEmployeeId(employeeId: number): Promise<User> {
    const response = await axios.get(getApiUrl(`Users/employee/${employeeId}`));
    return response.data;
  }

  async getUserByUsername(username: string): Promise<User> {
    const response = await axios.get(getApiUrl(`Users/username/${encodeURIComponent(username)}`));
    return response.data;
  }

  async createUser(request: CreateUserRequest): Promise<User> {
    const response = await axios.post(getApiUrl('Users'), request);
    return response.data;
  }

  async updateUser(id: number, request: UpdateUserRequest): Promise<void> {
    await axios.put(getApiUrl(`Users/${id}`), request);
  }

  async deleteUser(id: number): Promise<void> {
    await axios.delete(getApiUrl(`Users/${id}`));
  }

  async assignRole(userId: number, request: AssignRoleRequest): Promise<void> {
    await axios.post(getApiUrl(`Users/${userId}/roles`), request);
  }

  async removeRole(userId: number, request: RemoveRoleRequest): Promise<void> {
    const params = request.reason ? `?reason=${encodeURIComponent(request.reason)}` : '';
    await axios.delete(getApiUrl(`Users/${userId}/roles/${request.roleID}${params}`));
  }

  async getUserPermissions(userId: number): Promise<UserPermission[]> {
    const response = await axios.get(getApiUrl(`Users/${userId}/permissions`));
    return response.data;
  }

  async checkPermission(request: PermissionCheckRequest): Promise<PermissionCheckResponse> {
    const response = await axios.post(getApiUrl('Users/check-permission'), request);
    return response.data;
  }

  // Role Management
  async getRoles(): Promise<Role[]> {
    const response = await axios.get(getApiUrl('Roles'));
    return response.data;
  }

  async getRole(id: number): Promise<Role> {
    const response = await axios.get(getApiUrl(`Roles/${id}`));
    return response.data;
  }

  async getRoleByCode(roleCode: string): Promise<Role> {
    const response = await axios.get(getApiUrl(`Roles/code/${roleCode}`));
    return response.data;
  }

  async createRole(request: CreateRoleRequest): Promise<Role> {
    const response = await axios.post(getApiUrl('Roles'), request);
    return response.data;
  }

  async updateRole(id: number, request: UpdateRoleRequest): Promise<void> {
    await axios.put(getApiUrl(`Roles/${id}`), request);
  }

  async deleteRole(id: number): Promise<void> {
    await axios.delete(getApiUrl(`Roles/${id}`));
  }

  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const response = await axios.get(getApiUrl(`Roles/${roleId}/permissions`));
    return response.data;
  }

  async getRoleUsers(roleId: number): Promise<User[]> {
    const response = await axios.get(getApiUrl(`Roles/${roleId}/users`));
    return response.data;
  }

  // Permission Management
  async getPermissions(): Promise<Permission[]> {
    const response = await axios.get(getApiUrl('Permissions'));
    return response.data;
  }

  async getModules(): Promise<any[]> {
    const response = await axios.get(getApiUrl('Permissions/modules'));
    return response.data;
  }

  async getPermissionTypes(): Promise<any[]> {
    const response = await axios.get(getApiUrl('Permissions/types'));
    return response.data;
  }

  async getPermissionMatrix(): Promise<any> {
    const response = await axios.get(getApiUrl('Permissions/matrix'));
    return response.data;
  }

  async createPermissionOverride(request: PermissionOverrideRequest): Promise<void> {
    await axios.post(getApiUrl('Permissions/override'), request);
  }

  async getUserPermissionOverrides(userId: number): Promise<any[]> {
    const response = await axios.get(getApiUrl(`Permissions/user/${userId}/overrides`));
    return response.data;
  }

  async deletePermissionOverride(overrideId: number): Promise<void> {
    await axios.delete(getApiUrl(`Permissions/override/${overrideId}`));
  }

  async getPermissionAuditLog(userId?: number, days: number = 30): Promise<any[]> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId.toString());
    params.append('days', days.toString());
    
    const response = await axios.get(getApiUrl(`Permissions/audit?${params.toString()}`));
    return response.data;
  }

  // Password Management
  async setPassword(request: SetPasswordRequest): Promise<void> {
    await axios.post(getApiUrl('Authentication/set-password'), request);
  }

  async resetPassword(employeeID: number, newPassword: string): Promise<void> {
    await axios.post(getApiUrl('Authentication/set-password'), {
      employeeID,
      newPassword
    });
  }
}

// Export singleton instance
export const userManagementApi = UserManagementApi.getInstance();
