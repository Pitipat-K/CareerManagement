import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import axios from '../utils/axiosConfig';
import { getApiUrl } from '../config/api';
import { useModulePermissions } from '../hooks/usePermissions';

interface CompetencyCategory {
    categoryID: number;
    domainID: number;
    categoryName: string;
    categoryDescription?: string;
    displayOrder?: number;
    isActive: boolean;
    domainName?: string;
    createdDate?: string;
    modifiedDate?: string;
    modifiedBy?: number;
    modifiedByEmployeeName?: string;
}

interface CompetencyDomain {
    domainID: number;
    domainName: string;
}

interface CompetencyCategoryFormData {
    domainID: string;
    categoryName: string;
    categoryDescription: string;
    displayOrder: string;
}

type SortField = 'categoryName' | 'domainName';
type SortDirection = 'asc' | 'desc';

const CompetencyCategories = () => {
    const { canCreate, canRead, canUpdate, canDelete, loading: permissionsLoading, hasAnyPermission } = useModulePermissions('COMP_CATEGORIES');
    const [categories, setCategories] = useState<CompetencyCategory[]>([]);
    const [domains, setDomains] = useState<CompetencyDomain[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CompetencyCategory | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [sortField, setSortField] = useState<SortField>('categoryName');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [formData, setFormData] = useState<CompetencyCategoryFormData>({
        domainID: '',
        categoryName: '',
        categoryDescription: '',
        displayOrder: ''
    });
    const [errors, setErrors] = useState<Partial<CompetencyCategoryFormData>>({});
    
    // Column filters state
    const [columnFilters, setColumnFilters] = useState<{
        categoryName: string[];
        domainName: string[];
    }>({
        categoryName: [],
        domainName: []
    });
    
    // Temp filters for the dropdown (before Apply is clicked)
    const [tempFilters, setTempFilters] = useState<{
        categoryName: string[];
        domainName: string[];
    }>({
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
            fetchCategories();
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

    const fetchCategories = async () => {
        try {
            const response = await axios.get(getApiUrl('competencycategories'));
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDomains = async () => {
        try {
            const response = await axios.get(getApiUrl('competencydomains'));
            setDomains(response.data);
        } catch (error) {
            console.error('Error fetching domains:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!canDelete) {
            alert('You do not have permission to delete competency categories.');
            return;
        }
        
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                const currentEmployeeId = getCurrentEmployeeId();
                const url = currentEmployeeId 
                    ? getApiUrl(`competencycategories/${id}?modifiedBy=${currentEmployeeId}`)
                    : getApiUrl(`competencycategories/${id}`);
                
                await axios.delete(url);
                fetchCategories();
            } catch (error) {
                console.error('Error deleting category:', error);
            }
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<CompetencyCategoryFormData> = {};

        if (!formData.categoryName.trim()) {
            newErrors.categoryName = 'Category name is required';
        } else if (formData.categoryName.trim().length > 200) {
            newErrors.categoryName = 'Category name must be 200 characters or less';
        }

        if (!formData.domainID.trim()) {
            newErrors.domainID = 'Domain is required';
        }

        if (formData.categoryDescription.trim().length > 500) {
            newErrors.categoryDescription = 'Description must be 500 characters or less';
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
        if (editingCategory && !canUpdate) {
            alert('You do not have permission to update competency categories.');
            return;
        }
        
        if (!editingCategory && !canCreate) {
            alert('You do not have permission to create competency categories.');
            return;
        }

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        try {
            const currentEmployeeId = getCurrentEmployeeId();
            const categoryData = {
                domainID: parseInt(formData.domainID),
                categoryName: formData.categoryName.trim(),
                categoryDescription: formData.categoryDescription.trim() || null,
                displayOrder: formData.displayOrder.trim() ? parseInt(formData.displayOrder) : null,
                isActive: true,
                modifiedBy: currentEmployeeId
            };

            if (editingCategory) {
                // Update existing category
                await axios.put(getApiUrl(`competencycategories/${editingCategory.categoryID}`), {
                    ...categoryData,
                    categoryID: editingCategory.categoryID
                });
            } else {
                // Create new category
                await axios.post(getApiUrl('competencycategories'), categoryData);
            }

            // Reset form and close modal
            setFormData({
                domainID: '',
                categoryName: '',
                categoryDescription: '',
                displayOrder: ''
            });
            setErrors({});
            setShowModal(false);
            setEditingCategory(null);

            // Refresh the categories list
            fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            alert(`Failed to ${editingCategory ? 'update' : 'create'} category. Please try again.`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (field: keyof CompetencyCategoryFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleCloseModal = () => {
        setFormData({
            domainID: '',
            categoryName: '',
            categoryDescription: '',
            displayOrder: ''
        });
        setErrors({});
        setShowModal(false);
        setEditingCategory(null);
    };

    const handleEditCategory = (category: CompetencyCategory) => {
        setEditingCategory(category);
        setFormData({
            domainID: category.domainID.toString(),
            categoryName: category.categoryName,
            categoryDescription: category.categoryDescription || '',
            displayOrder: category.displayOrder?.toString() || ''
        });
        setShowModal(true);
    };

    const handleAddNew = () => {
        setEditingCategory(null);
        setFormData({
            domainID: '',
            categoryName: '',
            categoryDescription: '',
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
        const values = categories
            .map(cat => cat[field] || '-')
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

    const filteredCategories = categories
        .filter(category => {
            // Global search filter
            const matchesSearch = searchTerm === '' || 
                category.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                category.domainName?.toLowerCase().includes(searchTerm.toLowerCase());

            // Column filters
            const matchesCategoryName = columnFilters.categoryName.length === 0 || 
                columnFilters.categoryName.includes(category.categoryName || '-');
            
            const matchesDomainName = columnFilters.domainName.length === 0 || 
                columnFilters.domainName.includes(category.domainName || '-');

            return matchesSearch && matchesCategoryName && matchesDomainName;
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
                    <h2 className="text-xl text-left sm:text-2xl font-bold text-gray-900">Competency Categories</h2>
                </div>
                {canCreate && (
                    <button
                        onClick={handleAddNew}
                        className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search categories or domains..."
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
                                                onClick={() => handleSort('categoryName')}
                                            >
                                                <span>Category Name</span>
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
                                {filteredCategories.map((category, index) => (
                                    <tr key={category.categoryID} className="hover:bg-gray-50">
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                                            <div className="text-sm text-gray-900 text-center">
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 text-left">
                                                {category.categoryName}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 text-left">
                                                {category.domainName}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate text-left">
                                                {category.categoryDescription || '-'}
                                            </div>
                                        </td>
                                        <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <div className="flex items-center justify-center space-x-1">
                                                {canUpdate && (
                                                    <button
                                                        onClick={() => handleEditCategory(category)}
                                                        className="text-blue-600 hover:text-blue-900 p-1"
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDelete(category.categoryID)}
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
                                {editingCategory ? 'Edit Category' : 'Add New Category'}
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
                                    Domain *
                                </label>
                                <select
                                    value={formData.domainID}
                                    onChange={(e) => handleInputChange('domainID', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.domainID ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                >
                                    <option value="">Select a domain</option>
                                    {domains.map((domain) => (
                                        <option key={domain.domainID} value={domain.domainID}>
                                            {domain.domainName}
                                        </option>
                                    ))}
                                </select>
                                {errors.domainID && (
                                    <p className="mt-1 text-sm text-red-600">{errors.domainID}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.categoryName}
                                    onChange={(e) => handleInputChange('categoryName', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.categoryName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter category name"
                                />
                                {errors.categoryName && (
                                    <p className="mt-1 text-sm text-red-600">{errors.categoryName}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.categoryDescription}
                                    onChange={(e) => handleInputChange('categoryDescription', e.target.value)}
                                    rows={3}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.categoryDescription ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter category description"
                                />
                                {errors.categoryDescription && (
                                    <p className="mt-1 text-sm text-red-600">{errors.categoryDescription}</p>
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
                                    {submitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompetencyCategories; 