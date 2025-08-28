import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
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

const JobFunctions = () => {
  const [jobFunctions, setJobFunctions] = useState<JobFunction[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingJobFunction, setEditingJobFunction] = useState<JobFunction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<JobFunctionFormData>({
    jobFunctionName: '',
    jobFunctionDescription: '',
    departmentID: ''
  });
  const [errors, setErrors] = useState<Partial<JobFunctionFormData>>({});

  // Get current employee ID from localStorage
  const getCurrentEmployeeId = (): number | null => {
    const currentEmployee = localStorage.getItem('currentEmployee');
    return currentEmployee ? JSON.parse(currentEmployee).employeeID : null;
  };

  useEffect(() => {
    fetchJobFunctions();
    fetchDepartments();
  }, []);

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

  const filteredJobFunctions = jobFunctions.filter(jf =>
    jf.jobFunctionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (jf.jobFunctionDescription && jf.jobFunctionDescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (jf.departmentName && jf.departmentName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Function Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobFunctions.map((jobFunction) => (
                <tr key={jobFunction.jobFunctionID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {jobFunction.jobFunctionName}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {jobFunction.jobFunctionDescription || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
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
                    <div className="text-sm text-gray-900">
                      {jobFunction.modifiedByEmployeeName || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(jobFunction.modifiedDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditJobFunction(jobFunction)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(jobFunction.jobFunctionID)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={16} />
                    </button>
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
