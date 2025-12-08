import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import axios from '../utils/axiosConfig';
import { getApiUrl } from '../config/api';
import { useModulePermissions } from '../hooks/usePermissions';

interface Company {
    companyID: number;
    companyName: string;
    description?: string;
    directorID?: number;
    isActive: boolean;
    createdDate: string;
    modifiedDate?: string;
    modifiedBy?: number;
    modifiedByEmployeeName?: string;
    departmentCount: number;
    directorName?: string;
}

interface Employee {
    employeeID: number;
    fullName: string;
}

interface CompanyFormData {
    companyName: string;
    description: string;
    directorID: string;
}

type SortField = 'companyName';
type SortDirection = 'asc' | 'desc';

const Companies = () => {
    const { canCreate, canRead, canUpdate, canDelete, loading: permissionsLoading, hasAnyPermission } = useModulePermissions('COMPANIES');
    const [companies, setCompanies] = useState<Company[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [sortField, setSortField] = useState<SortField>('companyName');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [formData, setFormData] = useState<CompanyFormData>({
        companyName: '',
        description: '',
        directorID: ''
    });
    const [errors, setErrors] = useState<Partial<CompanyFormData>>({});
    
    // Column filters state
    const [columnFilters, setColumnFilters] = useState<{
        companyName: string[];
    }>({
        companyName: []
    });
    
    // Temp filters for the dropdown (before Apply is clicked)
    const [tempFilters, setTempFilters] = useState<{
        companyName: string[];
    }>({
        companyName: []
    });
    
    // Track which filter dropdown is open
    const [openFilter, setOpenFilter] = useState<string | null>(null);
    const filterRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    
    // Search term within filter dropdowns
    const [filterSearchTerm, setFilterSearchTerm] = useState<string>('');

    useEffect(() => {
        if (canRead) {
            fetchCompanies();
            fetchEmployees();
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

    const fetchCompanies = async () => {
        try {
            const response = await axios.get(getApiUrl('companies'));
            setCompanies(response.data);
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setLoading(false);
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
        if (!canDelete) {
            alert('You do not have permission to delete companies.');
            return;
        }
        
        if (window.confirm('Are you sure you want to delete this company?')) {
            try {
                const currentEmployeeId = getCurrentEmployeeId();
                const url = currentEmployeeId 
                    ? getApiUrl(`companies/${id}?modifiedBy=${currentEmployeeId}`)
                    : getApiUrl(`companies/${id}`);
                
                await axios.delete(url);
                fetchCompanies();
            } catch (error) {
                console.error('Error deleting company:', error);
            }
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<CompanyFormData> = {};

        if (!formData.companyName.trim()) {
            newErrors.companyName = 'Company name is required';
        } else if (formData.companyName.trim().length > 100) {
            newErrors.companyName = 'Company name must be 100 characters or less';
        }

        if (formData.description.trim().length > 500) {
            newErrors.description = 'Description must be 500 characters or less';
        }

        if (formData.directorID.trim() && isNaN(Number(formData.directorID))) {
            newErrors.directorID = 'Director ID must be a valid number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check permissions before allowing submit
        if (editingCompany && !canUpdate) {
            alert('You do not have permission to update companies.');
            return;
        }
        
        if (!editingCompany && !canCreate) {
            alert('You do not have permission to create companies.');
            return;
        }

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        try {
            const currentEmployeeId = getCurrentEmployeeId();
            const companyData = {
                companyName: formData.companyName.trim(),
                description: formData.description.trim() || null,
                directorID: formData.directorID.trim() ? parseInt(formData.directorID) : null,
                isActive: true,
                createdDate: new Date().toISOString(),
                modifiedBy: currentEmployeeId
            };

            if (editingCompany) {
                // Update existing company
                await axios.put(getApiUrl(`companies/${editingCompany.companyID}`), {
                    ...companyData,
                    companyID: editingCompany.companyID,
                    createdDate: editingCompany.createdDate // Preserve original creation date
                });
            } else {
                // Create new company
                await axios.post(getApiUrl('companies'), companyData);
            }

            // Reset form and close modal
            setFormData({
                companyName: '',
                description: '',
                directorID: ''
            });
            setErrors({});
            setShowModal(false);
            setEditingCompany(null);

            // Refresh the companies list
            fetchCompanies();
        } catch (error) {
            console.error('Error saving company:', error);
            alert(`Failed to ${editingCompany ? 'update' : 'create'} company. Please try again.`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (field: keyof CompanyFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCompany(null);
        setFormData({
            companyName: '',
            description: '',
            directorID: ''
        });
        setErrors({});
    };

    const handleEditCompany = (company: Company) => {
        setEditingCompany(company);
        setFormData({
            companyName: company.companyName,
            description: company.description || '',
            directorID: company.directorID?.toString() || ''
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
        const values = companies
            .map(comp => comp[field] || '-')
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

    const filteredCompanies = companies
        .filter(company => {
            // Global search filter
            const matchesSearch = searchTerm === '' || 
                company.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                company.description?.toLowerCase().includes(searchTerm.toLowerCase());

            // Column filters
            const matchesCompanyName = columnFilters.companyName.length === 0 || 
                columnFilters.companyName.includes(company.companyName || '-');

            return matchesSearch && matchesCompanyName;
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
                    <div className="text-gray-600">You do not have permission to access Company Records Management.</div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Loading companies...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Companies</h2>
                {canCreate && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Company</span>
                    </button>
                )}
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Mobile Cards View */}
            <div className="block lg:hidden">
                <div className="space-y-4">
                    {filteredCompanies.map((company) => (
                        <div key={company.companyID} className="bg-white rounded-lg shadow p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{company.companyName}</h3>
                                    <p className="text-sm text-gray-500">{company.description || 'No description'}</p>
                                </div>
                                <div className="flex space-x-2 ml-4">
                                    {canUpdate && (
                                        <button
                                            onClick={() => handleEditCompany(company)}
                                            className="text-blue-600 hover:text-blue-900 p-1"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDelete(company.companyID)}
                                            className="text-red-600 hover:text-red-900 p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="font-medium text-gray-700">Director:</span>
                                    <p className="text-gray-900">{company.directorName || '-'}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Departments:</span>
                                    <p className="text-gray-900">{company.departmentCount} departments</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="font-medium text-gray-700">Created:</span>
                                    <p className="text-gray-900">{new Date(company.createdDate).toLocaleDateString()}</p>
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
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                                >
                                    <div className="flex items-center justify-between">
                                        <div 
                                            className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 select-none"
                                            onClick={() => handleSort('companyName')}
                                        >
                                            <span>Company Name</span>
                                            {getSortIcon('companyName')}
                                        </div>
                                        {renderFilterDropdown('companyName')}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                                    Director
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                                    Departments
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                                    Created Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCompanies.map((company) => (
                                <tr key={company.companyID} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">
                                        {company.companyName}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-left">
                                        {company.description || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                                        {company.directorName || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                                        {company.departmentCount} departments
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(company.createdDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-2 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-1">
                                            {canUpdate && (
                                                <button
                                                    onClick={() => handleEditCompany(company)}
                                                    className="text-blue-600 hover:text-blue-900 p-1"
                                                >
                                                    <Edit className="w-3 h-3" />
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button
                                                    onClick={() => handleDelete(company.companyID)}
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

            {filteredCompanies.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No companies found.
                </div>
            )}

            {/* Add Company Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingCompany ? 'Edit Company' : 'Add New Company'}
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
                                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Company Name *
                                </label>
                                <input
                                    type="text"
                                    id="companyName"
                                    value={formData.companyName}
                                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.companyName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter company name"
                                    maxLength={100}
                                />
                                {errors.companyName && (
                                    <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
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
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.description ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter company description"
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
                                <label htmlFor="directorID" className="block text-sm font-medium text-gray-700 mb-1">
                                    Director
                                </label>
                                <select
                                    id="directorID"
                                    value={formData.directorID}
                                    onChange={(e) => handleInputChange('directorID', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.directorID ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                >
                                    <option value="">Select a director (optional)</option>
                                    {employees.map((employee) => (
                                        <option key={employee.employeeID} value={employee.employeeID}>
                                            {employee.fullName}
                                        </option>
                                    ))}
                                </select>
                                {errors.directorID && (
                                    <p className="mt-1 text-sm text-red-600">{errors.directorID}</p>
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
                                    {submitting ? (editingCompany ? 'Updating...' : 'Creating...') : (editingCompany ? 'Update Company' : 'Create Company')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Companies; 