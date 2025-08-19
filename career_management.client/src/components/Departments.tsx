import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config/api';

interface Department {
  departmentID: number;
  departmentName: string;
  description?: string;
  companyID?: number;
  managerID?: number;
  isActive: boolean;
  createdDate: string;
  modifiedDate?: string;
  modifiedBy?: number;
  modifiedByEmployeeName?: string;
  companyName?: string;
  managerName?: string;
}

interface Company {
  companyID: number;
  companyName: string;
}

interface Employee {
  employeeID: number;
  fullName: string;
}

interface DepartmentFormData {
  departmentName: string;
  description: string;
  companyID: string;
  managerID: string;
}

const Departments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<DepartmentFormData>({
    departmentName: '',
    description: '',
    companyID: '',
    managerID: ''
  });
  const [errors, setErrors] = useState<Partial<DepartmentFormData>>({});

  useEffect(() => {
    fetchDepartments();
    fetchCompanies();
    fetchEmployees();
  }, []);

  const getCurrentEmployeeId = (): number | null => {
    try {
      const currentEmployee = localStorage.getItem('currentEmployee');
      if (currentEmployee) {
        const employee = JSON.parse(currentEmployee);
        return employee.employeeID || null;
      }
    } catch (error) {
      console.error('Error parsing currentEmployee from localStorage:', error);
    }
    return null;
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(getApiUrl('departments'));
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(getApiUrl('companies'));
      setCompanies(response.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(getApiUrl('employees'));
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        const currentEmployeeId = getCurrentEmployeeId();
        const url = currentEmployeeId 
          ? getApiUrl(`departments/${id}?modifiedBy=${currentEmployeeId}`)
          : getApiUrl(`departments/${id}`);
        
        await axios.delete(url);
        fetchDepartments();
      } catch (error) {
        console.error('Error deleting department:', error);
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<DepartmentFormData> = {};

    if (!formData.departmentName.trim()) {
      newErrors.departmentName = 'Department name is required';
    } else if (formData.departmentName.trim().length > 100) {
      newErrors.departmentName = 'Department name must be 100 characters or less';
    }

    if (formData.description.trim().length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    if (formData.companyID.trim() && isNaN(Number(formData.companyID))) {
      newErrors.companyID = 'Company ID must be a valid number';
    }

    if (formData.managerID.trim() && isNaN(Number(formData.managerID))) {
      newErrors.managerID = 'Manager ID must be a valid number';
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
      const currentEmployeeId = getCurrentEmployeeId();
      const departmentData = {
        departmentName: formData.departmentName.trim(),
        description: formData.description.trim() || null,
        companyID: formData.companyID.trim() ? parseInt(formData.companyID) : null,
        managerID: formData.managerID.trim() ? parseInt(formData.managerID) : null,
        isActive: true,
        createdDate: new Date().toISOString(),
        modifiedBy: currentEmployeeId
      };

      if (editingDepartment) {
        // Update existing department
        await axios.put(getApiUrl(`departments/${editingDepartment.departmentID}`), {
          ...departmentData,
          departmentID: editingDepartment.departmentID,
          createdDate: editingDepartment.createdDate // Preserve original creation date
        });
      } else {
        // Create new department
        await axios.post(getApiUrl('departments'), departmentData);
      }
      
      // Reset form and close modal
      setFormData({
        departmentName: '',
        description: '',
        companyID: '',
        managerID: ''
      });
      setErrors({});
      setShowModal(false);
      setEditingDepartment(null);
      
      // Refresh the departments list
      fetchDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
      alert(`Failed to ${editingDepartment ? 'update' : 'create'} department. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof DepartmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDepartment(null);
    setFormData({
      departmentName: '',
      description: '',
      companyID: '',
      managerID: ''
    });
    setErrors({});
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      departmentName: department.departmentName,
      description: department.description || '',
      companyID: department.companyID?.toString() || '',
      managerID: department.managerID?.toString() || ''
    });
    setShowModal(true);
  };

  const filteredDepartments = departments.filter(department =>
    department.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading departments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Departments</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search departments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Mobile Cards View */}
      <div className="block lg:hidden">
        <div className="space-y-4">
          {filteredDepartments.map((department) => (
            <div key={department.departmentID} className="bg-white rounded-lg shadow p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{department.departmentName}</h3>
                  <p className="text-sm text-gray-500">{department.description || 'No description'}</p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button 
                    onClick={() => handleEditDepartment(department)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(department.departmentID)}
                    className="text-red-600 hover:text-red-900 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Company:</span>
                  <p className="text-gray-900">{department.companyName || '-'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Manager:</span>
                  <p className="text-gray-900">{department.managerName || '-'}</p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-700">Created:</span>
                  <p className="text-gray-900">{new Date(department.createdDate).toLocaleDateString()}</p>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Department Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDepartments.map((department) => (
                <tr key={department.departmentID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">
                    {department.departmentName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                    {department.companyName || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-left">
                    {department.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                    {department.managerName || '-'}
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => handleEditDepartment(department)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(department.departmentID)}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredDepartments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No departments found.
        </div>
      )}

      {/* Add Department Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingDepartment ? 'Edit Department' : 'Add New Department'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="departmentName" className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  id="departmentName"
                  value={formData.departmentName}
                  onChange={(e) => handleInputChange('departmentName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.departmentName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter department name"
                  maxLength={100}
                />
                {errors.departmentName && (
                  <p className="mt-1 text-sm text-red-600">{errors.departmentName}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter department description"
                  rows={3}
                  maxLength={500}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.description.length}/500 characters
                </p>
              </div>

              <div>
                <label htmlFor="companyID" className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <select
                  id="companyID"
                  value={formData.companyID}
                  onChange={(e) => handleInputChange('companyID', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.companyID ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a company (optional)</option>
                  {companies.map((company) => (
                    <option key={company.companyID} value={company.companyID}>
                      {company.companyName}
                    </option>
                  ))}
                </select>
                {errors.companyID && (
                  <p className="mt-1 text-sm text-red-600">{errors.companyID}</p>
                )}
              </div>

              <div>
                <label htmlFor="managerID" className="block text-sm font-medium text-gray-700 mb-1">
                  Manager ID
                </label>
                <select
                  id="managerID"
                  value={formData.managerID}
                  onChange={(e) => handleInputChange('managerID', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.managerID ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a manager (optional)</option>
                  {employees.map((employee) => (
                    <option key={employee.employeeID} value={employee.employeeID}>
                      {employee.fullName}
                    </option>
                  ))}
                </select>
                {errors.managerID && (
                  <p className="mt-1 text-sm text-red-600">{errors.managerID}</p>
                )}
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
                  {submitting ? (editingDepartment ? 'Updating...' : 'Creating...') : (editingDepartment ? 'Update Department' : 'Create Department')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments; 