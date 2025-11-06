import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, Shield, Lock, Unlock, UserPlus, X, Key, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { userManagementApi } from '../../services/userManagementApi';
import type { User, Role, CreateUserRequest, UpdateUserRequest, AssignRoleRequest } from '../../services/userManagementApi';
import { getApiUrl } from '../../config/api';
import PasswordModal from './PasswordModal';

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalMode, setPasswordModalMode] = useState<'create' | 'reset'>('create');
  const [passwordForEmployee, setPasswordForEmployee] = useState<{ id: number; name: string } | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  
  // Sorting state
  const [sortField, setSortField] = useState<'employeeFullName' | 'username' | 'departmentName' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Column filters state
  const [columnFilters, setColumnFilters] = useState<{
    employeeFullName: string[];
    username: string[];
    departmentName: string[];
  }>({
    employeeFullName: [],
    username: [],
    departmentName: []
  });
  
  // Temp filters for the dropdown (before Apply is clicked)
  const [tempFilters, setTempFilters] = useState<{
    employeeFullName: string[];
    username: string[];
    departmentName: string[];
  }>({
    employeeFullName: [],
    username: [],
    departmentName: []
  });
  
  // Track which filter dropdown is open
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const filterRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Search term within filter dropdowns
  const [filterSearchTerm, setFilterSearchTerm] = useState<string>('');

  // Form states
  const [createForm, setCreateForm] = useState<CreateUserRequest & { createPassword?: boolean; password?: string }>({
    employeeID: 0,
    username: '',
    isSystemAdmin: false,
    defaultRoleCode: 'EMPLOYEE',
    createPassword: false,
    password: ''
  });

  const [editForm, setEditForm] = useState<UpdateUserRequest>({});
  const [roleForm, setRoleForm] = useState<AssignRoleRequest>({
    roleID: 0,
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openFilter) {
        const filterElement = filterRefs.current[openFilter];
        if (filterElement && !filterElement.contains(event.target as Node)) {
          setOpenFilter(null);
          setTempFilters({ ...columnFilters });
          setFilterSearchTerm('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openFilter, columnFilters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData, employeesData] = await Promise.all([
        userManagementApi.getUsers(),
        userManagementApi.getRoles(),
        fetch(getApiUrl('Employees')).then(r => r.json())
      ]);
      
      setUsers(usersData);
      setRoles(rolesData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!createForm.employeeID) {
        alert('Please select an employee');
        return;
      }

      // Create user first
      await userManagementApi.createUser(createForm);
      
      // If password creation is enabled, open password modal
      if (createForm.createPassword) {
        const selectedEmployee = availableEmployees.find(emp => emp.employeeID === createForm.employeeID);
        if (selectedEmployee) {
          setPasswordForEmployee({
            id: createForm.employeeID,
            name: selectedEmployee.fullName
          });
          setPasswordModalMode('create');
          setShowCreateModal(false);
          setShowPasswordModal(true);
        }
      } else {
        setShowCreateModal(false);
        alert('User created successfully! Remember to set a password for this user.');
      }
      
      setCreateForm({
        employeeID: 0,
        username: '',
        isSystemAdmin: false,
        defaultRoleCode: 'EMPLOYEE',
        createPassword: false,
        password: ''
      });
      loadData();
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert(error.response?.data || 'Error creating user. Please try again.');
    }
  };

  const handleUpdateUser = async () => {
    try {
      if (!selectedUser) return;

      await userManagementApi.updateUser(selectedUser.userID, editForm);
      setShowEditModal(false);
      setEditForm({});
      setSelectedUser(null);
      loadData();
      alert('User updated successfully!');
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert(error.response?.data || 'Error updating user. Please try again.');
    }
  };

  const handleAssignRole = async () => {
    try {
      if (!selectedUser || !roleForm.roleID) {
        alert('Please select a role');
        return;
      }

      await userManagementApi.assignRole(selectedUser.userID, roleForm);
      setShowRoleModal(false);
      setRoleForm({ roleID: 0, reason: '' });
      setSelectedUser(null);
      loadData();
      alert('Role assigned successfully!');
    } catch (error: any) {
      console.error('Error assigning role:', error);
      alert(error.response?.data || 'Error assigning role. Please try again.');
    }
  };

  const handleRemoveRole = async (userId: number, roleId: number, roleName: string) => {
    if (!confirm(`Are you sure you want to remove the "${roleName}" role from this user?`)) {
      return;
    }

    try {
      await userManagementApi.removeRole(userId, { roleID: roleId, reason: 'Role removed via UI' });
      loadData();
      alert('Role removed successfully!');
    } catch (error: any) {
      console.error('Error removing role:', error);
      alert(error.response?.data || 'Error removing role. Please try again.');
    }
  };

  const handleToggleLock = async (user: User) => {
    try {
      await userManagementApi.updateUser(user.userID, { isLocked: !user.isLocked });
      loadData();
      alert(`User ${user.isLocked ? 'unlocked' : 'locked'} successfully!`);
    } catch (error: any) {
      console.error('Error toggling user lock:', error);
      alert(error.response?.data || 'Error updating user. Please try again.');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.employeeFullName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await userManagementApi.deleteUser(user.userID);
      loadData();
      alert('User deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(error.response?.data || 'Error deleting user. Please try again.');
    }
  };

  const handleResetPassword = (user: User) => {
    setPasswordForEmployee({
      id: user.employeeID,
      name: user.employeeFullName
    });
    setPasswordModalMode('reset');
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!passwordForEmployee) return;

    try {
      await userManagementApi.resetPassword(passwordForEmployee.id, password);
      alert(`Password ${passwordModalMode === 'create' ? 'set' : 'reset'} successfully!`);
      setShowPasswordModal(false);
      setPasswordForEmployee(null);
    } catch (error: any) {
      console.error('Error setting password:', error);
      throw error; // Re-throw to let modal handle the error
    }
  };

  // Sorting handler
  const handleSort = (field: 'employeeFullName' | 'username' | 'departmentName') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'employeeFullName' | 'username' | 'departmentName') => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  // Get unique values for a column
  const getUniqueColumnValues = (field: keyof typeof columnFilters): string[] => {
    const values = users
      .map(user => user[field] || '-')
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return values;
  };

  // Toggle filter dropdown
  const toggleFilterDropdown = (field: string) => {
    if (openFilter === field) {
      setOpenFilter(null);
      setTempFilters({ ...columnFilters });
      setFilterSearchTerm('');
    } else {
      setOpenFilter(field);
      setTempFilters({ ...columnFilters });
      setFilterSearchTerm('');
    }
  };

  // Handle checkbox change in filter
  const handleFilterCheckbox = (field: keyof typeof columnFilters, value: string) => {
    setTempFilters(prev => {
      const currentValues = prev[field];
      if (currentValues.includes(value)) {
        return {
          ...prev,
          [field]: currentValues.filter(v => v !== value)
        };
      } else {
        return {
          ...prev,
          [field]: [...currentValues, value]
        };
      }
    });
  };

  // Apply filter
  const applyFilter = (field: keyof typeof columnFilters) => {
    setColumnFilters(prev => ({
      ...prev,
      [field]: tempFilters[field]
    }));
    setOpenFilter(null);
    setFilterSearchTerm('');
  };

  // Clear filter
  const clearFilter = (field: keyof typeof columnFilters) => {
    setTempFilters(prev => ({
      ...prev,
      [field]: []
    }));
    setColumnFilters(prev => ({
      ...prev,
      [field]: []
    }));
    setOpenFilter(null);
    setFilterSearchTerm('');
  };

  // Check if column has active filter
  const hasActiveFilter = (field: keyof typeof columnFilters): boolean => {
    return columnFilters[field].length > 0;
  };

  // Render filter dropdown
  const renderFilterDropdown = (field: keyof typeof columnFilters) => {
    const uniqueValues = getUniqueColumnValues(field);
    const isOpen = openFilter === field;
    
    // Filter values based on search term
    const filteredValues = uniqueValues.filter(value => 
      value.toLowerCase().includes(filterSearchTerm.toLowerCase())
    );

    // Calculate dropdown position for fixed positioning
    const getDropdownStyle = (): React.CSSProperties => {
      if (!isOpen || !filterRefs.current[field]) return {};
      
      const buttonElement = filterRefs.current[field];
      const rect = buttonElement?.getBoundingClientRect();
      
      if (!rect) return {};
      
      return {
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
        zIndex: 9999
      };
    };

    return (
      <div className="relative inline-block" ref={el => filterRefs.current[field] = el}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFilterDropdown(field);
          }}
          className={`ml-2 p-1 rounded hover:bg-gray-200 ${hasActiveFilter(field) ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <Filter className="w-4 h-4" />
        </button>
        
        {isOpen && (
          <div 
            style={getDropdownStyle()}
            className="bg-white border border-gray-300 rounded-lg shadow-lg min-w-[200px] max-w-[300px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={filterSearchTerm}
                  onChange={(e) => setFilterSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            
            <div className="p-3 max-h-[250px] overflow-y-auto">
              <div className="space-y-2">
                {filteredValues.length > 0 ? (
                  filteredValues.map((value) => (
                    <label key={value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={tempFilters[field].includes(value)}
                        onChange={() => handleFilterCheckbox(field, value)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 truncate">{value}</span>
                    </label>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-2">
                    No results found
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-2 p-3 border-t border-gray-200">
              <button
                onClick={() => clearFilter(field)}
                className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => applyFilter(field)}
                className="px-3 py-1.5 text-sm text-white bg-cyan-500 rounded hover:bg-cyan-600 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const filteredUsers = users
    .filter(user => {
      // Global search filter
      const matchesSearch = searchTerm === '' || 
        user.employeeFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.roleNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.departmentName && user.departmentName.toLowerCase().includes(searchTerm.toLowerCase()));

      // Column filters
      const matchesEmployeeName = columnFilters.employeeFullName.length === 0 || 
        columnFilters.employeeFullName.includes(user.employeeFullName || '-');
      
      const matchesUsername = columnFilters.username.length === 0 || 
        columnFilters.username.includes(user.username || '-');
      
      const matchesDepartment = columnFilters.departmentName.length === 0 || 
        columnFilters.departmentName.includes(user.departmentName || '-');

      return matchesSearch && matchesEmployeeName && matchesUsername && matchesDepartment;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      const comparison = aValue.toString().localeCompare(bValue.toString());
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const availableEmployees = employees.filter(emp => 
    emp.isActive && !users.some(user => user.employeeID === emp.employeeID)
  );

  if (loading) {
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
          <h2 className="text-2xl font-bold text-left text-gray-900">Users</h2>
          <p className="text-gray-600">Manage user accounts and role assignments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users by name, username, role, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <div className="max-h-[70vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 select-none"
                        onClick={() => handleSort('employeeFullName')}
                      >
                        <span>User</span>
                        {getSortIcon('employeeFullName')}
                      </div>
                      {renderFilterDropdown('employeeFullName')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 select-none"
                        onClick={() => handleSort('username')}
                      >
                        <span>Username</span>
                        {getSortIcon('username')}
                      </div>
                      {renderFilterDropdown('username')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 select-none"
                        onClick={() => handleSort('departmentName')}
                      >
                        <span>Department</span>
                        {getSortIcon('departmentName')}
                      </div>
                      {renderFilterDropdown('departmentName')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.userID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.employeeFullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {user.employeeFullName}
                            </div>
                            {user.isSystemAdmin && (
                              <span title="System Administrator">
                                <Shield className="ml-2 w-4 h-4 text-red-500" />
                              </span>
                            )}
                            {user.isLocked && (
                              <span title="Account Locked">
                                <Lock className="ml-2 w-4 h-4 text-orange-500" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="text-sm text-gray-900">{user.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="text-sm text-gray-900">{user.departmentName || '-'}</div>
                      {user.positionTitle && (
                        <div className="text-sm text-gray-500">{user.positionTitle}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {user.roleCount} role{user.roleCount !== 1 ? 's' : ''}
                      </div>
                      {user.roles.length > 0 ? (
                        <div className="mt-1">
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                              <div
                                key={role.userRoleID}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {role.roleName}
                                {role.expiryDate && (
                                  <span className="ml-1 text-blue-600">
                                    (exp: {new Date(role.expiryDate).toLocaleDateString()})
                                  </span>
                                )}
                                <button
                                  onClick={() => handleRemoveRole(user.userID, role.roleID, role.roleName)}
                                  className="ml-1 text-blue-600 hover:text-blue-800"
                                  title="Remove role"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No roles assigned</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="text-purple-600 hover:text-purple-800 p-1 rounded"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowRoleModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded"
                          title="Assign Role"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setEditForm({
                              username: user.username,
                              isSystemAdmin: user.isSystemAdmin,
                              isActive: user.isActive,
                              isLocked: user.isLocked
                            });
                            setShowEditModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-800 p-1 rounded"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleLock(user)}
                          className={`p-1 rounded ${user.isLocked ? 'text-green-600 hover:text-green-800' : 'text-orange-600 hover:text-orange-800'}`}
                          title={user.isLocked ? 'Unlock User' : 'Lock User'}
                        >
                          {user.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-800 p-1 rounded"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New User</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee *
                </label>
                <select
                  value={createForm.employeeID}
                  onChange={(e) => setCreateForm({ ...createForm, employeeID: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={0}>Select an employee</option>
                  {availableEmployees.map((emp) => (
                    <option key={emp.employeeID} value={emp.employeeID}>
                      {emp.fullName} ({emp.email || 'No email'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  placeholder="Leave empty to auto-generate"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Role
                </label>
                <select
                  value={createForm.defaultRoleCode}
                  onChange={(e) => setCreateForm({ ...createForm, defaultRoleCode: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roles.map((role) => (
                    <option key={role.roleID} value={role.roleCode}>
                      {role.roleName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isSystemAdmin"
                    checked={createForm.isSystemAdmin}
                    onChange={(e) => setCreateForm({ ...createForm, isSystemAdmin: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isSystemAdmin" className="ml-2 block text-sm text-gray-900">
                    System Administrator
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="createPassword"
                    checked={createForm.createPassword}
                    onChange={(e) => setCreateForm({ ...createForm, createPassword: e.target.checked })}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="createPassword" className="ml-2 block text-sm text-gray-900 flex items-center">
                    <Key className="w-3 h-3 mr-1 text-purple-600" />
                    Set password immediately after creation
                  </label>
                </div>
              </div>
            </div>

            {createForm.createPassword && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800">
                  After creating the user, you'll be prompted to set a password immediately.
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm({
                    employeeID: 0,
                    username: '',
                    isSystemAdmin: false,
                    defaultRoleCode: 'EMPLOYEE'
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit User: {selectedUser.employeeFullName}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={editForm.username || ''}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIsSystemAdmin"
                    checked={editForm.isSystemAdmin || false}
                    onChange={(e) => setEditForm({ ...editForm, isSystemAdmin: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="editIsSystemAdmin" className="ml-2 block text-sm text-gray-900">
                    System Administrator
                  </label>
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

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIsLocked"
                    checked={editForm.isLocked || false}
                    onChange={(e) => setEditForm({ ...editForm, isLocked: e.target.checked })}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="editIsLocked" className="ml-2 block text-sm text-gray-900">
                    Locked
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditForm({});
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Assign Role to: {selectedUser.employeeFullName}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={roleForm.roleID}
                  onChange={(e) => setRoleForm({ ...roleForm, roleID: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={0}>Select a role</option>
                  {roles.filter(role => !selectedUser.roles.some(ur => ur.roleID === role.roleID)).map((role) => (
                    <option key={role.roleID} value={role.roleID}>
                      {role.roleName} ({role.roleCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={roleForm.expiryDate || ''}
                  onChange={(e) => setRoleForm({ ...roleForm, expiryDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  value={roleForm.reason}
                  onChange={(e) => setRoleForm({ ...roleForm, reason: e.target.value })}
                  placeholder="Optional reason for role assignment"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setRoleForm({ roleID: 0, reason: '' });
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignRole}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Assign Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Management Modal */}
      {passwordForEmployee && (
        <PasswordModal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setPasswordForEmployee(null);
          }}
          onSubmit={handlePasswordSubmit}
          employeeID={passwordForEmployee.id}
          employeeName={passwordForEmployee.name}
          mode={passwordModalMode}
        />
      )}
    </div>
  );
};

export default UserList;
