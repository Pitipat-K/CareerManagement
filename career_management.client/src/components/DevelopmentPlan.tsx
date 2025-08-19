import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import { Plus, Edit, Trash2, X } from 'lucide-react';

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

  // Get employeeId from localStorage
  const employeeId = getCurrentEmployeeId();

  useEffect(() => {
    fetchCompetencies();
    fetchDomains();
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
    </div>
  );
};

export default DevelopmentPlan; 