import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, X, Copy, Eye, Globe, Lock, Users, Minus, ArrowUp, ArrowDown, Filter, Briefcase, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import axios from '../utils/axiosConfig';
import { getApiUrl } from '../config/api';
import { useModulePermissions } from '../hooks/usePermissions';

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
    assignedPositionsCount?: number;
    outOfSyncPositionsCount?: number;
}

interface CompetencySetItem {
    itemID: number;
    setID: number;
    competencyID: number;
    competencyName: string;
    competencyDescription?: string;
    categoryName?: string;
    domainName?: string;
    requiredLevel: number;
    isMandatory: boolean;
    displayOrder: number;
    createdDate: string;
}

interface Competency {
    competencyID: number;
    competencyName: string;
    competencyDescription?: string;
    categoryName?: string;
    domainName?: string;
}

interface Position {
    positionID: number;
    positionTitle: string;
    departmentName?: string;
}

interface CompetencySetFormData {
    setName: string;
    description: string;
    isPublic: boolean;
}

interface CopyFromPositionFormData {
    setName: string;
    description: string;
    isPublic: boolean;
    positionID: string;
}

interface EditableCompetencySetItem {
    itemID?: number;
    competencyID: number;
    competencyName: string;
    competencyDescription?: string;
    categoryName?: string;
    domainName?: string;
    requiredLevel: number;
    isMandatory: boolean;
    displayOrder: number;
    isNew?: boolean;
}

interface PositionAssignment {
    assignmentID: number;
    positionID: number;
    setID: number;
    positionTitle: string;
    departmentName?: string;
    assignedDate: string;
    lastSyncedDate: string;
    isSynced: boolean;
    assignedByName: string;
    competencyCount?: number;
}

interface CompetencyChange {
    competencyID: number;
    competencyName: string;
    categoryName?: string;
    domainName?: string;
    changeType: 'added' | 'removed' | 'modified';
    oldLevel?: number;
    newLevel?: number;
    oldIsMandatory?: boolean;
    newIsMandatory?: boolean;
}

interface PositionSetChanges {
    positionID: number;
    positionTitle: string;
    assignmentID: number;
    changes: CompetencyChange[];
}

