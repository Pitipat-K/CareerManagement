import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config/api';

interface CompetencyCategory {
    categoryID: number;
    domainID: number;
    categoryName: string;
    categoryDescription?: string;
    displayOrder?: number;
    isActive: boolean;
    domainName?: string;
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

const CompetencyCategories = () => {
    const [categories, setCategories] = useState<CompetencyCategory[]>([]);
    const [domains, setDomains] = useState<CompetencyDomain[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CompetencyCategory | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<CompetencyCategoryFormData>({
        domainID: '',
        categoryName: '',
        categoryDescription: '',
        displayOrder: ''
    });
    const [errors, setErrors] = useState<Partial<CompetencyCategoryFormData>>({});

    useEffect(() => {
        fetchCategories();
        fetchDomains();
    }, []);

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
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await axios.delete(getApiUrl(`competencycategories/${id}`));
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

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        try {
            const categoryData = {
                domainID: parseInt(formData.domainID),
                categoryName: formData.categoryName.trim(),
                categoryDescription: formData.categoryDescription.trim() || null,
                displayOrder: formData.displayOrder.trim() ? parseInt(formData.displayOrder) : null,
                isActive: true
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

    const filteredCategories = categories.filter(category =>
        category.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.domainName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <button
                    onClick={handleAddNew}
                    className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                </button>
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
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        No.
                                    </th>
                                    <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category Name
                                    </th>
                                    <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Domain
                                    </th>
                                    <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredCategories.map((category, index) => (
                                    <tr key={category.categoryID} className="hover:bg-gray-50">
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {category.categoryName}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {category.domainName}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                {category.categoryDescription || '-'}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEditCategory(category)}
                                                    className="text-blue-600 hover:text-blue-900 p-1"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category.categoryID)}
                                                    className="text-red-600 hover:text-red-900 p-1"
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