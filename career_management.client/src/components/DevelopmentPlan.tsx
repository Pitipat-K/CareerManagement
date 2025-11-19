import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import { Plus, Edit, Trash2, X, Download } from 'lucide-react';
import { useModulePermissions } from '../hooks/usePermissions';

const LEARNING_WAYS = [
  'On the job training',
  'External training',
  'Coaching',
];
const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'];
const STATUSES = ['Not start', 'On going', 'Completed'];

const getCurrentYear = () => new Date().getFullYear();
const getYearOptions = (range = 3) => {
  const current = getCurrentYear();
  return Array.from({ length: range }, (_, i) => current - 1 + i);
};

// Helper function to get current employee ID
const getCurrentEmployeeId = (): number | null => {
  try {
    const currentEmployee = localStorage.getItem('currentEmployee');
    if (currentEmployee) {
      const parsed = JSON.parse(currentEmployee);
      return parsed.employeeID || null;
    }
  } catch (error) {
    console.error('Error parsing currentEmployee from localStorage:', error);
  }
  return null;
};

interface Competency {
  competencyID: number;
  competencyName: string;
  categoryName?: string;
  domainName?: string;
}

interface CompetencyDomain {
  domainID: number;
  domainName: string;
  domainDescription?: string;
  displayOrder?: number;
  isActive: boolean;
}

interface Department {
  departmentID: number;
  departmentName: string;
  companyName?: string;
}

interface ExportData {
  year: number;
  department: string;
  position: string;
  employeeName: string;
  domain: string;
  category: string;
  competency: string;
  learningMethod: string;
  priority: string;
  targetDate: string;
  status: string;
}

interface PlanFormData {
  developmentPlanID?: number;
  employeeID?: number;
  competencyID: string;
  learningWay: string;
  priority: string;
  targetDate: string;
  status: string;
  planYear?: number;
  competencyName?: string; // Added for backend fallback
  createdDate?: string;
  modifiedDate?: string;
  modifiedBy?: number;
  modifiedByEmployeeName?: string;
}

const defaultFormData: PlanFormData = {
  competencyID: '',
  learningWay: '',
  priority: '',
  targetDate: '',
  status: '',
};

