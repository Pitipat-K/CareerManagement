import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import { useModulePermissions } from '../hooks/usePermissions';

interface Competency {
    competencyID: number;
    categoryID: number;
    competencyName: string;
    competencyDescription?: string;
    displayOrder?: number;
    isActive: boolean;
    categoryName?: string;
    domainName?: string;
    createdDate?: string;
    modifiedDate?: string;
    modifiedBy?: number;
    modifiedByEmployeeName?: string;
}

interface CompetencyCategory {
    categoryID: number;
    categoryName: string;
    domainName?: string;
}

interface CompetencyFormData {
    categoryID: string;
    competencyName: string;
    competencyDescription: string;
    displayOrder: string;
}

type SortField = 'competencyName' | 'categoryName' | 'domainName';
type SortDirection = 'asc' | 'desc';

const Competencies = () => {
    const { canCreate, canRead, canUpdate, canDelete, loading: permissionsLoading, hasAnyPermission } = useModulePermissions('COMPETENCIES');
    const [competencies, setCompetencies] = useState<Competency[]>([]);
    const [categories, setCategories] = useState<CompetencyCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [domainFilter, setDomainFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [sortField, setSortField] = useState<SortField>('domainName');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [formData, setFormData] = useState<CompetencyFormData>({
        categoryID: '',
        competencyName: '',
        competencyDescription: '',
        displayOrder: ''
    });
    const [errors, setErrors] = useState<Partial<CompetencyFormData>>({});
    
    // Column filters state
    const [columnFilters, setColumnFilters] = useState<{
        competencyName: string[];
        categoryName: string[];
        domainName: string[];
    }>({
        competencyName: [],
        categoryName: [],
        domainName: []
    });
    
    // Temp filters for the dropdown (before Apply is clicked)
    const [tempFilters, setTempFilters] = useState<{
        competencyName: string[];
        categoryName: string[];
        domainName: string[];
    }>({
        competencyName: [],
        categoryName: [],
        domainName: []
    });
    
    // Track which filter dropdown is open
    const [openFilter, setOpenFilter] = useState<string | null>(null);
    const filterRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    
    // Search term within filter dropdowns
    const [filterSearchTerm, setFilterSearchTerm] = useState<string>('');

    useEffect(() => {
        if (canRead) {
            fetchCompetencies();
            fetchCategories();
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

    const fetchCompetencies = async () => {
        try {
            const response = await axios.get(getApiUrl('competencies'));
            setCompetencies(response.data);
        } catch (error) {
            console.error('Error fetching competencies:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get(getApiUrl('competencycategories'));
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!canDelete) {
            alert('You do not have permission to delete competencies.');
            return;
        }
        
        if (window.confirm('Are you sure you want to delete this competency?')) {
            try {
                const currentEmployeeId = getCurrentEmployeeId();
                const url = currentEmployeeId 
                    ? getApiUrl(`competencies/${id}?modifiedBy=${currentEmployeeId}`)
                    : getApiUrl(`competencies/${id}`);
                
                await axios.delete(url);
                fetchCompetencies();
            } catch (error) {
                console.error('Error deleting competency:', error);
            }
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<CompetencyFormData> = {};

        if (!formData.competencyName.trim()) {
            newErrors.competencyName = 'Competency name is required';
        } else if (formData.competencyName.trim().length > 200) {
            newErrors.competencyName = 'Competency name must be 200 characters or less';
        }

        if (!formData.categoryID.trim()) {
            newErrors.categoryID = 'Category is required';
        }

        if (formData.competencyDescription.trim().length > 1000) {
            newErrors.competencyDescription = 'Description must be 1000 characters or less';
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
        if (editingCompetency && !canUpdate) {
            alert('You do not have permission to update competencies.');
            return;
        }
        
        if (!editingCompetency && !canCreate) {
            alert('You do not have permission to create competencies.');
            return;
        }

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        try {
            const currentEmployeeId = getCurrentEmployeeId();
            const competencyData = {
                categoryID: parseInt(formData.categoryID),
                competencyName: formData.competencyName.trim(),
                competencyDescription: formData.competencyDescription.trim() || null,
                displayOrder: formData.displayOrder.trim() ? parseInt(formData.displayOrder) : null,
                isActive: true,
                modifiedBy: currentEmployeeId
            };

            if (editingCompetency) {
                // Update existing competency
                await axios.put(getApiUrl(`competencies/${editingCompetency.competencyID}`), {
                    ...competencyData,
                    competencyID: editingCompetency.competencyID
                });
            } else {
                // Create new competency
                await axios.post(getApiUrl('competencies'), competencyData);
            }

            // Reset form and close modal
            setFormData({
                categoryID: '',
                competencyName: '',
                competencyDescription: '',
                displayOrder: ''
            });
            setErrors({});
            setShowModal(false);
            setEditingCompetency(null);

            // Refresh the competencies list
            fetchCompetencies();
        } catch (error) {
            console.error('Error saving competency:', error);
            alert(`Failed to ${editingCompetency ? 'update' : 'create'} competency. Please try again.`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (field: keyof CompetencyFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleCloseModal = () => {
        setFormData({
            categoryID: '',
            competencyName: '',
            competencyDescription: '',
            displayOrder: ''
        });
        setErrors({});
        setShowModal(false);
        setEditingCompetency(null);
    };

    const handleEditCompetency = (competency: Competency) => {
        setEditingCompetency(competency);
        setFormData({
            categoryID: competency.categoryID.toString(),
            competencyName: competency.competencyName,
            competencyDescription: competency.competencyDescription || '',
            displayOrder: competency.displayOrder?.toString() || ''
        });
        setShowModal(true);
    };

    const handleAddNew = () => {
        setEditingCompetency(null);
        setFormData({
            categoryID: '',
            competencyName: '',
            competencyDescription: '',
            displayOrder: ''
        });
        setErrors({});
        setShowModal(true);
    };

    // Get unique categories and domains for filters
    const uniqueCategories = [...new Set(competencies.map(c => c.categoryName).filter(Boolean))].sort();
    const uniqueDomains = [...new Set(competencies.map(c => c.domainName).filter(Boolean))].sort();

    const clearFilters = () => {
        setSearchTerm('');
        setCategoryFilter('');
        setDomainFilter('');
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            // Toggle direction if clicking the same field
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new field and default to ascending
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
        const values = competencies
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

    const filteredCompetencies = competencies
        .filter(competency => {
            // Global search filter
            const matchesSearch = searchTerm === '' || 
                competency.competencyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                competency.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                competency.domainName?.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Old category filter (keeping for backward compatibility)
            const matchesCategory = !categoryFilter || competency.categoryName === categoryFilter;
            
            // Old domain filter (keeping for backward compatibility)
            const matchesDomain = !domainFilter || competency.domainName === domainFilter;
            
            // Column filters
            const matchesCompetencyName = columnFilters.competencyName.length === 0 || 
                columnFilters.competencyName.includes(competency.competencyName || '-');
            
            const matchesCategoryName = columnFilters.categoryName.length === 0 || 
                columnFilters.categoryName.includes(competency.categoryName || '-');
            
            const matchesDomainName = columnFilters.domainName.length === 0 || 
                columnFilters.domainName.includes(competency.domainName || '-');

            return matchesSearch && matchesCategory && matchesDomain &&
                   matchesCompetencyName && matchesCategoryName && matchesDomainName;
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
                    <h2 className="text-xl text-left sm:text-2xl font-bold text-gray-900">Competencies</h2>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-700"
                        >
                            <option value="">All Categories</option>
                            {uniqueCategories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                        <select
                            value={domainFilter}
                            onChange={(e) => setDomainFilter(e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-700"
                        >
                            <option value="">All Domains</option>
                            {uniqueDomains.map((domain) => (
                                <option key={domain} value={domain}>
                                    {domain}
                                </option>
                            ))}
                        </select>
                    </div>
                    {canCreate && (
                        <button
                            onClick={handleAddNew}
                            className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Competency
                        </button>
                    )}
                </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-0">
                <div className="relative bg-gray-50">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search competencies, categories, or domains..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                {(searchTerm || categoryFilter || domainFilter) && (
                    <div className="flex items-center justify-between mb-0">
                        <div className="text-sm text-gray-600">
                            {filteredCompetencies.length} of {competencies.length} competencies shown
                        </div>
                        <button
                            onClick={clearFilters}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
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
                                                onClick={() => handleSort('competencyName')}
                                            >
                                                <span>Competency Name</span>
                                                {getSortIcon('competencyName')}
                                            </div>
                                            {renderFilterDropdown('competencyName')}
                                        </div>
                                    </th>
                                    <th 
                                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div 
                                                className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 select-none"
                                                onClick={() => handleSort('categoryName')}
                                            >
                                                <span>Category</span>
                                                {getSortIcon('categoryName')}
                                            </div>
                                            {renderFilterDropdown('categoryName')}
                                        </div>
                                    </th>
                                    <th 
                                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div 
                                                className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 select-none"
                                                onClick={() => handleSort('domainName')}
                                            >
                                                <span>Domain</span>
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
                                {filteredCompetencies.map((competency, index) => (
                                    <tr key={competency.competencyID} className="hover:bg-gray-50">
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                                            <div className="text-sm text-gray-900 text-center">
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-left">
                                            <div className="text-sm font-medium text-gray-900 text-left">
                                                {competency.competencyName}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-left">
                                            <div className="text-sm text-gray-900 text-left">
                                                {competency.categoryName}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-left">
                                            <div className="text-sm text-gray-900 text-left">
                                                {competency.domainName}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 text-left">
                                            <div className="text-sm text-gray-900 max-w-xs truncate text-left">
                                                {competency.competencyDescription || '-'}
                                            </div>
                                        </td>
                                        <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <div className="flex items-center justify-center space-x-1">
                                                {canUpdate && (
                                                    <button
                                                        onClick={() => handleEditCompetency(competency)}
                                                        className="text-blue-600 hover:text-blue-900 p-1"
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDelete(competency.competencyID)}
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
                                {editingCompetency ? 'Edit Competency' : 'Add New Competency'}
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
                                    Category *
                                </label>
                                <select
                                    value={formData.categoryID}
                                    onChange={(e) => handleInputChange('categoryID', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.categoryID ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((category) => (
                                        <option key={category.categoryID} value={category.categoryID}>
                                            {category.categoryName} {category.domainName && `(${category.domainName})`}
                                        </option>
                                    ))}
                                </select>
                                {errors.categoryID && (
                                    <p className="mt-1 text-sm text-red-600">{errors.categoryID}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Competency Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.competencyName}
                                    onChange={(e) => handleInputChange('competencyName', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.competencyName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter competency name"
                                />
                                {errors.competencyName && (
                                    <p className="mt-1 text-sm text-red-600">{errors.competencyName}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.competencyDescription}
                                    onChange={(e) => handleInputChange('competencyDescription', e.target.value)}
                                    rows={3}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.competencyDescription ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter competency description"
                                />
                                {errors.competencyDescription && (
                                    <p className="mt-1 text-sm text-red-600">{errors.competencyDescription}</p>
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
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.displayOrder ? 'border-red-500' : 'border-gray-300'
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
                                    {submitting ? 'Saving...' : editingCompetency ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Competencies; 