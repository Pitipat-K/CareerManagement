import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Search, X } from 'lucide-react';
import axios from 'axios';

interface CompetencyDomain {
  domainID: number;
  domainName: string;
  domainDescription?: string;
  displayOrder?: number;
  isActive: boolean;
}

interface CompetencyDomainFormData {
  domainName: string;
  domainDescription: string;
  displayOrder: string;
}

const CompetencyDomains = () => {
  const [domains, setDomains] = useState<CompetencyDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDomain, setEditingDomain] = useState<CompetencyDomain | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CompetencyDomainFormData>({
    domainName: '',
    domainDescription: '',
    displayOrder: ''
  });
  const [errors, setErrors] = useState<Partial<CompetencyDomainFormData>>({});

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await axios.get('https://localhost:7026/api/competencydomains');
      setDomains(response.data);
    } catch (error) {
      console.error('Error fetching domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this domain?')) {
      try {
        await axios.delete(`https://localhost:7026/api/competencydomains/${id}`);
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
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const domainData = {
        domainName: formData.domainName.trim(),
        domainDescription: formData.domainDescription.trim() || null,
        displayOrder: formData.displayOrder.trim() ? parseInt(formData.displayOrder) : null,
        isActive: true
      };

      if (editingDomain) {
        // Update existing domain
        await axios.put(`https://localhost:7026/api/competencydomains/${editingDomain.domainID}`, {
          ...domainData,
          domainID: editingDomain.domainID
        });
      } else {
        // Create new domain
        await axios.post('https://localhost:7026/api/competencydomains', domainData);
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

  const filteredDomains = domains.filter(domain =>
    domain.domainName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    domain.domainDescription?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-xl text-left sm:text-2xl font-bold text-gray-900">Competency Domains</h2>
        </div>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Domain
        </button>
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
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No.
                </th>
                <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domain Name
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
              {filteredDomains.map((domain, index) => (
                <tr key={domain.domainID} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {domain.domainName}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {domain.domainDescription || '-'}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditDomain(domain)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(domain.domainID)}
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