const DevelopmentPlan: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [plans, setPlans] = useState<PlanFormData[]>([]);
  const [formData, setFormData] = useState<PlanFormData>(defaultFormData);
  const [errors, setErrors] = useState<Partial<PlanFormData>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loadingCompetencies, setLoadingCompetencies] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [domains, setDomains] = useState<CompetencyDomain[]>([]);

  // Export modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [exportYear, setExportYear] = useState<string>('');
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
  const [loadingExport, setLoadingExport] = useState(false);

  // Get employeeId from localStorage
  const employeeId = getCurrentEmployeeId();

  // Check permissions for Employee Profile module
  const { canManage } = useModulePermissions('EMP_PROFILE');

  useEffect(() => {
    fetchCompetencies();
    fetchDomains();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (employeeId && selectedYear) {
      fetchPlans();
    }
    // eslint-disable-next-line
  }, [employeeId, selectedYear]);

  const fetchCompetencies = async () => {
    setLoadingCompetencies(true);
    try {
      const response = await axios.get(getApiUrl('competencies'));
      setCompetencies(response.data);
    } catch (error) {
      setCompetencies([]);
    } finally {
      setLoadingCompetencies(false);
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await axios.get(getApiUrl('competencydomains'));
      setDomains(response.data);
    } catch (error) {
      setDomains([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(getApiUrl('departments'));
      setDepartments(response.data);
    } catch (error) {
      setDepartments([]);
    }
  };

  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const response = await axios.get(getApiUrl(`EmployeeDevelopmentPlans/employee/${employeeId}/year/${selectedYear}`));
      setPlans(response.data);
    } catch (error: any) {
      setPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PlanFormData> = {};
    if (!formData.competencyID) newErrors.competencyID = 'Skill is required';
    if (!formData.learningWay) newErrors.learningWay = 'Learning way is required';
    if (!formData.priority) newErrors.priority = 'Priority is required';
    if (!formData.targetDate) newErrors.targetDate = 'Target date is required';
    if (!formData.status) newErrors.status = 'Status is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PlanFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleAddNew = () => {
    setFormData(defaultFormData);
    setEditingIndex(null);
    setShowAddModal(true);
  };

  const handleEdit = (idx: number) => {
    const plan = plans[idx];
    setFormData({
      developmentPlanID: plan.developmentPlanID,
      employeeID: plan.employeeID,
      competencyID: plan.competencyID,
      learningWay: plan.learningWay,
      priority: plan.priority,
      targetDate: plan.targetDate,
      status: plan.status,
      planYear: plan.planYear,
      createdDate: plan.createdDate,
      modifiedDate: plan.modifiedDate,
      modifiedBy: plan.modifiedBy,
      modifiedByEmployeeName: plan.modifiedByEmployeeName,
    });
    setEditingIndex(idx);
    setShowAddModal(true);
  };

  const handleDelete = async (idx: number) => {
    const plan = plans[idx];
    if (!plan.developmentPlanID) return;
    if (window.confirm('Delete this development plan?')) {
      try {
        const currentEmployeeId = getCurrentEmployeeId();
        await axios.delete(getApiUrl(`EmployeeDevelopmentPlans/${plan.developmentPlanID}?modifiedBy=${currentEmployeeId}`));
        fetchPlans();
      } catch (error) {
        alert('Failed to delete plan.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const currentEmployeeId = getCurrentEmployeeId();
    const planWithYear = {
      ...formData,
      employeeID: employeeId,
      planYear: selectedYear,
      modifiedBy: currentEmployeeId,
    };
    try {
      if (editingIndex !== null && formData.developmentPlanID) {
        await axios.put(getApiUrl(`EmployeeDevelopmentPlans/${formData.developmentPlanID}`), planWithYear);
      } else {
        await axios.post(getApiUrl('EmployeeDevelopmentPlans'), planWithYear);
      }
      setShowAddModal(false);
      setFormData(defaultFormData);
      setEditingIndex(null);
      fetchPlans();
    } catch (error) {
      alert('Failed to save plan.');
    }
  };

  const handleExport = () => {
    // Open export modal
    setExportYear(selectedYear.toString());
    setSelectedDepartments([]);
    setShowExportModal(true);
  };

  const handleDepartmentToggle = (deptId: number) => {
    setSelectedDepartments(prev => {
      if (prev.includes(deptId)) {
        return prev.filter(id => id !== deptId);
      } else {
        return [...prev, deptId];
      }
    });
  };

  const handleSelectAllDepartments = () => {
    if (selectedDepartments.length === departments.length) {
      setSelectedDepartments([]);
    } else {
      setSelectedDepartments(departments.map(d => d.departmentID));
    }
  };

  const performExport = async () => {
    if (!exportYear) {
      alert('Please select a year.');
      return;
    }

    setLoadingExport(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('year', exportYear);
      
      if (selectedDepartments.length > 0) {
        params.append('departmentIds', selectedDepartments.join(','));
      }

      // Fetch export data from API
      const response = await axios.get<ExportData[]>(getApiUrl(`EmployeeDevelopmentPlans/export?${params.toString()}`));
      const exportData = response.data;

      if (exportData.length === 0) {
        alert('No data to export with the selected filters.');
        setLoadingExport(false);
        return;
      }

      // Prepare CSV content
      const headers = [
        'Year', 
        'Department', 
        'Position', 
        'Employee Name', 
        'Domain', 
        'Category', 
        'Competency', 
        'Learning Method', 
        'Priority', 
        'Target Date', 
        'Status'
      ];
      const csvRows = [headers.join(',')];

      // Escape values that might contain commas or quotes
      const escapeCSV = (value: string | number) => {
        const strValue = String(value);
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      };

      // Add data rows
      exportData.forEach(data => {
        const row = [
          escapeCSV(data.year),
          escapeCSV(data.department),
          escapeCSV(data.position),
          escapeCSV(data.employeeName),
          escapeCSV(data.domain),
          escapeCSV(data.category),
          escapeCSV(data.competency),
          escapeCSV(data.learningMethod),
          escapeCSV(data.priority),
          escapeCSV(data.targetDate),
          escapeCSV(data.status)
        ];
        csvRows.push(row.join(','));
      });

      // Create CSV content
      const csvContent = csvRows.join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Generate filename
      const deptFilter = selectedDepartments.length > 0 ? '_Filtered' : '_All';
      const filename = `Development_Plan_${exportYear}${deptFilter}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Close modal
      setShowExportModal(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setLoadingExport(false);
    }
  };

  const filteredPlans = plans;

  // Group plans by domainName (from competency)
  const plansByDomain: { [domain: string]: PlanFormData[] } = {};
  filteredPlans.forEach(plan => {
    const comp = competencies.find(c => c.competencyID === Number(plan.competencyID));
    const domain = comp?.domainName || 'Other';
    if (!plansByDomain[domain]) plansByDomain[domain] = [];
    plansByDomain[domain].push(plan);
  });
  // Get domain order from domains list, fallback to alphabetical
  const domainOrder = [
    ...domains.map(d => d.domainName),
    ...Object.keys(plansByDomain).filter(d => !domains.some(dom => dom.domainName === d) && d !== 'Other').sort(),
    ...(plansByDomain['Other'] ? ['Other'] : [])
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Sectioned Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl text-left font-semibold text-gray-900">Development Plan</h2>
          <p className="text-sm text-gray-600">Manage your annual development plans and learning goals</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="mr-2 font-semibold">Year:</label>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {getYearOptions().map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          {canManage && (
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto ml-4"
              onClick={handleExport}
              title="Export Development Plans with filters"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          )}
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto ml-4"
            onClick={handleAddNew}
            disabled={filteredPlans.length >= 10}
          >
            <Plus className="w-4 h-4" />
            <span>Add Development Plan</span>
          </button>
        </div>
      </div>
      {/* Sectioned Body */}
      <div className="p-6">
        {/* Table (desktop) */}
        <div className="hidden lg:block space-y-8">
          {domainOrder.map(domainName => (
            plansByDomain[domainName] ? (
              <div key={domainName}>
                <h3 className="text-lg text-left font-semibold text-gray-900 mb-2">{domainName}</h3>
                <div className="max-h-[calc(100vh-350px)] overflow-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Competency</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Learning Method</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Priority</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Target Date</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {plansByDomain[domainName].map((plan, idx) => {
                        const comp = competencies.find(c => c.competencyID === Number(plan.competencyID));
                        return (
                          <tr key={plan.developmentPlanID || idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">{comp ? comp.competencyName : plan.competencyName || 'Unknown Skill'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{plan.learningWay}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{plan.priority}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{plan.targetDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{plan.status}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2 justify-start">
                                <button className="text-blue-600 hover:text-blue-900 p-1" onClick={() => handleEdit(filteredPlans.findIndex(p => p === plan))}><Edit className="w-4 h-4" /></button>
                                <button className="text-red-600 hover:text-red-900 p-1" onClick={() => handleDelete(filteredPlans.findIndex(p => p === plan))}><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null
          ))}
        </div>
        {/* Mobile Cards View */}
        <div className="lg:hidden space-y-8">
          {domainOrder.map(domainName => (
            plansByDomain[domainName] ? (
              <div key={domainName}>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{domainName}</h3>
                {plansByDomain[domainName].map((plan, idx) => {
                  const comp = competencies.find(c => c.competencyID === Number(plan.competencyID));
                  return (
                    <div key={plan.developmentPlanID || idx} className="bg-gray-50 rounded-lg border p-4 flex flex-col gap-2 mb-2">
                      <div className="font-semibold text-gray-900">{comp ? comp.competencyName : plan.competencyName || 'Unknown Skill'}</div>
                      <div className="text-sm text-gray-700">Learning Way: <span className="font-medium text-gray-900">{plan.learningWay}</span></div>
                      <div className="text-sm text-gray-700">Priority: <span className="font-medium text-gray-900">{plan.priority}</span></div>
                      <div className="text-sm text-gray-700">Target Date: <span className="font-medium text-gray-900">{plan.targetDate}</span></div>
                      <div className="text-sm text-gray-700">Status: <span className="font-medium text-gray-900">{plan.status}</span></div>
                      <div className="flex space-x-2 pt-2">
                        <button className="text-blue-600 hover:text-blue-900 p-1" onClick={() => handleEdit(filteredPlans.findIndex(p => p === plan))}><Edit className="w-4 h-4" /></button>
                        <button className="text-red-600 hover:text-red-900 p-1" onClick={() => handleDelete(filteredPlans.findIndex(p => p === plan))}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null
          ))}
        </div>
      </div>
      {/* Modal for adding/editing plan */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingIndex !== null ? 'Edit Development Plan' : 'Add Development Plan'}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setFormData(defaultFormData); setEditingIndex(null); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skill *</label>
                <select
                  value={formData.competencyID}
                  onChange={e => handleInputChange('competencyID', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.competencyID ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={loadingCompetencies}
                >
                  <option value="">Select a skill</option>
                  {competencies.map(c => (
                    <option key={c.competencyID} value={c.competencyID}>{c.competencyName}</option>
                  ))}
                </select>
                {errors.competencyID && <p className="mt-1 text-sm text-red-600">{errors.competencyID}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Learning Way *</label>
                <select
                  value={formData.learningWay}
                  onChange={e => handleInputChange('learningWay', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.learningWay ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select learning way</option>
                  {LEARNING_WAYS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                {errors.learningWay && <p className="mt-1 text-sm text-red-600">{errors.learningWay}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                <select
                  value={formData.priority}
                  onChange={e => handleInputChange('priority', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.priority ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select priority</option>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.priority && <p className="mt-1 text-sm text-red-600">{errors.priority}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Date *</label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={e => handleInputChange('targetDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.targetDate ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.targetDate && <p className="mt-1 text-sm text-red-600">{errors.targetDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  value={formData.status}
                  onChange={e => handleInputChange('status', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.status ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select status</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setFormData(defaultFormData); setEditingIndex(null); }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={loadingPlans}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loadingPlans}
                >
                  {editingIndex !== null ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Export Development Plans</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Year Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                <select
                  value={exportYear}
                  onChange={e => setExportYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Year</option>
                  {getYearOptions(5).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Departments</label>
                  <button
                    type="button"
                    onClick={handleSelectAllDepartments}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {selectedDepartments.length === departments.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                  {departments.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No departments available</div>
                  ) : (
                    <div className="p-2">
                      {departments.map(dept => (
                        <label
                          key={dept.departmentID}
                          className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDepartments.includes(dept.departmentID)}
                            onChange={() => handleDepartmentToggle(dept.departmentID)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-3 text-sm text-gray-900">
                            {dept.departmentName}
                            {dept.companyName && (
                              <span className="ml-2 text-gray-500">({dept.companyName})</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedDepartments.length === 0 
                    ? 'No departments selected - will export all departments' 
                    : `${selectedDepartments.length} department(s) selected`}
                </p>
              </div>

              {/* Export Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The export will include all development plans matching the selected filters with the following columns:
                </p>
                <ul className="mt-2 text-xs text-blue-700 list-disc list-inside">
                  <li>Year, Department, Position, Employee Name</li>
                  <li>Domain, Category, Competency</li>
                  <li>Learning Method, Priority, Target Date, Status</li>
                </ul>
              </div>
            </div>

            <div className="flex space-x-3 p-6 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loadingExport}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={performExport}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                disabled={loadingExport || !exportYear}
              >
                {loadingExport ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export to CSV</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevelopmentPlan; 