import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import { useModulePermissions } from '../hooks/usePermissions';

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
  jobFunctionID?: number;
  jobFunctionName?: string;
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

interface JobFunction {
  jobFunctionID: number;
  jobFunctionName: string;
  jobFunctionDescription?: string;
  departmentID?: number;
}

interface PositionFormData {
  positionTitle: string;
  positionDescription: string;
  experienceRequirement: string;
  jobFunctionID: string;
  jobGradeID: string;
  departmentID: string;
  leadershipID: string;
}

type SortField = 'positionTitle' | 'departmentName' | 'jobFunctionName' | 'jobGradeName' | 'leadershipLevel';
type SortDirection = 'asc' | 'desc';

const Positions = () => {
  const { canCreate, canUpdate, canDelete, loading: permissionsLoading, hasAnyPermission } = useModulePermissions('POSITIONS');
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leadershipLevels, setLeadershipLevels] = useState<LeadershipLevel[]>([]);
  const [jobGrades, setJobGrades] = useState<JobGrade[]>([]);
  const [jobFunctions, setJobFunctions] = useState<JobFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('positionTitle');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [formData, setFormData] = useState<PositionFormData>({
    positionTitle: '',
    positionDescription: '',
    experienceRequirement: '',
    jobFunctionID: '',
    jobGradeID: '',
    departmentID: '',
    leadershipID: ''
  });
  const [errors, setErrors] = useState<Partial<PositionFormData>>({});
  
  // Column filters state
  const [columnFilters, setColumnFilters] = useState<{
    positionTitle: string[];
    departmentName: string[];
    jobFunctionName: string[];
    jobGradeName: string[];
    leadershipLevel: string[];
  }>({
    positionTitle: [],
    departmentName: [],
    jobFunctionName: [],
    jobGradeName: [],
    leadershipLevel: []
  });
  
  // Temp filters for the dropdown (before Apply is clicked)
  const [tempFilters, setTempFilters] = useState<{
    positionTitle: string[];
    departmentName: string[];
    jobFunctionName: string[];
    jobGradeName: string[];
    leadershipLevel: string[];
  }>({
    positionTitle: [],
    departmentName: [],
    jobFunctionName: [],
    jobGradeName: [],
    leadershipLevel: []
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
    fetchPositions();
    fetchDepartments();
    fetchLeadershipLevels();
    fetchJobGrades();
    fetchJobFunctions();
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

  const fetchJobFunctions = async () => {
    try {
      const response = await axios.get(getApiUrl('jobfunctions'));
      setJobFunctions(response.data);
    } catch (error) {
      console.error('Error fetching job functions:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete) {
      alert('You do not have permission to delete positions.');
      return;
    }

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

    if (formData.experienceRequirement && (parseInt(formData.experienceRequirement) < 0)) {
      newErrors.experienceRequirement = 'Experience requirement must be a positive number';
    }

    if (formData.jobFunctionID.trim() && isNaN(Number(formData.jobFunctionID))) {
      newErrors.jobFunctionID = 'Job function must be a valid selection';
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
    
    // Check permissions before allowing submit
    if (editingPosition && !canUpdate) {
      alert('You do not have permission to update positions.');
      return;
    }
    
    if (!editingPosition && !canCreate) {
      alert('You do not have permission to create positions.');
      return;
    }

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
        experienceRequirement: formData.experienceRequirement ? parseInt(formData.experienceRequirement) : null,
        jobFunctionID: formData.jobFunctionID ? parseInt(formData.jobFunctionID) : null,
        jobGradeID: formData.jobGradeID ? parseInt(formData.jobGradeID) : null,
        departmentID: formData.departmentID ? parseInt(formData.departmentID) : null,
        leadershipID: parseInt(formData.leadershipID),
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
        jobFunctionID: '',
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
      jobFunctionID: '',
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
      jobFunctionID: position.jobFunctionID?.toString() || '',
      jobGradeID: position.jobGradeID?.toString() || '',
      departmentID: position.departmentID?.toString() || '',
      leadershipID: position.leadershipID?.toString() || ''
    });
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
    const values = positions
      .map(pos => pos[field] || '-')
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

  const filteredPositions = positions
    .filter(position => {
      // Global search filter
      const matchesSearch = searchTerm === '' || 
        position.positionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.jobFunctionName?.toLowerCase().includes(searchTerm.toLowerCase());

      // Column filters
      const matchesPositionTitle = columnFilters.positionTitle.length === 0 || 
        columnFilters.positionTitle.includes(position.positionTitle || '-');
      
      const matchesDepartmentName = columnFilters.departmentName.length === 0 || 
        columnFilters.departmentName.includes(position.departmentName || '-');
      
      const matchesJobFunctionName = columnFilters.jobFunctionName.length === 0 || 
        columnFilters.jobFunctionName.includes(position.jobFunctionName || '-');
      
      const matchesJobGradeName = columnFilters.jobGradeName.length === 0 || 
        columnFilters.jobGradeName.includes(position.jobGradeName || '-');
      
      const matchesLeadershipLevel = columnFilters.leadershipLevel.length === 0 || 
        columnFilters.leadershipLevel.includes(position.leadershipLevel || '-');

      return matchesSearch && matchesPositionTitle && matchesDepartmentName && 
             matchesJobFunctionName && matchesJobGradeName && matchesLeadershipLevel;
    })
    .sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      const comparison = aValue.toString().localeCompare(bValue.toString());
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading positions...</div>
      </div>
    );
  }

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading permissions...</div>
      </div>
    );
  }

  if (!hasAnyPermission) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-2">Access Denied</div>
          <div className="text-gray-600">You do not have permission to access Position Records Management.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Positions</h2>
        {canCreate && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Position</span>
          </button>
        )}
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
                </div>
                <div className="flex space-x-2 ml-4">
                  {canUpdate && (
                    <button 
                      onClick={() => handleEditPosition(position)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(position.positionID)}
                      className="text-red-600 hover:text-red-900 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Department:</span>
                  <p className="text-gray-900">{position.departmentName || '-'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Job Function:</span>
                  <p className="text-gray-900">{position.jobFunctionName || '-'}</p>
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
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => handleSort('positionTitle')}
                    >
                      <span>Position Title</span>
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
                      onClick={() => handleSort('jobFunctionName')}
                    >
                      <span>Job Function</span>
                      {getSortIcon('jobFunctionName')}
                    </div>
                    {renderFilterDropdown('jobFunctionName')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                >
                  <div className="flex items-center justify-center gap-4">
                    <div 
                      className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => handleSort('jobGradeName')}
                    >
                      <span>Job Grade</span>
                      {getSortIcon('jobGradeName')}
                    </div>
                    {renderFilterDropdown('jobGradeName')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => handleSort('leadershipLevel')}
                    >
                      <span>Leadership Level</span>
                      {getSortIcon('leadershipLevel')}
                    </div>
                    {renderFilterDropdown('leadershipLevel')}
                  </div>
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
                    <div className="text-sm font-medium text-gray-900 text-left">
                      {position.positionTitle}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                    {position.departmentName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                    {position.jobFunctionName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {position.jobGradeName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                    {position.leadershipLevel || '-'}
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1">
                      {canUpdate && (
                        <button 
                          onClick={() => handleEditPosition(position)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(position.positionID)}
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
                <label htmlFor="jobFunctionID" className="block text-sm font-medium text-gray-700 mb-1">
                  Job Function
                </label>
                <select
                  id="jobFunctionID"
                  value={formData.jobFunctionID}
                  onChange={(e) => handleInputChange('jobFunctionID', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.jobFunctionID ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a job function</option>
                  {(formData.departmentID
                    ? jobFunctions.filter(jf => jf.departmentID === parseInt(formData.departmentID))
                    : jobFunctions
                  ).map((jobFunction) => (
                    <option key={jobFunction.jobFunctionID} value={jobFunction.jobFunctionID}>
                      {jobFunction.jobFunctionName}
                    </option>
                  ))}
                </select>
                {errors.jobFunctionID && (
                  <p className="mt-1 text-sm text-red-600">{errors.jobFunctionID}</p>
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