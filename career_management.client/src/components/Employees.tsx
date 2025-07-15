import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Search, X } from 'lucide-react';
import axios from 'axios';

interface Employee {
  employeeID: number;
  employeeCode?: string;
  firstName: string;
  lastName: string;
  positionID: number;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  hireDate?: string;
  createdDate: string;
  modifiedDate: string;
  isActive: boolean;
  fullName: string;
  positionTitle?: string;
  departmentName?: string;
}

interface Position {
  positionID: number;
  positionTitle: string;
}

interface EmployeeFormData {
  employeeCode: string;
  firstName: string;
  lastName: string;
  positionID: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  hireDate: string;
}

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormData>({
    employeeCode: '',
    firstName: '',
    lastName: '',
    positionID: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    hireDate: ''
  });
  const [errors, setErrors] = useState<Partial<EmployeeFormData>>({});

  useEffect(() => {
    fetchEmployees();
    fetchPositions();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('https://localhost:7026/api/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await axios.get('https://localhost:7026/api/positions');
      setPositions(response.data);
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await axios.delete(`https://localhost:7026/api/employees/${id}`);
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
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const employeeData = {
        employeeCode: formData.employeeCode.trim() || null,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        positionID: parseInt(formData.positionID),
        dateOfBirth: formData.dateOfBirth.trim() || null,
        gender: formData.gender.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        hireDate: formData.hireDate.trim() || null,
        isActive: true,
        createdDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString()
      };

      if (editingEmployee) {
        // Update existing employee
        await axios.put(`https://localhost:7026/api/employees/${editingEmployee.employeeID}`, {
          ...employeeData,
          employeeID: editingEmployee.employeeID,
          createdDate: editingEmployee.createdDate // Preserve original creation date
        });
      } else {
        // Create new employee
        await axios.post('https://localhost:7026/api/employees', employeeData);
      }
      
      // Reset form and close modal
      setFormData({
        employeeCode: '',
        firstName: '',
        lastName: '',
        positionID: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        email: '',
        hireDate: ''
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
      dateOfBirth: '',
      gender: '',
      phone: '',
      email: '',
      hireDate: ''
    });
    setErrors({});
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      employeeCode: employee.employeeCode || '',
      firstName: employee.firstName,
      lastName: employee.lastName,
      positionID: employee.positionID.toString(),
      dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('en-CA') : '',
      gender: employee.gender || '',
      phone: employee.phone || '',
      email: employee.email || '',
      hireDate: employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('en-CA') : ''
    });
    setShowModal(true);
  };

  const filteredEmployees = employees.filter(employee =>
    employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
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
                  <button
                    onClick={() => handleEditEmployee(employee)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(employee.employeeID)}
                    className="text-red-600 hover:text-red-900 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Employee
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  ID
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Position
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Department
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
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
                      <div className="text-sm font-medium text-gray-900">
                        {employee.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {employee.gender} • {employee.dateOfBirth && new Date(employee.dateOfBirth).toLocaleDateString('en-CA')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.employeeCode || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.positionTitle || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.departmentName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.email || '-'}</div>
                    <div className="text-sm text-gray-500">{employee.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditEmployee(employee)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.employeeID)}
                        className="text-red-600 hover:text-red-900"
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