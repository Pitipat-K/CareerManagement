import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config/api';

interface JobGrade {
  jobGradeID: number;
  jobGradeName: string;
  jobGradeDescription?: string;
  jobGradeLevel?: number;
  isActive: boolean;
}

interface Position {
  positionID: number;
  positionTitle: string;
  positionDescription?: string;
  experienceRequirement?: number;
  jobGroup?: string;
  jobFunction?: string;
  jobGradeID?: number;
  jobGradeName?: string;
  departmentID?: number;
  departmentName?: string;
  leadershipID: number;
  leadershipLevel?: string;
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

interface LeadershipLevel {
  leadershipID: number;
  levelName: string;
}

interface PositionFormData {
  positionTitle: string;
  positionDescription: string;
  experienceRequirement: string;
  jobGroup: string;
  jobFunction: string;
  jobGradeID: string;
  departmentID: string;
  leadershipID: string;
}

const Positions = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leadershipLevels, setLeadershipLevels] = useState<LeadershipLevel[]>([]);
  const [jobGrades, setJobGrades] = useState<JobGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<PositionFormData>({
    positionTitle: '',
    positionDescription: '',
    experienceRequirement: '',
    jobGroup: '',
    jobFunction: '',
    jobGradeID: '',
    departmentID: '',
    leadershipID: ''
  });
  const [errors, setErrors] = useState<Partial<PositionFormData>>({});

  // Get current employee ID from localStorage
  const getCurrentEmployeeId = (): number | null => {
    const currentEmployee = localStorage.getItem('currentEmployee');
    return currentEmployee ? JSON.parse(currentEmployee).employeeID : null;
  };

  useEffect(() => {
    fetchPositions();
    fetchDepartments();
    fetchLeadershipLevels();
    fetchJobGrades();
  }, []);

  const fetchPositions = async () => {
    try {
      const response = await axios.get(getApiUrl('positions'));
      setPositions(response.data);
    } catch (error) {
      console.error('Error fetching positions:', error);
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

  const fetchLeadershipLevels = async () => {
    try {
      const response = await axios.get(getApiUrl('leadershiplevels'));
      setLeadershipLevels(response.data);
    } catch (error) {
      console.error('Error fetching leadership levels:', error);
    }
  };

  const fetchJobGrades = async () => {
    try {
      const response = await axios.get(getApiUrl('positions/jobgrades'));
      setJobGrades(response.data);
    } catch (error) {
      console.error('Error fetching job grades:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this position?')) {
      try {
        const currentEmployeeId = getCurrentEmployeeId();
        if (!currentEmployeeId) {
          alert('Please log in to perform this action.');
          return;
        }
        
        await axios.delete(getApiUrl(`positions/${id}?modifiedBy=${currentEmployeeId}`));
        fetchPositions();
      } catch (error) {
        console.error('Error deleting position:', error);
        alert('Failed to delete position. Please try again.');
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PositionFormData> = {};

    if (!formData.positionTitle.trim()) {
      newErrors.positionTitle = 'Position title is required';
    } else if (formData.positionTitle.trim().length > 200) {
      newErrors.positionTitle = 'Position title must be 200 characters or less';
    }

    if (formData.positionDescription.trim().length > 1000) {
      newErrors.positionDescription = 'Position description must be 1000 characters or less';
    }

    if (formData.experienceRequirement.trim() && isNaN(Number(formData.experienceRequirement))) {
      newErrors.experienceRequirement = 'Experience requirement must be a valid number';
    }

    if (formData.jobGroup.trim().length > 100) {
      newErrors.jobGroup = 'Job group must be 100 characters or less';
    }

    if (formData.jobFunction.trim().length > 200) {
      newErrors.jobFunction = 'Job function must be 200 characters or less';
    }

    if (formData.jobGradeID.trim() && isNaN(Number(formData.jobGradeID))) {
      newErrors.jobGradeID = 'Job grade must be a valid selection';
    }

    if (formData.departmentID.trim() && isNaN(Number(formData.departmentID))) {
      newErrors.departmentID = 'Department ID must be a valid number';
    }

    if (!formData.leadershipID.trim()) {
      newErrors.leadershipID = 'Leadership level is required';
    } else if (isNaN(Number(formData.leadershipID))) {
      newErrors.leadershipID = 'Leadership level must be a valid number';
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
      const positionData = {
        positionTitle: formData.positionTitle.trim(),
        positionDescription: formData.positionDescription.trim() || null,
        experienceRequirement: formData.experienceRequirement.trim() ? parseInt(formData.experienceRequirement) : null,
        jobGroup: formData.jobGroup.trim() || null,
        jobFunction: formData.jobFunction.trim() || null,
        jobGradeID: formData.jobGradeID.trim() ? parseInt(formData.jobGradeID) : null,
        departmentID: formData.departmentID.trim() ? parseInt(formData.departmentID) : null,
        leadershipID: formData.leadershipID.trim() ? parseInt(formData.leadershipID) : 1,
        isActive: true,
        createdDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        modifiedBy: currentEmployeeId
      };

      if (editingPosition) {
        // Update existing position
        await axios.put(getApiUrl(`positions/${editingPosition.positionID}`), {
          ...positionData,
          positionID: editingPosition.positionID,
          createdDate: editingPosition.createdDate // Preserve original creation date
        });
      } else {
        // Create new position
        await axios.post(getApiUrl('positions'), positionData);
      }
      
      // Reset form and close modal
      setFormData({
        positionTitle: '',
        positionDescription: '',
        experienceRequirement: '',
        jobGroup: '',
        jobFunction: '',
        jobGradeID: '',
        departmentID: '',
        leadershipID: ''
      });
      setErrors({});
      setShowModal(false);
      setEditingPosition(null);
      
      // Refresh the positions list
      fetchPositions();
    } catch (error) {
      console.error('Error saving position:', error);
      alert(`Failed to ${editingPosition ? 'update' : 'create'} position. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof PositionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPosition(null);
    setFormData({
      positionTitle: '',
      positionDescription: '',
      experienceRequirement: '',
      jobGroup: '',
      jobFunction: '',
      jobGradeID: '',
      departmentID: '',
      leadershipID: ''
    });
    setErrors({});
  };

  const handleEditPosition = (position: Position) => {
    setEditingPosition(position);
    setFormData({
      positionTitle: position.positionTitle,
      positionDescription: position.positionDescription || '',
      experienceRequirement: position.experienceRequirement?.toString() || '',
      jobGroup: position.jobGroup || '',
      jobFunction: position.jobFunction || '',
      jobGradeID: position.jobGradeID?.toString() || '',
      departmentID: position.departmentID?.toString() || '',
      leadershipID: position.leadershipID?.toString() || ''
    });
    setShowModal(true);
  };

  const filteredPositions = positions.filter(position =>
    position.positionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    position.jobGroup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    position.jobFunction?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading positions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Positions</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Position</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search positions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Mobile Cards View */}
      <div className="block lg:hidden">
        <div className="space-y-4">
          {filteredPositions.map((position) => (
            <div key={position.positionID} className="bg-white rounded-lg shadow p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{position.positionTitle}</h3>
                  <p className="text-sm text-gray-500">{position.positionDescription || 'No description'}</p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button 
                    onClick={() => handleEditPosition(position)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(position.positionID)}
                    className="text-red-600 hover:text-red-900 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Department:</span>
                  <p className="text-gray-900">{position.departmentName || '-'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Job Group:</span>
                  <p className="text-gray-900">{position.jobGroup || '-'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Job Grade:</span>
                  <p className="text-gray-900">{position.jobGradeName || '-'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Experience:</span>
                  <p className="text-gray-900">{position.experienceRequirement ? `${position.experienceRequirement} years` : '-'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Leadership Level:</span>
                  <p className="text-gray-900">{position.leadershipLevel || '-'}</p>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Position Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Job Group
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Job Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Leadership Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPositions.map((position, index) => (
                <tr key={position.positionID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 text-left">
                        {position.positionTitle}
                      </div>
                      <div className="text-sm text-gray-500 text-left">
                        {position.positionDescription}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                    {position.departmentName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                    {position.jobGroup || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {position.jobGradeName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                    {position.leadershipLevel || '-'}
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => handleEditPosition(position)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(position.positionID)}
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

      {filteredPositions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No positions found.
        </div>
      )}

      {/* Add Position Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingPosition ? 'Edit Position' : 'Add New Position'}
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
                <label htmlFor="positionTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  Position Title *
                </label>
                <input
                  type="text"
                  id="positionTitle"
                  value={formData.positionTitle}
                  onChange={(e) => handleInputChange('positionTitle', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.positionTitle ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter position title"
                  maxLength={200}
                />
                {errors.positionTitle && (
                  <p className="mt-1 text-sm text-red-600">{errors.positionTitle}</p>
                )}
              </div>

              <div>
                <label htmlFor="positionDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Position Description
                </label>
                <textarea
                  id="positionDescription"
                  value={formData.positionDescription}
                  onChange={(e) => handleInputChange('positionDescription', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.positionDescription ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter position description"
                  rows={3}
                  maxLength={1000}
                />
                {errors.positionDescription && (
                  <p className="mt-1 text-sm text-red-600">{errors.positionDescription}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.positionDescription.length}/1000 characters
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="experienceRequirement" className="block text-sm font-medium text-gray-700 mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    id="experienceRequirement"
                    value={formData.experienceRequirement}
                    onChange={(e) => handleInputChange('experienceRequirement', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.experienceRequirement ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Years"
                    min="0"
                  />
                  {errors.experienceRequirement && (
                    <p className="mt-1 text-sm text-red-600">{errors.experienceRequirement}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="jobGradeID" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Grade
                  </label>
                  <select
                    id="jobGradeID"
                    value={formData.jobGradeID}
                    onChange={(e) => handleInputChange('jobGradeID', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.jobGradeID ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a job grade</option>
                    {jobGrades.map((grade) => (
                      <option key={grade.jobGradeID} value={grade.jobGradeID}>
                        {grade.jobGradeName}
                      </option>
                    ))}
                  </select>
                  {errors.jobGradeID && (
                    <p className="mt-1 text-sm text-red-600">{errors.jobGradeID}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="jobGroup" className="block text-sm font-medium text-gray-700 mb-1">
                  Job Group
                </label>
                <input
                  type="text"
                  id="jobGroup"
                  value={formData.jobGroup}
                  onChange={(e) => handleInputChange('jobGroup', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.jobGroup ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter job group"
                  maxLength={100}
                />
                {errors.jobGroup && (
                  <p className="mt-1 text-sm text-red-600">{errors.jobGroup}</p>
                )}
              </div>

              <div>
                <label htmlFor="jobFunction" className="block text-sm font-medium text-gray-700 mb-1">
                  Job Function
                </label>
                <input
                  type="text"
                  id="jobFunction"
                  value={formData.jobFunction}
                  onChange={(e) => handleInputChange('jobFunction', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.jobFunction ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter job function"
                  maxLength={200}
                />
                {errors.jobFunction && (
                  <p className="mt-1 text-sm text-red-600">{errors.jobFunction}</p>
                )}
              </div>

              <div>
                <label htmlFor="departmentID" className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  id="departmentID"
                  value={formData.departmentID}
                  onChange={(e) => handleInputChange('departmentID', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.departmentID ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a department</option>
                  {departments.map((department) => (
                    <option key={department.departmentID} value={department.departmentID}>
                      {department.departmentName}
                    </option>
                  ))}
                </select>
                {errors.departmentID && (
                  <p className="mt-1 text-sm text-red-600">{errors.departmentID}</p>
                )}
              </div>

              <div>
                <label htmlFor="leadershipID" className="block text-sm font-medium text-gray-700 mb-1">
                  Leadership Level *
                </label>
                <select
                  id="leadershipID"
                  value={formData.leadershipID}
                  onChange={(e) => handleInputChange('leadershipID', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.leadershipID ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a leadership level</option>
                  {leadershipLevels.map((level) => (
                    <option key={level.leadershipID} value={level.leadershipID}>
                      {level.levelName}
                    </option>
                  ))}
                </select>
                {errors.leadershipID && (
                  <p className="mt-1 text-sm text-red-600">{errors.leadershipID}</p>
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
                  {submitting ? (editingPosition ? 'Updating...' : 'Creating...') : (editingPosition ? 'Update Position' : 'Create Position')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Positions; 