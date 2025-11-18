import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, X, Clipboard, ChevronDown, Check, Save, Package, Globe, Lock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import { useModulePermissions } from '../hooks/usePermissions';

interface PositionWithCompetencyCount {
    positionID: number;
    positionTitle: string;
    positionDescription?: string;
    departmentName?: string;
    isActive: boolean;
    assignedCompetenciesCount: number;
}

interface PositionCompetencyRequirement {
    requirementID: number;
    positionID: number;
    competencyID: number;
    requiredLevel: number;
    isMandatory: boolean;
    createdDate: string;
    modifiedDate: string;
    modifiedBy?: number;
    isActive: boolean;
    competencyName?: string;
    categoryName?: string;
    domainName?: string;
    modifiedByEmployeeName?: string;
}

interface Competency {
    competencyID: number;
    competencyName: string;
    categoryName?: string;
    domainName?: string;
}

interface CompetencyRequirementFormData {
    competencyID: string;
    requiredLevel: string;
    isMandatory: boolean;
}

interface CompetencySet {
    setID: number;
    setName: string;
    description?: string;
    isPublic: boolean;
    createdBy: number;
    createdByEmployeeName?: string;
    createdDate: string;
    modifiedDate: string;
    isActive: boolean;
    competencyCount: number;
}

interface CompetencySetItem {
    itemID: number;
    setID: number;
    competencyID: number;
    requiredLevel: number;
}

type SortField = 'competencyName' | 'categoryName' | 'domainName' | 'requiredLevel';
type SortDirection = 'asc' | 'desc';

