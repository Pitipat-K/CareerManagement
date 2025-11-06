import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import { useModulePermissions } from '../hooks/usePermissions';

interface CompetencyDomain {
  domainID: number;
  domainName: string;
  domainDescription?: string;
  displayOrder?: number;
  isActive: boolean;
  createdDate?: string;
  modifiedDate?: string;
  modifiedBy?: number;
  modifiedByEmployeeName?: string;
}

interface CompetencyDomainFormData {
  domainName: string;
  domainDescription: string;
  displayOrder: string;
}

type SortField = 'domainName';
type SortDirection = 'asc' | 'desc';

const CompetencyDomains = () => {
    const { canCreate, canRead, canUpdate, canDelete, loading: permissionsLoading, hasAnyPermission } = useModulePermissions('COMP_DOMAINS');
    const [domains, setDomains] = useState<CompetencyDomain[]>([]);
    const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDomain, setEditingDomain] = useState<CompetencyDomain | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('domainName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [formData, setFormData] = useState<CompetencyDomainFormData>({
    domainName: '',
    domainDescription: '',
    displayOrder: ''
  });
  const [errors, setErrors] = useState<Partial<CompetencyDomainFormData>>({});
  
  // Column filters state
  const [columnFilters, setColumnFilters] = useState<{
    domainName: string[];
  }>({
    domainName: []
  });
  
  // Temp filters for the dropdown (before Apply is clicked)
  const [tempFilters, setTempFilters] = useState<{
    domainName: string[];
  }>({
    domainName: []
  });
  
  // Track which filter dropdown is open
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const filterRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Search term within filter dropdowns
  const [filterSearchTerm, setFilterSearchTerm] = useState<string>('');

    useEffect(() => {
        if (canRead) {
            fetchDomains();
        }
    }, [canRead]);

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

  const fetchDomains = async () => {
    try {
      const response = await axios.get(getApiUrl('competencydomains'));
      setDomains(response.data);
    } catch (error) {
      console.error('Error fetching domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete) {
      alert('You do not have permission to delete competency domains.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this domain?')) {
      try {
        const currentEmployeeId = getCurrentEmployeeId();
        const url = currentEmployeeId 
          ? getApiUrl(`competencydomains/${id}?modifiedBy=${currentEmployeeId}`)
          : getApiUrl(`competencydomains/${id}`);
        
        await axios.delete(url);
        fetchDomains();
      } catch (error) {
        console.error('Error deleting domain:', error);
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CompetencyDomainFormData> = {};

    if (!formData.domainName.trim()) {
      newErrors.domainName = 'Domain name is required';
    } else if (formData.domainName.trim().length > 200) {
      newErrors.domainName = 'Domain name must be 200 characters or less';
    }

    if (formData.domainDescription.trim().length > 500) {
      newErrors.domainDescription = 'Description must be 500 characters or less';
    }

    const displayOrder = parseInt(formData.displayOrder);
    if (formData.displayOrder.trim() && (isNaN(displayOrder) || displayOrder < 0)) {
      newErrors.displayOrder = 'Display order must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check permissions before allowing submit
    if (editingDomain && !canUpdate) {
      alert('You do not have permission to update competency domains.');
      return;
    }
    
    if (!editingDomain && !canCreate) {
      alert('You do not have permission to create competency domains.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const currentEmployeeId = getCurrentEmployeeId();
      const domainData = {
        domainName: formData.domainName.trim(),
        domainDescription: formData.domainDescription.trim() || null,
        displayOrder: formData.displayOrder.trim() ? parseInt(formData.displayOrder) : null,
        isActive: true,
        modifiedBy: currentEmployeeId
      };

      if (editingDomain) {
        // Update existing domain
        await axios.put(getApiUrl(`competencydomains/${editingDomain.domainID}`), {
          ...domainData,
          domainID: editingDomain.domainID
        });
      } else {
        // Create new domain
        await axios.post(getApiUrl('competencydomains'), domainData);
      }
      
      // Reset form and close modal
      setFormData({
        domainName: '',
        domainDescription: '',
        displayOrder: ''
      });
      setErrors({});
      setShowModal(false);
      setEditingDomain(null);
      
      // Refresh the domains list
      fetchDomains();
    } catch (error) {
      console.error('Error saving domain:', error);
      alert(`Failed to ${editingDomain ? 'update' : 'create'} domain. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CompetencyDomainFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCloseModal = () => {
    setFormData({
      domainName: '',
      domainDescription: '',
      displayOrder: ''
    });
    setErrors({});
    setShowModal(false);
    setEditingDomain(null);
  };

  const handleEditDomain = (domain: CompetencyDomain) => {
    setEditingDomain(domain);
    setFormData({
      domainName: domain.domainName,
      domainDescription: domain.domainDescription || '',
      displayOrder: domain.displayOrder?.toString() || ''
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingDomain(null);
    setFormData({
      domainName: '',
      domainDescription: '',
      displayOrder: ''
    });
    setErrors({});
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
    const values = domains
      .map(domain => domain[field] || '-')
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

  const filteredDomains = domains
    .filter(domain => {
      // Global search filter
      const matchesSearch = searchTerm === '' || 
        domain.domainName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        domain.domainDescription?.toLowerCase().includes(searchTerm.toLowerCase());

      // Column filters
      const matchesDomainName = columnFilters.domainName.length === 0 || 
        columnFilters.domainName.includes(domain.domainName || '-');

      return matchesSearch && matchesDomainName;
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
          <div className="text-gray-600">You do not have permission to access Competency Management.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl text-left sm:text-2xl font-bold text-gray-900">Competency Domains</h2>
        </div>
        {canCreate && (
          <button
            onClick={handleAddNew}
            className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Domain
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search domains..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <div className="max-h-[calc(100vh-265px)] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No.
                </th>
                <th 
                  className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => handleSort('domainName')}
                    >
                      <span>Domain Name</span>
                      {getSortIcon('domainName')}
                    </div>
                    {renderFilterDropdown('domainName')}
                  </div>
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDomains.map((domain, index) => (
                <tr key={domain.domainID} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900 text-center">
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 text-left">
                      {domain.domainName}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate text-left">
                      {domain.domainDescription || '-'}
                    </div>
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex items-center justify-center space-x-1">
                      {canUpdate && (
                        <button
                          onClick={() => handleEditDomain(domain)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(domain.domainID)}
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingDomain ? 'Edit Domain' : 'Add New Domain'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domain Name *
                </label>
                <input
                  type="text"
                  value={formData.domainName}
                  onChange={(e) => handleInputChange('domainName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.domainName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter domain name"
                />
                {errors.domainName && (
                  <p className="mt-1 text-sm text-red-600">{errors.domainName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.domainDescription}
                  onChange={(e) => handleInputChange('domainDescription', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.domainDescription ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter domain description"
                />
                {errors.domainDescription && (
                  <p className="mt-1 text-sm text-red-600">{errors.domainDescription}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => handleInputChange('displayOrder', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.displayOrder ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter display order"
                />
                {errors.displayOrder && (
                  <p className="mt-1 text-sm text-red-600">{errors.displayOrder}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingDomain ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetencyDomains; 