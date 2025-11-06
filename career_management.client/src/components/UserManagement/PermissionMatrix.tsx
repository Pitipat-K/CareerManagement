import { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { userManagementApi } from '../../services/userManagementApi';
import type { User, PermissionOverrideRequest } from '../../services/userManagementApi';

interface PermissionMatrix {
  modules: Array<{
    moduleID: number;
    moduleName: string;
    moduleCode: string;
    moduleDescription: string;
  }>;
  permissionTypes: Array<{
    permissionTypeID: number;
    permissionName: string;
    permissionCode: string;
    permissionDescription: string;
  }>;
  permissions: Array<{
    permissionID: number;
    moduleID: number;
    permissionTypeID: number;
    permissionFullName: string;
    description: string;
  }>;
}

const PermissionMatrix = () => {
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<any[]>([]);
  const [userOverrides, setUserOverrides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<any>(null);
  const [overrideForm, setOverrideForm] = useState<PermissionOverrideRequest>({
    userID: 0,
    permissionID: 0,
    isGranted: true,
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadUserPermissions();
    }
  }, [selectedUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [matrixData, usersData] = await Promise.all([
        userManagementApi.getPermissionMatrix(),
        userManagementApi.getUsers()
      ]);
      
      setMatrix(matrixData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading permission data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPermissions = async () => {
    if (!selectedUser) return;

    try {
      const [permissionsData, overridesData] = await Promise.all([
        userManagementApi.getUserPermissions(selectedUser.userID),
        userManagementApi.getUserPermissionOverrides(selectedUser.userID)
      ]);
      
      setUserPermissions(permissionsData);
      setUserOverrides(overridesData);
    } catch (error) {
      console.error('Error loading user permissions:', error);
    }
  };

  const handleCreateOverride = async () => {
    try {
      if (!selectedUser || !selectedPermission) return;

      const request: PermissionOverrideRequest = {
        userID: selectedUser.userID,
        permissionID: selectedPermission.permissionID,
        isGranted: overrideForm.isGranted,
        reason: overrideForm.reason,
        expiryDate: overrideForm.expiryDate
      };

      await userManagementApi.createPermissionOverride(request);
      setShowOverrideModal(false);
      setOverrideForm({
        userID: 0,
        permissionID: 0,
        isGranted: true,
        reason: ''
      });
      setSelectedPermission(null);
      loadUserPermissions();
      alert('Permission override created successfully!');
    } catch (error: any) {
      console.error('Error creating permission override:', error);
      alert(error.response?.data || 'Error creating permission override. Please try again.');
    }
  };

  const handleRemoveOverride = async (overrideId: number) => {
    if (!confirm('Are you sure you want to remove this permission override?')) {
      return;
    }

    try {
      await userManagementApi.deletePermissionOverride(overrideId);
      loadUserPermissions();
      alert('Permission override removed successfully!');
    } catch (error: any) {
      console.error('Error removing permission override:', error);
      alert(error.response?.data || 'Error removing permission override. Please try again.');
    }
  };

  const getPermissionStatus = (moduleCode: string, permissionCode: string) => {
    if (!selectedUser) return null;

    // Check for override first
    const override = userOverrides.find(o => 
      o.permissionFullName === `${moduleCode}_${permissionCode}`
    );
    if (override) {
      return {
        hasPermission: override.isGranted,
        source: 'Override',
        reason: override.reason,
        type: 'override'
      };
    }

    // Check role-based permissions
    const rolePermission = userPermissions.find(p => 
      p.moduleCode === moduleCode && 
      p.permissionCode === permissionCode &&
      p.permissionSource === 'Role'
    );
    if (rolePermission) {
      return {
        hasPermission: rolePermission.isGranted,
        source: rolePermission.roleName,
        reason: `Granted by role: ${rolePermission.roleName}`,
        type: 'role'
      };
    }

    // System admin check
    if (selectedUser.isSystemAdmin) {
      return {
        hasPermission: true,
        source: 'System Admin',
        reason: 'System Administrator has all permissions',
        type: 'admin'
      };
    }

    return {
      hasPermission: false,
      source: 'None',
      reason: 'No permission granted',
      type: 'none'
    };
  };

  const getPermissionIcon = (status: any) => {
    if (!status) return null;

    switch (status.type) {
      case 'override':
        return status.hasPermission ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600" />
        );
      case 'role':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'admin':
        return <CheckCircle className="w-5 h-5 text-purple-600" />;
      case 'none':
        return <XCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const filteredUsers = users.filter(user =>
    user.employeeFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || !matrix) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Permission Matrix</h2>
          <p className="text-gray-600">View and manage user permissions across all modules</p>
        </div>
        {selectedUser && (
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{selectedUser.employeeFullName}</p>
            <p className="text-sm text-gray-500">{selectedUser.roleNames}</p>
          </div>
        )}
      </div>

      {/* User Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select User to View Permissions
        </label>
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedUser?.userID || ''}
            onChange={(e) => {
              const userId = parseInt(e.target.value);
              const user = users.find(u => u.userID === userId);
              setSelectedUser(user || null);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
          >
            <option value="">Select a user</option>
            {filteredUsers.map((user) => (
              <option key={user.userID} value={user.userID}>
                {user.employeeFullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedUser && (
        <>
          {/* Permission Matrix */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Permission Matrix for {selectedUser.employeeFullName}
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Module
                      </th>
                      {matrix.permissionTypes.map((permType) => (
                        <th key={permType.permissionTypeID} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {permType.permissionName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {matrix.modules.map((module) => (
                      <tr key={module.moduleID} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-left font-medium text-gray-900">
                              {module.moduleName}
                            </div>
                            <div className="text-sm text-left text-gray-500">
                              {module.moduleCode}
                            </div>
                          </div>
                        </td>
                        {matrix.permissionTypes.map((permType) => {
                          const permission = matrix.permissions.find(p => 
                            p.moduleID === module.moduleID && 
                            p.permissionTypeID === permType.permissionTypeID
                          );
                          const status = getPermissionStatus(module.moduleCode, permType.permissionCode);
                          
                          return (
                            <td key={permType.permissionTypeID} className="px-6 py-4 whitespace-nowrap text-center">
                              {permission && (
                                <div className="flex flex-col items-center">
                                  <button
                                    onClick={() => {
                                      setSelectedPermission(permission);
                                      setOverrideForm({
                                        userID: selectedUser.userID,
                                        permissionID: permission.permissionID,
                                        isGranted: !status?.hasPermission,
                                        reason: ''
                                      });
                                      setShowOverrideModal(true);
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded"
                                    title={`${status?.reason} - Click to create override`}
                                  >
                                    {getPermissionIcon(status)}
                                  </button>
                                  <span className="text-xs text-gray-500 mt-1">
                                    {status?.source}
                                  </span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Permission Overrides */}
          {userOverrides.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Permission Overrides for {selectedUser.employeeFullName}
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Permission
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userOverrides.map((override) => (
                        <tr key={override.overrideID} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {override.moduleName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {override.permissionName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              override.isGranted 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {override.isGranted ? 'Granted' : 'Denied'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {override.reason || 'No reason provided'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(override.createdDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleRemoveOverride(override.overrideID)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!selectedUser && (
        <div className="text-center py-12">
          <Eye className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No user selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Select a user above to view their permission matrix.
          </p>
        </div>
      )}

      {/* Create Override Modal */}
      {showOverrideModal && selectedPermission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Create Permission Override
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permission
                </label>
                <input
                  type="text"
                  value={selectedPermission.permissionFullName}
                  disabled
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action
                </label>
                <select
                  value={overrideForm.isGranted ? 'grant' : 'deny'}
                  onChange={(e) => setOverrideForm({ ...overrideForm, isGranted: e.target.value === 'grant' })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="grant">Grant Permission</option>
                  <option value="deny">Deny Permission</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={overrideForm.expiryDate || ''}
                  onChange={(e) => setOverrideForm({ ...overrideForm, expiryDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason *
                </label>
                <textarea
                  value={overrideForm.reason}
                  onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                  placeholder="Provide a reason for this override"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowOverrideModal(false);
                  setSelectedPermission(null);
                  setOverrideForm({
                    userID: 0,
                    permissionID: 0,
                    isGranted: true,
                    reason: ''
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOverride}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionMatrix;
