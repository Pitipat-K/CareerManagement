import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import { useModulePermissions } from '../hooks/usePermissions';

interface Employee {
  employeeID: number;
  employeeCode?: string;
  firstName: string;
  lastName: string;
  positionID: number;
  managerID?: number;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  hireDate?: string;
  workerCategory?: string;
  createdDate: string;
  modifiedDate: string;
  modifiedBy?: number; // Added
  modifiedByEmployeeName?: string; // Added
  isActive: boolean;
  fullName: string;
  positionTitle?: string;
  departmentName?: string;
  managerName?: string;
}

interface Position {
  positionID: number;
  positionTitle: string;
}

interface Manager {
  employeeID: number;
  fullName: string;
}

interface EmployeeFormData {
  employeeCode: string;
  firstName: string;
  lastName: string;
  positionID: string;
  managerID: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  hireDate: string;
  workerCategory: string;
}

type SortField = 'fullName' | 'employeeCode' | 'positionTitle' | 'departmentName' | 'managerName';
type SortDirection = 'asc' | 'desc';

const Employees = () => {
  const { canCreate, canRead, canUpdate, canDelete, loading: permissionsLoading, hasAnyPermission } = useModulePermissions('EMPLOYEES');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('fullName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [formData, setFormData] = useState<EmployeeFormData>({
    employeeCode: '',
    firstName: '',
    lastName: '',
    positionID: '',
    managerID: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    hireDate: '',
    workerCategory: ''
  });
  const [errors, setErrors] = useState<Partial<EmployeeFormData>>({});
  
  // Column filters state
  const [columnFilters, setColumnFilters] = useState<{
    fullName: string[];
    employeeCode: string[];
    positionTitle: string[];
    departmentName: string[];
    managerName: string[];
  }>({
    fullName: [],
    employeeCode: [],
    positionTitle: [],
    departmentName: [],
    managerName: []
  });
  
  // Temp filters for the dropdown (before Apply is clicked)
  const [tempFilters, setTempFilters] = useState<{
    fullName: string[];
    employeeCode: string[];
    positionTitle: string[];
    departmentName: string[];
    managerName: string[];
  }>({
    fullName: [],
    employeeCode: [],
    positionTitle: [],
    departmentName: [],
    managerName: []
  });
  
  // Track which filter dropdown is open
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const filterRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Search term within filter dropdowns
  const [filterSearchTerm, setFilterSearchTerm] = useState<string>('');

  // Helper function to get current employee ID from localStorage
  const getCurrentEmployeeId = (): number | null => {
    const currentEmployee = localStorage.getItem('currentEmployee');
    return currentEmployee ? JSON.parse(currentEmployee).employeeID : null;
  };

  useEffect(() => {
    if (canRead) {
      fetchEmployees();
      fetchPositions();
      fetchManagers();
    }
  }, [canRead]);

  // Refresh managers when modal opens for editing
  useEffect(() => {
    if (showModal && editingEmployee) {
      fetchManagers();
    }
  }, [showModal, editingEmployee]);

  // Update form data when managers are loaded and we're editing
  useEffect(() => {
    if (editingEmployee && managers.length > 0 && showModal) {
      setFormData(prev => ({
        ...prev,
        managerID: editingEmployee.managerID?.toString() || ''
      }));
    }
  }, [managers, editingEmployee, showModal]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openFilter) {
        const filterElement = filterRefs.current[openFilter];
        if (filterElement && !filterElement.contains(event.target as Node)) {
          setOpenFilter(null);
          // Reset temp filters to current filters when closing without applying
          setTempFilters({ ...columnFilters });
          setFilterSearchTerm('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openFilter, columnFilters]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(getApiUrl('employees'));
      console.log('Employees response:', response.data);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await axios.get(getApiUrl('positions'));
      setPositions(response.data);
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await axios.get(getApiUrl('employees/managers'));
      console.log('Managers response:', response.data);
      setManagers(response.data);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete) {
      alert('You do not have permission to delete employees.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        const currentEmployeeId = getCurrentEmployeeId();
        const url = currentEmployeeId 
          ? `${getApiUrl(`employees/${id}`)}?modifiedBy=${currentEmployeeId}`
          : getApiUrl(`employees/${id}`);
        await axios.delete(url);
        fetchEmployees();
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<EmployeeFormData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length > 100) {
      newErrors.firstName = 'First name must be 100 characters or less';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length > 100) {
      newErrors.lastName = 'Last name must be 100 characters or less';
    }

    if (!formData.positionID.trim()) {
      newErrors.positionID = 'Position is required';
    }

    if (formData.employeeCode.trim().length > 20) {
      newErrors.employeeCode = 'Employee code must be 20 characters or less';
    }

    if (formData.gender.trim().length > 20) {
      newErrors.gender = 'Gender must be 20 characters or less';
    }

    if (formData.phone.trim().length > 20) {
      newErrors.phone = 'Phone must be 20 characters or less';
    }

    if (formData.email.trim().length > 100) {
      newErrors.email = 'Email must be 100 characters or less';
    }

    // Email validation
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check permissions before allowing submit
    if (editingEmployee && !canUpdate) {
      alert('You do not have permission to update employees.');
      return;
    }
    
    if (!editingEmployee && !canCreate) {
      alert('You do not have permission to create employees.');
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const currentEmployeeId = getCurrentEmployeeId();
      const employeeData = {
        employeeCode: formData.employeeCode.trim() || null,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        positionID: parseInt(formData.positionID),
        managerID: formData.managerID.trim() ? parseInt(formData.managerID) : null,
        dateOfBirth: formData.dateOfBirth.trim() || null,
        gender: formData.gender.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        hireDate: formData.hireDate.trim() || null,
        workerCategory: formData.workerCategory.trim() || null,
        isActive: true,
        createdDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        modifiedBy: currentEmployeeId // Added
      };

      if (editingEmployee) {
        // Update existing employee
        await axios.put(getApiUrl(`employees/${editingEmployee.employeeID}`), {
          ...employeeData,
          employeeID: editingEmployee.employeeID,
          createdDate: editingEmployee.createdDate // Preserve original creation date
        });
      } else {
        // Create new employee
        await axios.post(getApiUrl('employees'), employeeData);
      }
      
      // Reset form and close modal
      setFormData({
        employeeCode: '',
        firstName: '',
        lastName: '',
        positionID: '',
        managerID: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        email: '',
        hireDate: '',
        workerCategory: ''
      });
      setErrors({});
      setShowModal(false);
      setEditingEmployee(null);
      
      // Refresh the employees list
      fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      alert(`Failed to ${editingEmployee ? 'update' : 'create'} employee. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof EmployeeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setFormData({
      employeeCode: '',
      firstName: '',
      lastName: '',
      positionID: '',
      managerID: '',
      dateOfBirth: '',
      gender: '',
      phone: '',
      email: '',
      hireDate: '',
      workerCategory: ''
    });
    setErrors({});
  };

  const handleEditEmployee = async (employee: Employee) => {
    console.log('Editing employee:', employee);
    console.log('Current managers:', managers);
    console.log('Employee managerID:', employee.managerID);
    
    // Ensure managers are loaded
    if (managers.length === 0) {
      console.log('Managers not loaded, fetching...');
      await fetchManagers();
    }
    
    setEditingEmployee(employee);
    setFormData({
      employeeCode: employee.employeeCode || '',
      firstName: employee.firstName,
      lastName: employee.lastName,
      positionID: employee.positionID.toString(),
      managerID: employee.managerID?.toString() || '',
      dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('en-CA') : '',
      gender: employee.gender || '',
      phone: employee.phone || '',
      email: employee.email || '',
      hireDate: employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('en-CA') : '',
      workerCategory: employee.workerCategory || ''
    });
    console.log('Form data set with managerID:', employee.managerID?.toString() || '');
    setShowModal(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  // Get unique values for a column
  const getUniqueColumnValues = (field: keyof typeof columnFilters): string[] => {
    const values = employees
      .map(emp => emp[field] || '-')
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
            {/* Search input */}
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
            
            {/* Checkbox list */}
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
            
            {/* Action buttons */}
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

  const filteredEmployees = employees
    .filter(employee => {
      // Global search filter
      const matchesSearch = searchTerm === '' || 
        employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.workerCategory?.toLowerCase().includes(searchTerm.toLowerCase());

      // Column filters
      const matchesFullName = columnFilters.fullName.length === 0 || 
        columnFilters.fullName.includes(employee.fullName || '-');
      
      const matchesEmployeeCode = columnFilters.employeeCode.length === 0 || 
        columnFilters.employeeCode.includes(employee.employeeCode || '-');
      
      const matchesPosition = columnFilters.positionTitle.length === 0 || 
        columnFilters.positionTitle.includes(employee.positionTitle || '-');
      
      const matchesDepartment = columnFilters.departmentName.length === 0 || 
        columnFilters.departmentName.includes(employee.departmentName || '-');
      
      const matchesManager = columnFilters.managerName.length === 0 || 
        columnFilters.managerName.includes(employee.managerName || '-');

      return matchesSearch && matchesFullName && matchesEmployeeCode && 
             matchesPosition && matchesDepartment && matchesManager;
    })
    .sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      const comparison = aValue.toString().localeCompare(bValue.toString());
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Show loading state for permissions
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading permissions...</div>
      </div>
    );
  }

  // Check if user has any permission to access this module
  if (!hasAnyPermission) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-2">Access Denied</div>
          <div className="text-gray-600">You do not have permission to access Employee Management.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading employees...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Employees</h2>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Mobile Cards View */}
      <div className="block lg:hidden">
        <div className="space-y-4">
          {filteredEmployees.map((employee) => (
            <div key={employee.employeeID} className="bg-white rounded-lg shadow p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{employee.fullName}</h3>
                  <p className="text-sm text-gray-500">{employee.employeeCode || 'No Code'}</p>
                </div>
                <div className="flex space-x-2">
                  {canUpdate && (
                    <button
                      onClick={() => handleEditEmployee(employee)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(employee.employeeID)}
                      className="text-red-600 hover:text-red-900 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Position:</span>
                  <p className="text-gray-900">{employee.positionTitle || '-'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Department:</span>
                  <p className="text-gray-900">{employee.departmentName || '-'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Manager:</span>
                  <p className="text-gray-900">{employee.managerName || '-'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-900">{employee.email || '-'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <p className="text-gray-900">{employee.phone || '-'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <div className="max-h-[calc(100vh-250px)] overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 w-16">
                  No.
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => handleSort('fullName')}
                    >
                      <span>Employee</span>
                      {getSortIcon('fullName')}
                    </div>
                    {renderFilterDropdown('fullName')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => handleSort('employeeCode')}
                    >
                      <span>ID</span>
                      {getSortIcon('employeeCode')}
                    </div>
                    {renderFilterDropdown('employeeCode')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => handleSort('positionTitle')}
                    >
                      <span>Position</span>
                      {getSortIcon('positionTitle')}
                    </div>
                    {renderFilterDropdown('positionTitle')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                >
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
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => handleSort('managerName')}
                    >
                      <span>Manager</span>
                      {getSortIcon('managerName')}
                    </div>
                    {renderFilterDropdown('managerName')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee, index) => (
                <tr key={employee.employeeID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 text-left">
                        {employee.fullName}
                      </div>
                      <div className="text-sm text-gray-500 text-left">
                        {employee.gender} • {employee.dateOfBirth && new Date(employee.dateOfBirth).toLocaleDateString('en-CA')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                    {employee.employeeCode || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                    {employee.positionTitle || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                    {employee.departmentName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                    {employee.managerName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 text-left">{employee.email || '-'}</div>
                    <div className="text-sm text-gray-500 text-left">{employee.phone || '-'}</div>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1">
                      {canUpdate && (
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(employee.employeeID)}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No employees found.
        </div>
      )}

      {/* Add/Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter first name"
                    maxLength={100}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter last name"
                    maxLength={100}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="employeeCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Code
                </label>
                <input
                  type="text"
                  id="employeeCode"
                  value={formData.employeeCode}
                  onChange={(e) => handleInputChange('employeeCode', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.employeeCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter employee code"
                  maxLength={20}
                />
                {errors.employeeCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.employeeCode}</p>
                )}
              </div>

              <div>
                <label htmlFor="positionID" className="block text-sm font-medium text-gray-700 mb-1">
                  Position *
                </label>
                <select
                  id="positionID"
                  value={formData.positionID}
                  onChange={(e) => handleInputChange('positionID', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.positionID ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a position</option>
                  {positions.map((position) => (
                    <option key={position.positionID} value={position.positionID}>
                      {position.positionTitle}
                    </option>
                  ))}
                </select>
                {errors.positionID && (
                  <p className="mt-1 text-sm text-red-600">{errors.positionID}</p>
                )}
              </div>

              <div>
                <label htmlFor="managerID" className="block text-sm font-medium text-gray-700 mb-1">
                  Manager
                </label>
                <select
                  id="managerID"
                  value={formData.managerID}
                  onChange={(e) => handleInputChange('managerID', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a manager (optional)</option>
                  {managers
                    .filter(manager => !editingEmployee || manager.employeeID !== editingEmployee.employeeID)
                    .map((manager) => (
                      <option key={manager.employeeID} value={manager.employeeID}>
                        {manager.fullName}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.gender ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number"
                    maxLength={20}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                    maxLength={100}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="hireDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Hire Date
                </label>
                <input
                  type="date"
                  id="hireDate"
                  value={formData.hireDate}
                  onChange={(e) => handleInputChange('hireDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="workerCategory" className="block text-sm font-medium text-gray-700 mb-1">
                  Worker Category
                </label>
                <select
                  id="workerCategory"
                  value={formData.workerCategory}
                  onChange={(e) => handleInputChange('workerCategory', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select worker category</option>
                  <option value="White collar">White collar</option>
                  <option value="Blue collar">Blue collar</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (editingEmployee ? 'Updating...' : 'Creating...') : (editingEmployee ? 'Update Employee' : 'Create Employee')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees; 