import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config/api';

interface JobFunction {
  jobFunctionID: number;
  jobFunctionName: string;
  jobFunctionDescription?: string;
  departmentID?: number;
  departmentName?: string;
  isActive: boolean;
  createdDate: string;
  modifiedDate: string;
  modifiedBy?: number;
  modifiedByEmployeeName?: string;
}

interface Department {
  departmentID: number;
  departmentName: string;
}

interface JobFunctionFormData {
  jobFunctionName: string;
  jobFunctionDescription: string;
  departmentID: string;
}

type SortField = 'jobFunctionName' | 'departmentName';
type SortDirection = 'asc' | 'desc';

const JobFunctions = () => {
  const [jobFunctions, setJobFunctions] = useState<JobFunction[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingJobFunction, setEditingJobFunction] = useState<JobFunction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('jobFunctionName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [formData, setFormData] = useState<JobFunctionFormData>({
    jobFunctionName: '',
    jobFunctionDescription: '',
    departmentID: ''
  });
  const [errors, setErrors] = useState<Partial<JobFunctionFormData>>({});
  
  // Column filters state
  const [columnFilters, setColumnFilters] = useState<{
    jobFunctionName: string[];
    departmentName: string[];
  }>({
    jobFunctionName: [],
    departmentName: []
  });
  
  // Temp filters for the dropdown (before Apply is clicked)
  const [tempFilters, setTempFilters] = useState<{
    jobFunctionName: string[];
    departmentName: string[];
  }>({
    jobFunctionName: [],
    departmentName: []
  });
  
  // Track which filter dropdown is open
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const filterRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Search term within filter dropdowns
  const [filterSearchTerm, setFilterSearchTerm] = useState<string>('');

  // Get current employee ID from localStorage
  const getCurrentEmployeeId = (): number | null => {
    const currentEmployee = localStorage.getItem('currentEmployee');
    return currentEmployee ? JSON.parse(currentEmployee).employeeID : null;
  };

  useEffect(() => {
    fetchJobFunctions();
    fetchDepartments();
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

  const fetchJobFunctions = async () => {
    try {
      const response = await axios.get(getApiUrl('jobfunctions'));
      setJobFunctions(response.data);
    } catch (error) {
      console.error('Error fetching job functions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(getApiUrl('departments'));
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this job function?')) {
      return;
    }

    const currentEmployeeId = getCurrentEmployeeId();
    if (!currentEmployeeId) {
      alert('Please log in to perform this action.');
      return;
    }

    try {
      await axios.delete(getApiUrl(`jobfunctions/${id}?modifiedBy=${currentEmployeeId}`));
      setJobFunctions(jobFunctions.filter(jf => jf.jobFunctionID !== id));
      alert('Job function deleted successfully!');
    } catch (error) {
      console.error('Error deleting job function:', error);
      alert('Failed to delete job function.');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<JobFunctionFormData> = {};

    if (!formData.jobFunctionName.trim()) {
      newErrors.jobFunctionName = 'Job Function Name is required';
    }

    if (!formData.departmentID) {
      newErrors.departmentID = 'Department is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const currentEmployeeId = getCurrentEmployeeId();
    if (!currentEmployeeId) {
      alert('Please log in to perform this action.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingJobFunction) {
        // Update existing job function
        await axios.put(getApiUrl(`jobfunctions/${editingJobFunction.jobFunctionID}`), {
          ...formData,
          modifiedBy: currentEmployeeId
        });
        alert('Job function updated successfully!');
      } else {
        // Create new job function
        await axios.post(getApiUrl('jobfunctions'), {
          ...formData,
          modifiedBy: currentEmployeeId
        });
        alert('Job function created successfully!');
      }
      
      setFormData({
        jobFunctionName: '',
        jobFunctionDescription: '',
        departmentID: ''
      });
      setShowModal(false);
      setEditingJobFunction(null);
      fetchJobFunctions();
    } catch (error) {
      console.error('Error saving job function:', error);
      alert('Failed to save job function.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof JobFunctionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingJobFunction(null);
    setFormData({
      jobFunctionName: '',
      jobFunctionDescription: '',
      departmentID: ''
    });
    setErrors({});
  };

  const handleEditJobFunction = (jobFunction: JobFunction) => {
    setEditingJobFunction(jobFunction);
    setFormData({
      jobFunctionName: jobFunction.jobFunctionName,
      jobFunctionDescription: jobFunction.jobFunctionDescription || '',
      departmentID: jobFunction.departmentID?.toString() || ''
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingJobFunction(null);
    setFormData({
      jobFunctionName: '',
      jobFunctionDescription: '',
      departmentID: ''
    });
    setErrors({});
    setShowModal(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
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
    const values = jobFunctions
      .map(jf => jf[field] || '-')
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

  const filteredJobFunctions = jobFunctions
    .filter(jf => {
      // Global search filter
      const matchesSearch = searchTerm === '' || 
        jf.jobFunctionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (jf.jobFunctionDescription && jf.jobFunctionDescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (jf.departmentName && jf.departmentName.toLowerCase().includes(searchTerm.toLowerCase()));

      // Column filters
      const matchesJobFunctionName = columnFilters.jobFunctionName.length === 0 || 
        columnFilters.jobFunctionName.includes(jf.jobFunctionName || '-');
      
      const matchesDepartmentName = columnFilters.departmentName.length === 0 || 
        columnFilters.departmentName.includes(jf.departmentName || '-');

      return matchesSearch && matchesJobFunctionName && matchesDepartmentName;
    })
    .sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      const comparison = aValue.toString().localeCompare(bValue.toString());
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Job Functions</h2>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add Job Function
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search job functions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        {searchTerm && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Job Functions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => handleSort('jobFunctionName')}
                    >
                      <span>Job Function Name</span>
                      {getSortIcon('jobFunctionName')}
                    </div>
                    {renderFilterDropdown('jobFunctionName')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modified By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modified Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobFunctions.map((jobFunction) => (
                <tr key={jobFunction.jobFunctionID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-left font-medium text-gray-900">
                      {jobFunction.jobFunctionName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-left text-gray-900">
                      {jobFunction.departmentName || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      jobFunction.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {jobFunction.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-left text-gray-900">
                      {jobFunction.modifiedByEmployeeName || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-left text-gray-900">
                      {new Date(jobFunction.modifiedDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditJobFunction(jobFunction)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                    >
                      <Edit className="w-3 h-3" />
                      </button>
                    <button
                      onClick={() => handleDelete(jobFunction.jobFunctionID)}
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

      {/* Empty State */}
      {filteredJobFunctions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            {searchTerm ? 'No job functions found matching your search.' : 'No job functions found.'}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingJobFunction ? 'Edit Job Function' : 'Create New Job Function'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Function Name *
                </label>
                <input
                  type="text"
                  value={formData.jobFunctionName}
                  onChange={(e) => handleInputChange('jobFunctionName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.jobFunctionName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter job function name"
                />
                {errors.jobFunctionName && (
                  <p className="text-red-500 text-sm mt-1">{errors.jobFunctionName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.jobFunctionDescription}
                  onChange={(e) => handleInputChange('jobFunctionDescription', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter job function description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  value={formData.departmentID}
                  onChange={(e) => handleInputChange('departmentID', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.departmentID ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a department</option>
                  {departments.map((dept) => (
                    <option key={dept.departmentID} value={dept.departmentID}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
                {errors.departmentID && (
                  <p className="text-red-500 text-sm mt-1">{errors.departmentID}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editingJobFunction ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobFunctions;