const CompetencyAssign = () => {
    const { canCreate, canRead, canUpdate, canDelete } = useModulePermissions('COMP_ASSIGN');
    const [positions, setPositions] = useState<PositionWithCompetencyCount[]>([]);
    const [competencies, setCompetencies] = useState<Competency[]>([]);
    const [selectedPosition, setSelectedPosition] = useState<PositionWithCompetencyCount | null>(null);
    const [requirements, setRequirements] = useState<PositionCompetencyRequirement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRequirement, setEditingRequirement] = useState<PositionCompetencyRequirement | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [sortField, setSortField] = useState<SortField>('domainName');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [formData, setFormData] = useState<CompetencyRequirementFormData>({
        competencyID: '',
        requiredLevel: '0',
        isMandatory: true
    });
    const [errors, setErrors] = useState<Partial<CompetencyRequirementFormData>>({});
    const [isCompetencyDropdownOpen, setIsCompetencyDropdownOpen] = useState(false);
    const [competencySearchTerm, setCompetencySearchTerm] = useState('');
    const competencyDropdownRef = useRef<HTMLDivElement>(null);
    
    // New state for inline editing
    const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
    const [inlineEditingLevel, setInlineEditingLevel] = useState<string>('');
    const [inlineSubmitting, setInlineSubmitting] = useState(false);
    
    // Competency set state
    const [competencySets, setCompetencySets] = useState<CompetencySet[]>([]);
    const [showCompetencySetModal, setShowCompetencySetModal] = useState(false);
    const [] = useState<CompetencySet | null>(null);
    const [appliedSetIds, setAppliedSetIds] = useState<Set<number>>(new Set());
    const [checkingAppliedSets, setCheckingAppliedSets] = useState(false);

    useEffect(() => {
        if (canRead) {
            fetchPositions();
            fetchCompetencies();
            fetchCompetencySets();
        }
    }, [canRead]);

    // Check applied sets when modal opens and data is ready
    useEffect(() => {
        if (showCompetencySetModal && selectedPosition && requirements.length > 0 && competencySets.length > 0) {
            checkAppliedSets(requirements);
        }
    }, [showCompetencySetModal]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (competencyDropdownRef.current && !competencyDropdownRef.current.contains(event.target as Node)) {
                setIsCompetencyDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchPositions = async () => {
        try {
            const response = await axios.get(getApiUrl('positioncompetencyrequirements/positions'));
            setPositions(response.data);
        } catch (error) {
            console.error('Error fetching positions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompetencies = async () => {
        try {
            const response = await axios.get(getApiUrl('competencies'));
            setCompetencies(response.data);
        } catch (error) {
            console.error('Error fetching competencies:', error);
        }
    };

    const fetchCompetencySets = async () => {
        try {
            const response = await axios.get(getApiUrl('competencysets'));
            const currentEmployeeId = getCurrentEmployeeId();
            
            // Filter to show: all public sets + only user's own private sets
            const filteredSets = response.data.filter((set: CompetencySet) => 
                set.isPublic || set.createdBy === currentEmployeeId
            );
            
            setCompetencySets(filteredSets);
        } catch (error) {
            console.error('Error fetching competency sets:', error);
        }
    };

    const getCurrentEmployeeId = (): number | null => {
        const currentEmployee = localStorage.getItem('currentEmployee');
        return currentEmployee ? JSON.parse(currentEmployee).employeeID : null;
    };

    const fetchRequirements = async (positionId: number) => {
        try {
            const response = await axios.get(getApiUrl(`positioncompetencyrequirements/position/${positionId}`));
            setRequirements(response.data);
            // After fetching requirements, check which competency sets are applied
            await checkAppliedSets(response.data);
        } catch (error) {
            console.error('Error fetching requirements:', error);
        }
    };

    const checkAppliedSets = async (currentRequirements: PositionCompetencyRequirement[]) => {
        if (competencySets.length === 0 || currentRequirements.length === 0) {
            setAppliedSetIds(new Set());
            return;
        }

        setCheckingAppliedSets(true);
        const appliedIds = new Set<number>();

        try {
            // Check each competency set to see if it's applied
            await Promise.all(
                competencySets.map(async (set) => {
                    try {
                        const response = await axios.get(getApiUrl(`competencysets/${set.setID}/items`));
                        const setItems: CompetencySetItem[] = response.data;

                        // Check if all items in the set exist in current requirements with same or higher level
                        const isFullyApplied = setItems.every((item) => {
                            const matchingReq = currentRequirements.find(
                                (req) => req.competencyID === item.competencyID
                            );
                            return matchingReq && matchingReq.requiredLevel >= item.requiredLevel;
                        });

                        if (isFullyApplied && setItems.length > 0) {
                            appliedIds.add(set.setID);
                        }
                    } catch (error) {
                        console.error(`Error checking set ${set.setID}:`, error);
                    }
                })
            );

            setAppliedSetIds(appliedIds);
        } catch (error) {
            console.error('Error checking applied sets:', error);
        } finally {
            setCheckingAppliedSets(false);
        }
    };

    const handlePositionClick = async (position: PositionWithCompetencyCount) => {
        setSelectedPosition(position);
        await fetchRequirements(position.positionID);
    };

    const handleDelete = async (id: number) => {
        if (!canDelete) {
            alert('You do not have permission to delete competency assignments.');
            return;
        }
        
        if (window.confirm('Are you sure you want to remove this competency requirement?')) {
            // Get current employee ID from localStorage
            const currentEmployee = localStorage.getItem('currentEmployee');
            const currentEmployeeId = currentEmployee ? JSON.parse(currentEmployee).employeeID : null;

            if (!currentEmployeeId) {
                alert('Please log in to perform this action.');
                return;
            }

            try {
                await axios.delete(getApiUrl(`positioncompetencyrequirements/${id}?modifiedBy=${currentEmployeeId}`));
                if (selectedPosition) {
                    await fetchRequirements(selectedPosition.positionID);
                    await fetchPositions(); // Refresh position list to update counts
                }
            } catch (error) {
                console.error('Error deleting requirement:', error);
            }
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<CompetencyRequirementFormData> = {};

        if (!formData.competencyID.trim()) {
            newErrors.competencyID = 'Competency is required';
        }

        const requiredLevel = parseInt(formData.requiredLevel);
        if (isNaN(requiredLevel) || requiredLevel < 0 || requiredLevel > 4) {
            newErrors.requiredLevel = 'Required level must be between 0 and 4';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !selectedPosition) {
            return;
        }

        // Get current employee ID from localStorage
        const currentEmployee = localStorage.getItem('currentEmployee');
        const currentEmployeeId = currentEmployee ? JSON.parse(currentEmployee).employeeID : null;

        if (!currentEmployeeId) {
            alert('Please log in to perform this action.');
            return;
        }

        setSubmitting(true);
        try {
            const requirementData = {
                positionID: selectedPosition.positionID,
                competencyID: parseInt(formData.competencyID),
                requiredLevel: parseInt(formData.requiredLevel),
                isMandatory: formData.isMandatory,
                modifiedBy: currentEmployeeId
            };

            if (editingRequirement) {
                // Update existing requirement
                await axios.put(getApiUrl(`positioncompetencyrequirements/${editingRequirement.requirementID}`), {
                    ...requirementData,
                    requirementID: editingRequirement.requirementID
                });
            } else {
                // Create new requirement
                await axios.post(getApiUrl('positioncompetencyrequirements'), requirementData);
            }

            // Reset form and close modal
            setFormData({
                competencyID: '',
                requiredLevel: '0',
                isMandatory: true
            });
            setErrors({});
            setShowModal(false);
            setEditingRequirement(null);

            // Refresh the requirements list and positions
            if (selectedPosition) {
                await fetchRequirements(selectedPosition.positionID);
                await fetchPositions();
            }
        } catch (error: any) {
            console.error('Error saving requirement:', error);
            if (error.response?.data) {
                alert(error.response.data);
            } else {
                alert(`Failed to ${editingRequirement ? 'update' : 'create'} requirement. Please try again.`);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (field: keyof CompetencyRequirementFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleCloseModal = () => {
        setFormData({
            competencyID: '',
            requiredLevel: '0',
            isMandatory: true
        });
        setErrors({});
        setShowModal(false);
        setEditingRequirement(null);
        setCompetencySearchTerm('');
        setIsCompetencyDropdownOpen(false);
    };


    const handleInlineEdit = (requirement: PositionCompetencyRequirement) => {
        if (!canUpdate) {
            alert('You do not have permission to edit competency requirements.');
            return;
        }
        
        setInlineEditingId(requirement.requirementID);
        setInlineEditingLevel(requirement.requiredLevel.toString());
    };

    const handleInlineSave = async (requirementId: number) => {
        if (!canUpdate) {
            alert('You do not have permission to update competency requirements.');
            return;
        }
        
        const newLevel = parseInt(inlineEditingLevel);
        if (isNaN(newLevel) || newLevel < 0 || newLevel > 4) {
            alert('Required level must be between 0 and 4.');
            return;
        }

        // Get current employee ID from localStorage
        const currentEmployee = localStorage.getItem('currentEmployee');
        const currentEmployeeId = currentEmployee ? JSON.parse(currentEmployee).employeeID : null;

        if (!currentEmployeeId) {
            alert('Please log in to perform this action.');
            return;
        }

        // Find the current requirement to get all required fields
        const currentRequirement = requirements.find(r => r.requirementID === requirementId);
        if (!currentRequirement) {
            alert('Requirement not found. Please refresh the page and try again.');
            return;
        }

        setInlineSubmitting(true);
        try {
            await axios.put(getApiUrl(`positioncompetencyrequirements/${requirementId}`), {
                requirementID: requirementId,
                positionID: currentRequirement.positionID,
                competencyID: currentRequirement.competencyID,
                requiredLevel: newLevel,
                isMandatory: currentRequirement.isMandatory,
                isActive: currentRequirement.isActive,
                modifiedBy: currentEmployeeId
            });
            
            // Refresh the requirements list
            if (selectedPosition) {
                await fetchRequirements(selectedPosition.positionID);
                await fetchPositions(); // Refresh position list to update counts
            }
            
            setInlineEditingId(null);
            setInlineEditingLevel('');
        } catch (error: any) {
            console.error('Error saving inline edit:', error);
            if (error.response?.data) {
                alert(error.response.data);
            } else {
                alert('Failed to save inline edit. Please try again.');
            }
        } finally {
            setInlineSubmitting(false);
        }
    };

    const handleInlineCancel = () => {
        setInlineEditingId(null);
        setInlineEditingLevel('');
    };

    const handleAddNew = () => {
        if (!canCreate) {
            alert('You do not have permission to add competency requirements.');
            return;
        }
        
        setEditingRequirement(null);
        setFormData({
            competencyID: '',
            requiredLevel: '0',
            isMandatory: true
        });
        setErrors({});
        setShowModal(true);
        setCompetencySearchTerm('');
        setIsCompetencyDropdownOpen(false);
    };

    const filteredPositions = positions.filter(position =>
        position.positionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.departmentName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter competencies for searchable dropdown, EXCLUDING already assigned
    const assignedCompetencyIds = requirements.map(r => r.competencyID.toString());
    const filteredCompetencies = competencies.filter(competency =>
        !assignedCompetencyIds.includes(competency.competencyID.toString()) &&
        (
            competency.competencyName.toLowerCase().includes(competencySearchTerm.toLowerCase()) ||
            competency.categoryName?.toLowerCase().includes(competencySearchTerm.toLowerCase()) ||
            competency.domainName?.toLowerCase().includes(competencySearchTerm.toLowerCase())
        )
    );

    // Get selected competency display name
    const getSelectedCompetencyName = () => {
        if (!formData.competencyID) return '';
        const selectedCompetency = competencies.find(c => c.competencyID.toString() === formData.competencyID);
        if (!selectedCompetency) return '';
        return `${selectedCompetency.competencyName}${selectedCompetency.categoryName ? ` (${selectedCompetency.categoryName})` : ''}`;
    };

    const handleCompetencySelect = (competencyId: string) => {
        setFormData(prev => ({ ...prev, competencyID: competencyId }));
        setIsCompetencyDropdownOpen(false);
        setCompetencySearchTerm('');
        if (errors.competencyID) {
            setErrors(prev => ({ ...prev, competencyID: undefined }));
        }
    };

    const handleApplyCompetencySet = async (competencySet: CompetencySet) => {
        if (!canCreate) {
            alert('You do not have permission to apply competency sets.');
            return;
        }
        
        if (!selectedPosition) {
            alert('Please select a position first.');
            return;
        }

        if (!window.confirm(`Are you sure you want to apply the competency set "${competencySet.setName}" to "${selectedPosition.positionTitle}"? This will keep existing competencies and update any duplicates with values from the set.`)) {
            return;
        }

        const currentEmployeeId = getCurrentEmployeeId();
        if (!currentEmployeeId) {
            alert('Please log in to perform this action.');
            return;
        }

        try {
            await axios.post(getApiUrl(`competencysets/${competencySet.setID}/apply-to-position`), {
                positionID: selectedPosition.positionID,
                modifiedBy: currentEmployeeId
            });

            // Refresh the requirements and position list
            await fetchRequirements(selectedPosition.positionID);
            await fetchPositions();
            alert(`Competency set "${competencySet.setName}" has been successfully applied to "${selectedPosition.positionTitle}".`);
            // Keep the modal open so user can see the updated status
        } catch (error) {
            console.error('Error applying competency set:', error);
            alert('Error applying competency set. Please try again.');
        }
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

    // Sort requirements by selected field and direction
    const sortedRequirements = requirements.sort((a, b) => {
        let aValue: string | number = '';
        let bValue: string | number = '';
        
        if (sortField === 'requiredLevel') {
            aValue = a.requiredLevel;
            bValue = b.requiredLevel;
            const comparison = aValue - bValue;
            return sortDirection === 'asc' ? comparison : -comparison;
        } else {
            aValue = (a[sortField] || '').toString();
            bValue = (b[sortField] || '').toString();
            const comparison = aValue.localeCompare(bValue);
            return sortDirection === 'asc' ? comparison : -comparison;
        }
    });

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
                    <h2 className="text-xl text-left sm:text-2xl font-bold text-gray-900">Competency Assignment</h2>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search positions or departments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Positions List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Positions</h3>
                        </div>
                        <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                            {filteredPositions.map((position) => (
                                <div
                                    key={position.positionID}
                                    onClick={() => handlePositionClick(position)}
                                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedPosition?.positionID === position.positionID ? 'bg-blue-50 border-blue-200' : ''
                                        }`}
                                >
                                    <div className="flex justify-between items-start text-left">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{position.positionTitle}</h4>
                                            {position.departmentName && (
                                                <p className="text-sm text-gray-600">{position.departmentName}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${position.assignedCompetenciesCount > 0
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-blue-50 text-blue-800'
                                                }`}>
                                                {position.assignedCompetenciesCount} competencies
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Competency Requirements */}
                <div className="lg:col-span-3">
                    {selectedPosition ? (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Competencies for {selectedPosition.positionTitle}
                                    </h3>
                                    <p className="text-sm text-left">
                                        <span className={`font-medium ${requirements.filter(r => r.requiredLevel === 0).length > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                            {requirements.filter(r => r.requiredLevel > 0).length}/{requirements.length}
                                        </span>
                                        <span className="text-gray-600"> assigned competencies</span>
                                        {requirements.filter(r => r.requiredLevel === 0).length > 0 && (
                                            <span className="text-red-500 text-xs ml-2">
                                                ({requirements.filter(r => r.requiredLevel === 0).length} without targets)
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    {canCreate && (
                                        <button
                                            onClick={() => setShowCompetencySetModal(true)}
                                            className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                        >
                                            <Package className="w-4 h-4 mr-2" />
                                            Apply Set
                                        </button>
                                    )}
                                    {canCreate && (
                                        <button
                                            onClick={handleAddNew}
                                            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Competency
                                        </button>
                                    )}
                                    {inlineEditingId !== null && (
                                        <button
                                            onClick={() => setInlineEditingId(null)}
                                            className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                                            title="Close inline editing mode"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Close Edit
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="overflow-x-auto -mx-3 sm:mx-0">
                                <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                                                    No.
                                                </th>
                                                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                                                    Actions
                                                </th>
                                                <th 
                                                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 cursor-pointer hover:bg-gray-100 select-none"
                                                    onClick={() => handleSort('competencyName')}
                                                >
                                                    <div className="flex items-center space-x-1">
                                                        <span>Competency Name</span>
                                                        {getSortIcon('competencyName')}
                                                    </div>
                                                </th>
                                                <th 
                                                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 cursor-pointer hover:bg-gray-100 select-none"
                                                    onClick={() => handleSort('categoryName')}
                                                >
                                                    <div className="flex items-center space-x-1">
                                                        <span>Category</span>
                                                        {getSortIcon('categoryName')}
                                                    </div>
                                                </th>
                                                <th 
                                                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 cursor-pointer hover:bg-gray-100 select-none"
                                                    onClick={() => handleSort('domainName')}
                                                >
                                                    <div className="flex items-center space-x-1">
                                                        <span>Domain</span>
                                                        {getSortIcon('domainName')}
                                                    </div>
                                                </th>
                                                <th 
                                                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 cursor-pointer hover:bg-gray-100 select-none"
                                                    onClick={() => handleSort('requiredLevel')}
                                                >
                                                    <div className="flex items-center space-x-1">
                                                        <span>Required</span>
                                                        {getSortIcon('requiredLevel')}
                                                    </div>
                                                </th>
                                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                                                    Modified By
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {sortedRequirements.map((requirement, index) => (
                                                <tr key={requirement.requirementID} className="hover:bg-gray-50">
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {index + 1}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            {canUpdate && (
                                                                <button
                                                                    onClick={() => handleInlineEdit(requirement)}
                                                                    className="text-blue-600 hover:text-blue-900 p-1"
                                                                    title="Edit Required Level"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {canDelete && (
                                                                <button
                                                                    onClick={() => handleDelete(requirement.requirementID)}
                                                                    className="text-red-600 hover:text-red-900 p-1"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-left">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {requirement.competencyName}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-left">
                                                        <div className="text-sm text-gray-900">
                                                            {requirement.categoryName}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-left">
                                                        <div className="text-sm text-gray-900">
                                                            {requirement.domainName}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-left">
                                                        {inlineEditingId === requirement.requirementID ? (
                                                            <div className="flex items-center space-x-2">
                                                                <select
                                                                    value={inlineEditingLevel}
                                                                    onChange={(e) => setInlineEditingLevel(e.target.value)}
                                                                    className="px-2 py-1 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                                                                    disabled={inlineSubmitting}
                                                                >
                                                                    <option value="0">Level 0</option>
                                                                    <option value="1">Level 1</option>
                                                                    <option value="2">Level 2</option>
                                                                    <option value="3">Level 3</option>
                                                                    <option value="4">Level 4</option>
                                                                </select>
                                                                <button
                                                                    onClick={() => handleInlineSave(requirement.requirementID)}
                                                                    className="text-green-600 hover:text-green-900 p-1"
                                                                    disabled={inlineSubmitting}
                                                                    title="Save changes"
                                                                >
                                                                    {inlineSubmitting ? (
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                                                    ) : (
                                                                        <Save className="w-4 h-4" />
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={handleInlineCancel}
                                                                    className="text-red-600 hover:text-red-900 p-1"
                                                                    disabled={inlineSubmitting}
                                                                    title="Cancel editing"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-gray-900">
                                                                Level {requirement.requiredLevel}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-left">
                                                        <div className="text-sm text-gray-900">
                                                            {requirement.modifiedByEmployeeName ?? '-'}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {requirement.modifiedDate ? new Date(requirement.modifiedDate).toLocaleString() : '-'}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow p-8">
                            <div className="text-center">
                                <Clipboard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Select a Position
                                </h3>
                                <p className="text-gray-600">
                                    Choose a position from the list to view and manage its competency requirements.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && selectedPosition && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={handleCloseModal}
                >
                    <div 
                        className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingRequirement ? 'Edit Competency Requirement' : 'Add Competency Requirement'}
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
                                    Position
                                </label>
                                <input
                                    type="text"
                                    value={selectedPosition.positionTitle}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Competency *
                                </label>
                                <div className="relative" ref={competencyDropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => setIsCompetencyDropdownOpen(!isCompetencyDropdownOpen)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between bg-white ${errors.competencyID ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    >
                                        <span className={formData.competencyID ? 'text-gray-900' : 'text-gray-500'}>
                                            {formData.competencyID ? getSelectedCompetencyName() : 'Select a competency'}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCompetencyDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isCompetencyDropdownOpen && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                                            <div className="p-2 border-b border-gray-200 bg-white">
                                                <div className="relative">
                                                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search competencies..."
                                                        value={competencySearchTerm}
                                                        onChange={(e) => setCompetencySearchTerm(e.target.value)}
                                                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white placeholder:text-blue-500 text-gray-900"
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            <div className="max-h-48 overflow-y-auto bg-white">
                                                {filteredCompetencies.length > 0 ? (
                                                    filteredCompetencies.map((competency) => (
                                                        <button
                                                            key={competency.competencyID}
                                                            type="button"
                                                            onClick={() => handleCompetencySelect(competency.competencyID.toString())}
                                                            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between text-gray-900 bg-white"
                                                        >
                                                            <div className="truncate">
                                                                {competency.competencyName}{competency.categoryName && ` (${competency.categoryName})`}
                                                            </div>
                                                            {formData.competencyID === competency.competencyID.toString() && (
                                                                <Check className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                                                            )}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-2 text-sm text-gray-500 bg-white">No competencies found</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {errors.competencyID && (
                                    <p className="mt-1 text-sm text-red-600">{errors.competencyID}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Required Level *
                                </label>
                                <select
                                    value={formData.requiredLevel}
                                    onChange={(e) => handleInputChange('requiredLevel', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.requiredLevel ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                >
                                    <option value="0">Level 0 - Not Required</option>
                                    <option value="1">Level 1 - Basic</option>
                                    <option value="2">Level 2 - Intermediate</option>
                                    <option value="3">Level 3 - Advanced</option>
                                    <option value="4">Level 4 - Expert</option>
                                </select>
                                {errors.requiredLevel && (
                                    <p className="mt-1 text-sm text-red-600">{errors.requiredLevel}</p>
                                )}
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isMandatory"
                                    checked={formData.isMandatory}
                                    onChange={(e) => handleInputChange('isMandatory', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isMandatory" className="ml-2 block text-sm text-gray-900">
                                    Mandatory requirement
                                </label>
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
                                    {submitting ? 'Saving...' : editingRequirement ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Competency Set Modal */}
            {showCompetencySetModal && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setShowCompetencySetModal(false)}
                >
                    <div 
                        className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Apply Competency Set</h2>
                            <button
                                onClick={() => setShowCompetencySetModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="mb-4">
                            <p className="text-gray-600">
                                Select a competency set to apply to "{selectedPosition?.positionTitle}". 
                                This will keep existing competencies and update any duplicates with values from the set.
                            </p>
                            {checkingAppliedSets && (
                                <div className="mt-2 flex items-center text-sm text-blue-600">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                    Checking which sets are already applied...
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            {competencySets.map((set) => {
                                const isApplied = appliedSetIds.has(set.setID);
                                return (
                                    <div 
                                        key={set.setID} 
                                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                                            isApplied 
                                                ? 'bg-green-50 border-green-500' 
                                                : 'bg-gray-50 border-transparent'
                                        }`}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                {set.isPublic ? (
                                                    <Globe className="w-4 h-4 text-blue-600" />
                                                ) : (
                                                    <Lock className="w-4 h-4 text-gray-600" />
                                                )}
                                                <h4 className="font-medium text-gray-900">{set.setName}</h4>
                                                {isApplied && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
                                                        <Check className="w-3 h-3 mr-1" />
                                                        Already Applied
                                                    </span>
                                                )}
                                            </div>
                                            {set.description && (
                                                <p className="text-sm text-left text-gray-600 mb-2">{set.description}</p>
                                            )}
                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                <span>{set.competencyCount} competencies</span>
                                                <span>by {set.createdByEmployeeName || 'Unknown'}</span>
                                            </div>
                                        </div>
                                        {canCreate && (
                                            <button
                                                onClick={() => handleApplyCompetencySet(set)}
                                                className={`px-4 py-2 rounded-lg transition-colors ${
                                                    isApplied
                                                        ? 'bg-gray-400 text-white hover:bg-gray-500'
                                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                                }`}
                                            >
                                                {isApplied ? 'Reapply Set' : 'Apply Set'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        {competencySets.length === 0 && (
                            <p className="text-gray-500 text-center py-8">No competency sets available.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompetencyAssign; 