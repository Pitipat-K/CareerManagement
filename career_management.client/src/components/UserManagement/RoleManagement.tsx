import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Users, Shield, Settings, ChevronDown, ChevronRight, Save, X } from 'lucide-react';
import { userManagementApi } from '../../services/userManagementApi';
import type { Role, Permission, CreateRoleRequest, UpdateRoleRequest } from '../../services/userManagementApi';
import { usePermissions } from '../../hooks/usePermissions';

const RoleManagement = () => {
  const { isSystemAdmin, loading: permissionsLoading } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedRole, setExpandedRole] = useState<number | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<number | null>(null);
  const [tempPermissions, setTempPermissions] = useState<number[]>([]);

  // Form states
  const [createForm, setCreateForm] = useState<CreateRoleRequest>({
    roleName: '',
    roleDescription: '',
    roleCode: '',
    permissionIDs: []
  });

  const [editForm, setEditForm] = useState<UpdateRoleRequest>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData] = await Promise.all([
        userManagementApi.getRoles(),
        userManagementApi.getPermissions()
      ]);
      
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading role data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      if (!createForm.roleName || !createForm.roleCode) {
        alert('Please fill in role name and code');
        return;
      }

      await userManagementApi.createRole(createForm);
      setShowCreateModal(false);
      setCreateForm({
        roleName: '',
        roleDescription: '',
        roleCode: '',
        permissionIDs: []
      });
      loadData();
      alert('Role created successfully!');
    } catch (error: any) {
      console.error('Error creating role:', error);
      alert(error.response?.data || 'Error creating role. Please try again.');
    }
  };

  const handleUpdateRole = async () => {
    try {
      if (!selectedRole) return;

      await userManagementApi.updateRole(selectedRole.roleID, editForm);
      setShowEditModal(false);
      setEditForm({});
      setSelectedRole(null);
      loadData();
      alert('Role updated successfully!');
    } catch (error: any) {
      console.error('Error updating role:', error);
      alert(error.response?.data || 'Error updating role. Please try again.');
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.isSystemRole) {
      alert('Cannot delete system roles');
      return;
    }

    if (!confirm(`Are you sure you want to delete role "${role.roleName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await userManagementApi.deleteRole(role.roleID);
      loadData();
      alert('Role deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting role:', error);
      alert(error.response?.data || 'Error deleting role. Please try again.');
    }
  };

  const handlePermissionToggle = (permissionId: number, isSelected: boolean) => {
    if (isSelected) {
      setCreateForm({
        ...createForm,
        permissionIDs: [...createForm.permissionIDs, permissionId]
      });
    } else {
      setCreateForm({
        ...createForm,
        permissionIDs: createForm.permissionIDs.filter(id => id !== permissionId)
      });
    }
  };

  const handleEditPermissionToggle = (permissionId: number, isSelected: boolean) => {
    const currentPermissions = editForm.permissionIDs || [];
    if (isSelected) {
      setEditForm({
        ...editForm,
        permissionIDs: [...currentPermissions, permissionId]
      });
    } else {
      setEditForm({
        ...editForm,
        permissionIDs: currentPermissions.filter(id => id !== permissionId)
      });
    }
  };

  const handleStartEditingPermissions = (role: Role) => {
    setEditingPermissions(role.roleID);
    setTempPermissions(role.permissions.map(p => p.permissionID));
  };

  const handleCancelEditingPermissions = () => {
    setEditingPermissions(null);
    setTempPermissions([]);
  };

  const handleTempPermissionToggle = (permissionId: number, isSelected: boolean) => {
    if (isSelected) {
      setTempPermissions([...tempPermissions, permissionId]);
    } else {
      setTempPermissions(tempPermissions.filter(id => id !== permissionId));
    }
  };

  const handleSavePermissions = async () => {
    if (!editingPermissions) return;

    try {
      await userManagementApi.updateRole(editingPermissions, {
        permissionIDs: tempPermissions
      });
      
      setEditingPermissions(null);
      setTempPermissions([]);
      loadData();
      alert('Permissions updated successfully!');
    } catch (error: any) {
      console.error('Error updating permissions:', error);
      alert(error.response?.data || 'Error updating permissions. Please try again.');
    }
  };

  const isSystemAdminRole = (role: Role) => {
    return role.roleCode === 'SYSTEM_ADMIN' || role.roleName.toLowerCase().includes('system admin');
  };

  const filteredRoles = roles.filter(role =>
    role.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.roleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.roleDescription && role.roleDescription.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc, permission) => {
    if (!acc[permission.moduleName]) {
      acc[permission.moduleName] = [];
    }
    acc[permission.moduleName].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading || permissionsLoading) {
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
          <h2 className="text-2xl font-bold text-gray-900">Roles</h2>
          <p className="text-gray-600">
            Manage user roles and their permissions
            {isSystemAdmin && (
              <span className="text-blue-600 font-medium"> - System Administrator Access</span>
            )}
          </p>
          {!isSystemAdmin && (
            <p className="text-amber-600 text-sm mt-1">
              <Shield className="w-4 h-4 inline mr-1" />
              Permission editing requires System Administrator privileges
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Role
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search roles by name, code, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredRoles.map((role) => (
            <li key={role.roleID}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <button
                      onClick={() => setExpandedRole(expandedRole === role.roleID ? null : role.roleID)}
                      className="mr-2 p-1 hover:bg-gray-100 rounded"
                    >
                      {expandedRole === role.roleID ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    <div className="flex-shrink-0">
                      <Shield className={`h-8 w-8 ${role.isSystemRole ? 'text-red-500' : 'text-blue-500'}`} />
                    </div>
                    <div className="ml-4 text-left">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 text-left">
                          {role.roleName}
                        </p>
                        {role.isSystemRole && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            System Role
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 text-left">Code: {role.roleCode}</p>
                      {role.roleDescription && (
                        <p className="text-sm text-gray-500 max-w-md text-left">{role.roleDescription}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users className="w-4 h-4 mr-1" />
                        {role.userCount} user{role.userCount !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Settings className="w-4 h-4 mr-1" />
                        {role.permissionCount} permission{role.permissionCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-4">
                      {isSystemAdmin && (
                        <button
                          onClick={!isSystemAdminRole(role) ? () => handleStartEditingPermissions(role) : undefined}
                          className={`p-1 ${
                            isSystemAdminRole(role) 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-blue-600 hover:text-blue-800'
                          }`}
                          title={
                            isSystemAdminRole(role) 
                              ? "System Administrator permissions cannot be edited" 
                              : "Edit Permissions"
                          }
                          disabled={editingPermissions === role.roleID || isSystemAdminRole(role)}
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      )}
                      {!role.isSystemRole && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedRole(role);
                              setEditForm({
                                roleName: role.roleName,
                                roleDescription: role.roleDescription,
                                isActive: role.isActive,
                                permissionIDs: role.permissions.map(p => p.permissionID)
                              });
                              setShowEditModal(true);
                            }}
                            className="text-gray-600 hover:text-gray-800 p-1"
                            title="Edit Role"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete Role"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Expanded Permissions */}
                {expandedRole === role.roleID && (
                  <div className="mt-4 pl-12">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Permissions:</h4>
                      {editingPermissions === role.roleID && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={handleSavePermissions}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Save
                          </button>
                          <button
                            onClick={handleCancelEditingPermissions}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {editingPermissions === role.roleID ? (
                      // Editing mode - show checkboxes grouped by module
                      <div className="border border-gray-300 rounded-md max-h-96 overflow-y-auto">
                        {Object.entries(permissionsByModule).map(([moduleName, modulePermissions]) => (
                          <div key={moduleName} className="p-3 border-b border-gray-200 last:border-b-0">
                            <h5 className="font-medium text-gray-900 mb-2 text-sm">{moduleName}</h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {modulePermissions.map((permission) => (
                                <label key={permission.permissionID} className="flex items-center text-sm">
                                  <input
                                    type="checkbox"
                                    checked={tempPermissions.includes(permission.permissionID)}
                                    onChange={(e) => handleTempPermissionToggle(permission.permissionID, e.target.checked)}
                                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                                  />
                                  <span className="text-xs text-gray-700">
                                    {permission.permissionName}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // View mode - show permission badges
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {role.permissions.map((permission) => (
                            <div
                              key={permission.permissionID}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                            >
                              {permission.permissionFullName}
                            </div>
                          ))}
                        </div>
                        {role.permissions.length === 0 && (
                          <p className="text-sm text-gray-500">No permissions assigned</p>
                        )}
                      </>
                    )}
                    
                    {isSystemAdminRole(role) && (
                      <p className="text-sm text-blue-600 mt-2 italic">
                        System Administrator role has all permissions by default
                      </p>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
        
        {filteredRoles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No roles found matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Role</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    value={createForm.roleName}
                    onChange={(e) => setCreateForm({ ...createForm, roleName: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Code *
                  </label>
                  <input
                    type="text"
                    value={createForm.roleCode}
                    onChange={(e) => setCreateForm({ ...createForm, roleCode: e.target.value.toUpperCase() })}
                    placeholder="e.g., CUSTOM_ROLE"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={createForm.roleDescription}
                  onChange={(e) => setCreateForm({ ...createForm, roleDescription: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="border border-gray-300 rounded-md max-h-96 overflow-y-auto">
                  {Object.entries(permissionsByModule).map(([moduleName, modulePermissions]) => (
                    <div key={moduleName} className="p-3 border-b border-gray-200 last:border-b-0">
                      <h4 className="font-medium text-gray-900 mb-2">{moduleName}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {modulePermissions.map((permission) => (
                          <label key={permission.permissionID} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={createForm.permissionIDs.includes(permission.permissionID)}
                              onChange={(e) => handlePermissionToggle(permission.permissionID, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {permission.permissionName}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Selected: {createForm.permissionIDs.length} permissions
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm({
                    roleName: '',
                    roleDescription: '',
                    roleCode: '',
                    permissionIDs: []
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedRole && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit Role: {selectedRole.roleName}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name
                  </label>
                  <input
                    type="text"
                    value={editForm.roleName || ''}
                    onChange={(e) => setEditForm({ ...editForm, roleName: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Code
                  </label>
                  <input
                    type="text"
                    value={selectedRole.roleCode}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.roleDescription || ''}
                  onChange={(e) => setEditForm({ ...editForm, roleDescription: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editForm.isActive !== false}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="editIsActive" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="border border-gray-300 rounded-md max-h-96 overflow-y-auto">
                  {Object.entries(permissionsByModule).map(([moduleName, modulePermissions]) => (
                    <div key={moduleName} className="p-3 border-b border-gray-200 last:border-b-0">
                      <h4 className="font-medium text-gray-900 mb-2">{moduleName}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {modulePermissions.map((permission) => (
                          <label key={permission.permissionID} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={(editForm.permissionIDs || []).includes(permission.permissionID)}
                              onChange={(e) => handleEditPermissionToggle(permission.permissionID, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {permission.permissionName}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Selected: {(editForm.permissionIDs || []).length} permissions
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditForm({});
                  setSelectedRole(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