const CompetencySets = () => {
    const { canCreate, canRead, canUpdate, canDelete, loading: permissionsLoading, hasAnyPermission } = useModulePermissions('COMP_SETS');
    const [competencySets, setCompetencySets] = useState<CompetencySet[]>([]);
    const [competencies, setCompetencies] = useState<Competency[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [selectedSet, setSelectedSet] = useState<CompetencySet | null>(null);
    const [setItems, setSetItems] = useState<CompetencySetItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [showItemsModal, setShowItemsModal] = useState(false);
    const [showPositionManagerModal, setShowPositionManagerModal] = useState(false);
    const [showChangesModal, setShowChangesModal] = useState(false);
    const [editingSet, setEditingSet] = useState<CompetencySet | null>(null);
    const [editingSetItems, setEditingSetItems] = useState<EditableCompetencySetItem[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<CompetencySetFormData>({
        setName: '',
        description: '',
        isPublic: false
    });
    const [copyFormData, setCopyFormData] = useState<CopyFromPositionFormData>({
        setName: '',
        description: '',
        isPublic: false,
        positionID: ''
    });
    const [errors, setErrors] = useState<Partial<CompetencySetFormData>>({});
    const [copyErrors, setCopyErrors] = useState<Partial<CopyFromPositionFormData>>({});
    const [filterPublic, setFilterPublic] = useState<boolean | null>(null);
    const [showCompetencySelector, setShowCompetencySelector] = useState(false);
    
    // Position assignment state
    const [assignedPositions, setAssignedPositions] = useState<PositionAssignment[]>([]);
    const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
    const [selectedPositions, setSelectedPositions] = useState<number[]>([]);
    const [positionSetChanges, setPositionSetChanges] = useState<PositionSetChanges | null>(null);
    const [positionSearchTerm, setPositionSearchTerm] = useState('');
    const [syncSelectedPositions, setSyncSelectedPositions] = useState<number[]>([]);
    
    // Column filters state
    const [columnFilters, setColumnFilters] = useState<{
        setName: string[];
    }>({
        setName: []
    });
    
    // Temp filters for the dropdown (before Apply is clicked)
    const [tempFilters, setTempFilters] = useState<{
        setName: string[];
    }>({
        setName: []
    });
    
    // Track which filter dropdown is open
    const [openFilter, setOpenFilter] = useState<string | null>(null);
    const filterRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    
    // Search term within filter dropdowns
    const [filterSearchTerm, setFilterSearchTerm] = useState<string>('');

    useEffect(() => {
        if (canRead) {
            fetchCompetencySets();
            fetchCompetencies();
            fetchPositions();
        }
    }, [canRead, filterPublic]);

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
        const currentEmployee = localStorage.getItem('currentEmployee');
        return currentEmployee ? JSON.parse(currentEmployee).employeeID : null;
    };

    const fetchCompetencySets = async () => {
        try {
            const queryParams = filterPublic !== null ? `?isPublic=${filterPublic}` : '';
            const response = await axios.get(getApiUrl(`competencysets${queryParams}`));
            setCompetencySets(response.data);
        } catch (error) {
            console.error('Error fetching competency sets:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompetencies = async () => {
        try {
            const response = await axios.get(getApiUrl('competencies'));
            setCompetencies(response.data);
        } catch ( error) {
            console.error('Error fetching competencies:', error);
        }
    };

    const fetchPositions = async () => {
        try {
            const response = await axios.get(getApiUrl('positions'));
            setPositions(response.data);
        } catch (error) {
            console.error('Error fetching positions:', error);
        }
    };

    const fetchSetItems = async (setId: number) => {
        try {
            const response = await axios.get(getApiUrl(`competencysets/${setId}`));
            setSetItems(response.data.competencySetItems || []);
        } catch (error) {
            console.error('Error fetching set items:', error);
        }
    };

    const fetchAssignedPositions = async (setId: number) => {
        try {
            const response = await axios.get(getApiUrl(`competencysets/${setId}/positions`));
            setAssignedPositions(response.data);
        } catch (error) {
            console.error('Error fetching assigned positions:', error);
        }
    };

    const fetchAvailablePositions = async (setId: number) => {
        try {
            const response = await axios.get(getApiUrl(`competencysets/${setId}/available-positions`));
            setAvailablePositions(response.data);
        } catch (error) {
            console.error('Error fetching available positions:', error);
        }
    };

    const fetchPositionChanges = async (setId: number, positionId: number) => {
        try {
            const response = await axios.get(getApiUrl(`competencysets/${setId}/changes/${positionId}`));
            setPositionSetChanges(response.data);
            setShowChangesModal(true);
        } catch (error) {
            console.error('Error fetching position changes:', error);
        }
    };

    const handleViewItems = async (set: CompetencySet) => {
        setSelectedSet(set);
        await fetchSetItems(set.setID);
        setShowItemsModal(true);
    };

    const handleManagePositions = async (set: CompetencySet) => {
        setSelectedSet(set);
        await Promise.all([
            fetchAssignedPositions(set.setID),
            fetchAvailablePositions(set.setID)
        ]);
        setSelectedPositions([]);
        setSyncSelectedPositions([]);
        setPositionSearchTerm('');
        setShowPositionManagerModal(true);
    };

    const handleAssignPositions = async () => {
        if (!selectedSet || selectedPositions.length === 0) return;

        const currentEmployeeId = getCurrentEmployeeId();
        if (!currentEmployeeId) {
            alert('Please log in to perform this action.');
            return;
        }

        setSubmitting(true);
        try {
            for (const positionId of selectedPositions) {
                await axios.post(getApiUrl(`competencysets/${selectedSet.setID}/assign-position`), {
                    positionID: positionId,
                    assignedBy: currentEmployeeId
                });
            }

            // Refresh data
            await Promise.all([
                fetchAssignedPositions(selectedSet.setID),
                fetchAvailablePositions(selectedSet.setID),
                fetchCompetencySets()
            ]);
            setSelectedPositions([]);
        } catch (error) {
            console.error('Error assigning positions:', error);
            alert('Error assigning positions. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemovePositionAssignment = async (assignmentId: number) => {
        if (!selectedSet) return;
        
        if (!window.confirm('Are you sure you want to remove this position assignment?')) {
            return;
        }

        try {
            await axios.delete(getApiUrl(`competencysets/${selectedSet.setID}/positions/${assignmentId}`));
            await Promise.all([
                fetchAssignedPositions(selectedSet.setID),
                fetchAvailablePositions(selectedSet.setID),
                fetchCompetencySets()
            ]);
        } catch (error) {
            console.error('Error removing position assignment:', error);
            alert('Error removing assignment. Please try again.');
        }
    };

    const handleViewChanges = async (positionId: number) => {
        if (!selectedSet) return;
        await fetchPositionChanges(selectedSet.setID, positionId);
    };

    const handleSyncPositions = async () => {
        if (!selectedSet || syncSelectedPositions.length === 0) return;

        const currentEmployeeId = getCurrentEmployeeId();
        if (!currentEmployeeId) {
            alert('Please log in to perform this action.');
            return;
        }

        setSubmitting(true);
        try {
            await axios.post(getApiUrl(`competencysets/${selectedSet.setID}/sync-positions`), {
                assignmentIDs: syncSelectedPositions,
                modifiedBy: currentEmployeeId
            });

            // Refresh data
            await Promise.all([
                fetchAssignedPositions(selectedSet.setID),
                fetchCompetencySets()
            ]);
            setSyncSelectedPositions([]);
            alert('Positions synced successfully!');
        } catch (error) {
            console.error('Error syncing positions:', error);
            alert('Error syncing positions. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const togglePositionSelection = (positionId: number) => {
        setSelectedPositions(prev =>
            prev.includes(positionId)
                ? prev.filter(id => id !== positionId)
                : [...prev, positionId]
        );
    };

    const toggleSyncSelection = (assignmentId: number) => {
        setSyncSelectedPositions(prev =>
            prev.includes(assignmentId)
                ? prev.filter(id => id !== assignmentId)
                : [...prev, assignmentId]
        );
    };

    const handleDelete = async (id: number) => {
        if (!canDelete) {
            alert('You do not have permission to delete competency sets.');
            return;
        }
        
        if (window.confirm('Are you sure you want to delete this competency set?')) {
            try {
                await axios.delete(getApiUrl(`competencysets/${id}`));
                await fetchCompetencySets();
            } catch (error) {
                console.error('Error deleting competency set:', error);
            }
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<CompetencySetFormData> = {};

        if (!formData.setName.trim()) {
            newErrors.setName = 'Set name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateCopyForm = (): boolean => {
        const newErrors: Partial<CopyFromPositionFormData> = {};

        if (!copyFormData.setName.trim()) {
            newErrors.setName = 'Set name is required';
        }

        if (!copyFormData.positionID) {
            newErrors.positionID = 'Position is required';
        }

        setCopyErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleEditSet = (set: CompetencySet) => {
        setEditingSet(set);
        setFormData({
            setName: set.setName,
            description: set.description || '',
            isPublic: set.isPublic
        });
        // Load the set items for editing
        fetchSetItemsForEditing(set.setID);
        setShowModal(true);
    };

    const fetchSetItemsForEditing = async (setID: number) => {
        try {
            const response = await axios.get(getApiUrl(`competencysets/${setID}/items`));
            const items: EditableCompetencySetItem[] = response.data.map((item: CompetencySetItem) => ({
                itemID: item.itemID,
                competencyID: item.competencyID,
                competencyName: item.competencyName,
                competencyDescription: item.competencyDescription,
                categoryName: item.categoryName,
                domainName: item.domainName,
                requiredLevel: item.requiredLevel,
                isMandatory: item.isMandatory,
                displayOrder: item.displayOrder,
                isNew: false
            }));
            setEditingSetItems(items);
        } catch (error) {
            console.error('Error fetching set items for editing:', error);
            setEditingSetItems([]);
        }
    };

    const handleAddCompetencyToSet = () => {
        setShowCompetencySelector(true);
    };

    const handleSelectCompetency = (competency: Competency) => {
        const newItem: EditableCompetencySetItem = {
            competencyID: competency.competencyID,
            competencyName: competency.competencyName,
            competencyDescription: competency.competencyDescription,
            categoryName: competency.categoryName,
            domainName: competency.domainName,
            requiredLevel: 1,
            isMandatory: true,
            displayOrder: editingSetItems.length + 1,
            isNew: true
        };
        setEditingSetItems(prev => [...prev, newItem]);
        setShowCompetencySelector(false);
    };

    const handleRemoveCompetencyFromSet = (index: number) => {
        setEditingSetItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateCompetencyItem = (index: number, field: keyof EditableCompetencySetItem, value: any) => {
        setEditingSetItems(prev => prev.map((item, i) => 
            i === index ? { ...item, [field]: value } : item
        ));
    };

    const handleMoveCompetencyUp = (index: number) => {
        if (index === 0) return;
        setEditingSetItems(prev => {
            const newItems = [...prev];
            [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
            // Update display order
            newItems.forEach((item, i) => {
                item.displayOrder = i + 1;
            });
            return newItems;
        });
    };

    const handleMoveCompetencyDown = (index: number) => {
        setEditingSetItems(prev => {
            if (index === prev.length - 1) return prev;
            const newItems = [...prev];
            [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
            // Update display order
            newItems.forEach((item, i) => {
                item.displayOrder = i + 1;
            });
            return newItems;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check permissions before allowing submit
        if (editingSet && !canUpdate) {
            alert('You do not have permission to update competency sets.');
            return;
        }
        
        if (!editingSet && !canCreate) {
            alert('You do not have permission to create competency sets.');
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
            const setData = {
                ...formData,
                createdBy: editingSet ? editingSet.createdBy : currentEmployeeId
            };

            if (editingSet) {
                // Update existing set - only send the fields that can be updated
                await axios.put(getApiUrl(`competencysets/${editingSet.setID}`), {
                    setName: formData.setName,
                    description: formData.description,
                    isPublic: formData.isPublic
                });
                
                // Update set items
                await updateSetItems(editingSet.setID);
            } else {
                // Create new set
                const response = await axios.post(getApiUrl('competencysets'), setData);
                const newSetId = response.data.setID;
                
                // Create set items
                await createSetItems(newSetId);
            }

            setFormData({ setName: '', description: '', isPublic: false });
            setEditingSet(null);
            setEditingSetItems([]);
            setShowModal(false);
            await fetchCompetencySets();
        } catch (error) {
            console.error('Error saving competency set:', error);
            if (axios.isAxiosError(error)) {
                console.error('Response data:', error.response?.data);
                console.error('Response status:', error.response?.status);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const updateSetItems = async (setID: number) => {
        try {
            // Get existing items to compare
            const existingItems = editingSetItems.filter(item => !item.isNew && item.itemID);
            const newItems = editingSetItems.filter(item => item.isNew);
            
            // Update existing items
            for (const item of existingItems) {
                if (item.itemID) {
                    await axios.put(getApiUrl(`competencysets/${setID}/items/${item.itemID}`), {
                        requiredLevel: item.requiredLevel,
                        isMandatory: item.isMandatory,
                        displayOrder: item.displayOrder
                    });
                }
            }
            
            // Add new items
            for (const item of newItems) {
                await axios.post(getApiUrl(`competencysets/${setID}/items`), {
                    competencyID: item.competencyID,
                    requiredLevel: item.requiredLevel,
                    isMandatory: item.isMandatory,
                    displayOrder: item.displayOrder
                });
            }
            
            // Get items to remove (items that were in the original set but not in editingSetItems)
            const originalItems = await axios.get(getApiUrl(`competencysets/${setID}/items`));
            const currentItemIds = new Set(editingSetItems.map(item => item.competencyID));
            const itemsToRemove = originalItems.data.filter((item: CompetencySetItem) => 
                !currentItemIds.has(item.competencyID)
            );
            
            // Remove items
            for (const item of itemsToRemove) {
                await axios.delete(getApiUrl(`competencysets/${setID}/items/${item.itemID}`));
            }
        } catch (error) {
            console.error('Error updating set items:', error);
            if (axios.isAxiosError(error)) {
                console.error('Response data:', error.response?.data);
                console.error('Response status:', error.response?.status);
            }
            throw error;
        }
    };

    const createSetItems = async (setID: number) => {
        try {
            for (const item of editingSetItems) {
                await axios.post(getApiUrl(`competencysets/${setID}/items`), {
                    competencyID: item.competencyID,
                    requiredLevel: item.requiredLevel,
                    isMandatory: item.isMandatory,
                    displayOrder: item.displayOrder
                });
            }
        } catch (error) {
            console.error('Error creating set items:', error);
            throw error;
        }
    };

    const handleCopyFromPosition = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateCopyForm()) {
            return;
        }

        const currentEmployeeId = getCurrentEmployeeId();
        if (!currentEmployeeId) {
            alert('Please log in to perform this action.');
            return;
        }

        setSubmitting(true);
        try {
            const copyData = {
                ...copyFormData,
                createdBy: currentEmployeeId
            };

            await axios.post(getApiUrl('competencysets/copy-from-position'), copyData);

            setCopyFormData({ setName: '', description: '', isPublic: false, positionID: '' });
            setShowCopyModal(false);
            await fetchCompetencySets();
        } catch (error) {
            console.error('Error copying from position:', error);
            alert('Error copying competencies from position. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (field: keyof CompetencySetFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleCopyInputChange = (field: keyof CopyFromPositionFormData, value: string | boolean) => {
        setCopyFormData(prev => ({ ...prev, [field]: value }));
        if (copyErrors[field]) {
            setCopyErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingSet(null);
        setEditingSetItems([]);
        setFormData({ setName: '', description: '', isPublic: false });
        setErrors({});
    };

    const handleCloseCopyModal = () => {
        setShowCopyModal(false);
        setCopyFormData({ setName: '', description: '', isPublic: false, positionID: '' });
        setCopyErrors({});
    };

    const handleAddNew = () => {
        setEditingSet(null);
        setEditingSetItems([]);
        setFormData({ setName: '', description: '', isPublic: false });
        setErrors({});
        setShowModal(true);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterPublic(null);
    };

    // Get unique values for a column
    const getUniqueColumnValues = (field: keyof typeof columnFilters): string[] => {
        const values = competencySets
            .map(set => set[field] || '-')
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

    const filteredSets = competencySets.filter(set => {
        // Global search filter
        const matchesSearch = searchTerm === '' || 
            set.setName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (set.description && set.description.toLowerCase().includes(searchTerm.toLowerCase()));

        // Column filters
        const matchesSetName = columnFilters.setName.length === 0 || 
            columnFilters.setName.includes(set.setName || '-');

        return matchesSearch && matchesSetName;
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
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Competency Sets</h1>
                <div className="flex space-x-3">
                    {canCreate && (
                        <button
                            onClick={() => setShowCopyModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                        >
                            <Copy className="w-4 h-4" />
                            <span>Copy from Position</span>
                        </button>
                    )}
                    {canCreate && (
                        <button
                            onClick={handleAddNew}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Set</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-64">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search competency sets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    
                    {/* Set Name Filter */}
                    <div className="relative" ref={el => filterRefs.current['setName'] = el}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleFilterDropdown('setName');
                            }}
                            className={`flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${hasActiveFilter('setName') ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white text-gray-700'}`}
                        >
                            <Filter className="w-4 h-4" />
                            <span className="text-sm">Set Name</span>
                            {hasActiveFilter('setName') && (
                                <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {columnFilters.setName.length}
                                </span>
                            )}
                        </button>
                        
                        {openFilter === 'setName' && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[250px]"
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
                                        {getUniqueColumnValues('setName').filter(value => 
                                            value.toLowerCase().includes(filterSearchTerm.toLowerCase())
                                        ).length > 0 ? (
                                            getUniqueColumnValues('setName').filter(value => 
                                                value.toLowerCase().includes(filterSearchTerm.toLowerCase())
                                            ).map((value) => (
                                                <label key={value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={tempFilters.setName.includes(value)}
                                                        onChange={() => handleFilterCheckbox('setName', value)}
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
                                        onClick={() => clearFilter('setName')}
                                        className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        onClick={() => applyFilter('setName')}
                                        className="px-3 py-1.5 text-sm text-white bg-cyan-500 rounded hover:bg-cyan-600 transition-colors"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={filterPublic === true}
                                onChange={(e) => setFilterPublic(e.target.checked ? true : null)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Public Only</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={filterPublic === false}
                                onChange={(e) => setFilterPublic(e.target.checked ? false : null)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Private Only</span>
                        </label>
                        <button
                            onClick={clearFilters}
                            className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Competency Sets List */}
            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSets.map((set) => (
                        <div key={set.setID} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center space-x-2">
                                        {set.isPublic ? (
                                            <Globe className="w-5 h-5 text-blue-600" />
                                        ) : (
                                            <Lock className="w-5 h-5 text-gray-600" />
                                        )}
                                        <h3 className="text-lg font-semibold text-gray-900">{set.setName}</h3>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleViewItems(set)}
                                            className="text-blue-600 hover:text-blue-800 p-1"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        {canUpdate && (
                                            <button
                                                onClick={() => handleEditSet(set)}
                                                className="text-green-600 hover:text-green-800 p-1"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() => handleDelete(set.setID)}
                                                className="text-red-600 hover:text-red-800 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {set.description && (
                                    <p className="text-gray-600 text-left mb-3 line-clamp-2">{set.description}</p>
                                )}
                                
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                    <div className="flex items-center space-x-2">
                                        <Users className="w-4 h-4" />
                                        <span>{set.competencyCount} competencies</span>
                                    </div>
                                    <span>by {set.createdByEmployeeName || 'Unknown'}</span>
                                </div>
                                
                                {/* Position Assignment Badges */}
                                {set.assignedPositionsCount !== undefined && set.assignedPositionsCount > 0 && (
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                                        <div className="flex items-center space-x-1 text-xs text-blue-600">
                                            <Briefcase className="w-3 h-3" />
                                            <span>{set.assignedPositionsCount} position{set.assignedPositionsCount !== 1 ? 's' : ''}</span>
                                        </div>
                                        {set.outOfSyncPositionsCount !== undefined && set.outOfSyncPositionsCount > 0 && (
                                            <div className="flex items-center space-x-1 text-xs text-orange-600">
                                                <AlertCircle className="w-3 h-3" />
                                                <span>{set.outOfSyncPositionsCount} out of sync</span>
                                            </div>
                                        )}
                                        {set.outOfSyncPositionsCount === 0 && (
                                            <div className="flex items-center space-x-1 text-xs text-green-600">
                                                <CheckCircle className="w-3 h-3" />
                                                <span>All synced</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-semibold mb-4">
                            {editingSet ? 'Edit Competency Set' : 'New Competency Set'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Set Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.setName}
                                        onChange={(e) => handleInputChange('setName', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.setName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.setName && (
                                        <p className="text-red-500 text-sm mt-1">{errors.setName}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            
                            <div className="mb-6">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isPublic}
                                        onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Make this set public</span>
                                </label>
                            </div>

                            {/* Competency Management Section */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Competencies in Set</h3>
                                    <button
                                        type="button"
                                        onClick={handleAddCompetencyToSet}
                                        className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Competency
                                    </button>
                                </div>

                                {editingSetItems.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No competencies added yet. Click "Add Competency" to get started.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {editingSetItems.map((item, index) => (
                                            <div key={`${item.competencyID}-${index}`} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveCompetencyUp(index)}
                                                        disabled={index === 0}
                                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                    >
                                                        <ArrowUp className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveCompetencyDown(index)}
                                                        disabled={index === editingSetItems.length - 1}
                                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                    >
                                                        <ArrowDown className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-4 mb-2">
                                                        <h4 
                                                            className="font-medium text-gray-900 cursor-help" 
                                                            title={item.competencyDescription || 'No description available'}
                                                        >
                                                            {item.competencyName}
                                                        </h4>
                                                        {item.isNew && (
                                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">New</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                        {item.domainName && (
                                                            <span>{item.domainName}</span>
                                                        )}
                                                        {item.categoryName && (
                                                            <span>{item.categoryName}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                                            Level
                                                        </label>
                                                        <select
                                                            value={item.requiredLevel}
                                                            onChange={(e) => handleUpdateCompetencyItem(index, 'requiredLevel', parseInt(e.target.value))}
                                                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                                                        >
                                                            {[1, 2, 3, 4, 5].map(level => (
                                                                <option key={level} value={level}>{level}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                                            Mandatory
                                                        </label>
                                                        <input
                                                            type="checkbox"
                                                            checked={item.isMandatory}
                                                            onChange={(e) => handleUpdateCompetencyItem(index, 'isMandatory', e.target.checked)}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveCompetencyFromSet(index)}
                                                        className="p-1 text-red-600 hover:text-red-800"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : (editingSet ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Copy from Position Modal */}
            {showCopyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-semibold mb-4">Copy from Position</h2>
                        <form onSubmit={handleCopyFromPosition}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Set Name *
                                </label>
                                <input
                                    type="text"
                                    value={copyFormData.setName}
                                    onChange={(e) => handleCopyInputChange('setName', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        copyErrors.setName ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {copyErrors.setName && (
                                    <p className="text-red-500 text-sm mt-1">{copyErrors.setName}</p>
                                )}
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={copyFormData.description}
                                    onChange={(e) => handleCopyInputChange('description', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Position *
                                </label>
                                <select
                                    value={copyFormData.positionID}
                                    onChange={(e) => handleCopyInputChange('positionID', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        copyErrors.positionID ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Select a position</option>
                                    {positions.map((position) => (
                                        <option key={position.positionID} value={position.positionID}>
                                            {position.positionTitle}
                                            {position.departmentName && ` - ${position.departmentName}`}
                                        </option>
                                    ))}
                                </select>
                                {copyErrors.positionID && (
                                    <p className="text-red-500 text-sm mt-1">{copyErrors.positionID}</p>
                                )}
                            </div>
                            
                            <div className="mb-6">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={copyFormData.isPublic}
                                        onChange={(e) => handleCopyInputChange('isPublic', e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Make this set public</span>
                                </label>
                            </div>
                            
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={handleCloseCopyModal}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Creating...' : 'Create Set'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Items Modal */}
            {showItemsModal && selectedSet && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">
                                {selectedSet.setName} - Competencies
                            </h2>
                            <div className="flex items-center space-x-3">
                                {canUpdate && (
                                    <button
                                        onClick={() => {
                                            setShowItemsModal(false);
                                            handleManagePositions(selectedSet);
                                        }}
                                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                    >
                                        <Briefcase className="w-4 h-4" />
                                        <span>Manage Positions</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowItemsModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            {setItems.map((item) => (
                                <div key={item.itemID} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-left text-gray-900">{item.competencyName}</h4>
                                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                                            {item.domainName && (
                                                <span>{item.domainName}</span>
                                            )}
                                            {item.categoryName && (
                                                <span>{item.categoryName}</span>
                                            )}
                                            <span>Level: {item.requiredLevel}</span>
                                            <span className={item.isMandatory ? 'text-red-600' : 'text-gray-500'}>
                                                {item.isMandatory ? 'Mandatory' : 'Optional'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {setItems.length === 0 && (
                            <p className="text-gray-500 text-center py-8">No competencies in this set.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Competency Selector Modal */}
            {showCompetencySelector && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Select Competency to Add</h2>
                            <button
                                onClick={() => setShowCompetencySelector(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search competencies..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {competencies
                                .filter(comp => 
                                    !editingSetItems.some(item => item.competencyID === comp.competencyID) &&
                                    (comp.competencyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                     (comp.categoryName && comp.categoryName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                     (comp.domainName && comp.domainName.toLowerCase().includes(searchTerm.toLowerCase())))
                                )
                                .map((competency) => (
                                    <div
                                        key={competency.competencyID}
                                        onClick={() => handleSelectCompetency(competency)}
                                        className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                                        title={competency.competencyDescription || 'No description available'}
                                    >
                                        <div className="font-medium text-left text-gray-900">{competency.competencyName}</div>
                                        {competency.competencyDescription && (
                                            <div className="text-sm text-left text-gray-500 mt-1 line-clamp-2">{competency.competencyDescription}</div>
                                        )}
                                        <div className="text-sm text-left text-gray-600 mt-1">
                                            {competency.domainName && <span>{competency.domainName}</span>}
                                            {competency.domainName && competency.categoryName && <span> • </span>}
                                            {competency.categoryName && <span>{competency.categoryName}</span>}
                                        </div>
                                    </div>
                                ))}
                        </div>
                        
                        {competencies.filter(comp => 
                            !editingSetItems.some(item => item.competencyID === comp.competencyID)
                        ).length === 0 && (
                            <p className="text-gray-500 text-center py-8">No available competencies to add.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Position Manager Modal */}
            {showPositionManagerModal && selectedSet && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">
                                Manage Positions - {selectedSet.setName}
                            </h2>
                            <button
                                onClick={() => setShowPositionManagerModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Currently Assigned Positions Section */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold mb-4">
                                Currently Assigned Positions ({assignedPositions.length})
                            </h3>
                            
                            {assignedPositions.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">
                                    No positions assigned to this competency set yet.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {assignedPositions.map((assignment) => (
                                        <div
                                            key={assignment.assignmentID}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex-1 text-left">
                                                <div className="flex items-start space-x-3">
                                                    <h4 className="font-medium text-left text-gray-900">
                                                        {assignment.positionTitle}
                                                    </h4>
                                                    {assignment.isSynced ? (
                                                        <span className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                                            <CheckCircle className="w-3 h-3" />
                                                            <span>Synced</span>
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center space-x-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                                                            <AlertCircle className="w-3 h-3" />
                                                            <span>Out of Sync</span>
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-left text-gray-600 mt-1">
                                                    {assignment.departmentName && (
                                                        <span>{assignment.departmentName} • </span>
                                                    )}
                                                    <span>Assigned {new Date(assignment.assignedDate).toLocaleDateString()}</span>
                                                    {!assignment.isSynced && (
                                                        <span> • Last synced {new Date(assignment.lastSyncedDate).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {!assignment.isSynced && (
                                                    <>
                                                        <button
                                                            onClick={() => handleViewChanges(assignment.positionID)}
                                                            className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-600 rounded hover:bg-blue-50"
                                                        >
                                                            View Changes
                                                        </button>
                                                        <label className="flex items-center space-x-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={syncSelectedPositions.includes(assignment.assignmentID)}
                                                                onChange={() => toggleSyncSelection(assignment.assignmentID)}
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm text-gray-700">Sync</span>
                                                        </label>
                                                    </>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleRemovePositionAssignment(assignment.assignmentID)}
                                                        className="text-red-600 hover:text-red-800 p-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Sync Button */}
                            {syncSelectedPositions.length > 0 && (
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={handleSyncPositions}
                                        disabled={submitting}
                                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
                                        <span>{submitting ? 'Syncing...' : `Apply Updates to ${syncSelectedPositions.length} Position(s)`}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Add Positions Section */}
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-semibold mb-4">
                                Add Positions ({availablePositions.length} available)
                            </h3>
                            
                            {availablePositions.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">
                                    All positions are already assigned to this competency set.
                                </p>
                            ) : (
                                <>
                                    <div className="mb-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="text"
                                                placeholder="Search positions..."
                                                value={positionSearchTerm}
                                                onChange={(e) => setPositionSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {availablePositions
                                            .filter(pos =>
                                                pos.positionTitle.toLowerCase().includes(positionSearchTerm.toLowerCase()) ||
                                                (pos.departmentName && pos.departmentName.toLowerCase().includes(positionSearchTerm.toLowerCase()))
                                            )
                                            .map((position) => (
                                                <label
                                                    key={position.positionID}
                                                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPositions.includes(position.positionID)}
                                                        onChange={() => togglePositionSelection(position.positionID)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <div>
                                                        <div className="font-medium text-left text-gray-900">
                                                            {position.positionTitle}
                                                        </div>
                                                        {position.departmentName && (
                                                            <div className="text-sm text-left text-gray-600">
                                                                {position.departmentName}
                                                            </div>
                                                        )}
                                                    </div>
                                                </label>
                                            ))}
                                    </div>

                                    {selectedPositions.length > 0 && (
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={handleAssignPositions}
                                                disabled={submitting}
                                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span>{submitting ? 'Assigning...' : `Assign ${selectedPositions.length} Position(s)`}</span>
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Changes Modal */}
            {showChangesModal && positionSetChanges && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">
                                Changes for {positionSetChanges.positionTitle}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowChangesModal(false);
                                    setPositionSetChanges(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {positionSetChanges.changes.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">
                                No changes detected.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {positionSetChanges.changes.map((change, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-lg border-l-4 ${
                                            change.changeType === 'added'
                                                ? 'bg-green-50 border-green-500'
                                                : change.changeType === 'removed'
                                                ? 'bg-red-50 border-red-500'
                                                : 'bg-blue-50 border-blue-500'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <h4 className="font-medium text-gray-900">
                                                        {change.competencyName}
                                                    </h4>
                                                    <span
                                                        className={`text-xs px-2 py-1 rounded-full ${
                                                            change.changeType === 'added'
                                                                ? 'bg-green-100 text-green-800'
                                                                : change.changeType === 'removed'
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-blue-100 text-blue-800'
                                                        }`}
                                                    >
                                                        {change.changeType.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {change.domainName && <span>{change.domainName}</span>}
                                                    {change.domainName && change.categoryName && <span> • </span>}
                                                    {change.categoryName && <span>{change.categoryName}</span>}
                                                </div>
                                                {change.changeType === 'modified' && (
                                                    <div className="text-sm mt-2 space-y-1">
                                                        {change.oldLevel !== change.newLevel && (
                                                            <div>
                                                                <span className="text-gray-600">Level: </span>
                                                                <span className="text-red-600 line-through">{change.oldLevel}</span>
                                                                <span className="mx-2">→</span>
                                                                <span className="text-green-600 font-medium">{change.newLevel}</span>
                                                            </div>
                                                        )}
                                                        {change.oldIsMandatory !== change.newIsMandatory && (
                                                            <div>
                                                                <span className="text-gray-600">Mandatory: </span>
                                                                <span className="text-red-600 line-through">
                                                                    {change.oldIsMandatory ? 'Yes' : 'No'}
                                                                </span>
                                                                <span className="mx-2">→</span>
                                                                <span className="text-green-600 font-medium">
                                                                    {change.newIsMandatory ? 'Yes' : 'No'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {change.changeType === 'added' && (
                                                    <div className="text-sm mt-2">
                                                        <span className="text-gray-600">Level: </span>
                                                        <span className="font-medium">{change.newLevel}</span>
                                                        <span className="mx-2">•</span>
                                                        <span className="text-gray-600">Mandatory: </span>
                                                        <span className="font-medium">{change.newIsMandatory ? 'Yes' : 'No'}</span>
                                                    </div>
                                                )}
                                                {change.changeType === 'removed' && (
                                                    <div className="text-sm mt-2 text-gray-500">
                                                        <span>Was level {change.oldLevel}</span>
                                                        {change.oldIsMandatory && <span> (Mandatory)</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompetencySets;
