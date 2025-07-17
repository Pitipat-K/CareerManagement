import { useState, useEffect } from 'react';
import { Plus, Play, Calendar, User, CheckCircle, Clock, Eye } from 'lucide-react';
import { getApiUrl } from '../config/api';

interface Assessment {
    assessmentID: number;
    assessmentPeriod: string;
    assessmentDate: string;
    status: string;
    assessmentType: string;
    employeeName?: string;
    createdByName?: string;
}

interface CompetencyAssessmentDto {
    competencyID: number;
    competencyName: string;
    categoryName: string;
    domainName: string;
    requiredLevel: number;
    selfLevel?: number;
    managerLevel?: number;
    comments?: string;
}

interface AssessmentWithCompetenciesDto {
    assessmentID: number;
    employeeID: number;
    assessmentPeriod?: string;
    status: string;
    competencies: CompetencyAssessmentDto[];
}

interface CompetencyAssessmentProps {
    employeeId: number | null;
}

const CompetencyAssessment = ({ employeeId }: CompetencyAssessmentProps) => {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [assessmentPeriod, setAssessmentPeriod] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentAssessment, setCurrentAssessment] = useState<AssessmentWithCompetenciesDto | null>(null);
    const [showAssessmentForm, setShowAssessmentForm] = useState(false);
    const [tempLevels, setTempLevels] = useState<{ [key: number]: number }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewMode, setViewMode] = useState<'self' | 'team'>('self');

    useEffect(() => {
        fetchAssessments();
    }, [viewMode]);

    const fetchAssessments = async () => {
        if (!employeeId) return;

        try {
            const endpoint = viewMode === 'self'
                ? getApiUrl(`Assessments/employee/${employeeId}`)
                : getApiUrl(`Assessments/assessor/${employeeId}`);

            const response = await fetch(endpoint);
            if (response.ok) {
                const data = await response.json();
                setAssessments(data);
            } else {
                console.error('Failed to fetch assessments');
            }
        } catch (error) {
            console.error('Error fetching assessments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssessment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assessmentPeriod.trim() || !employeeId) return;

        try {
            const response = await fetch(getApiUrl('Assessments'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    EmployeeID: employeeId,
                    AssessmentPeriod: assessmentPeriod,
                }),
            });

            if (response.ok) {
                setAssessmentPeriod('');
                setShowCreateForm(false);
                fetchAssessments();
            } else {
                console.error('Failed to create assessment');
            }
        } catch (error) {
            console.error('Error creating assessment:', error);
        }
    };

    const handleStartAssessment = async (assessmentId: number) => {
        if (!assessmentId || isNaN(assessmentId)) {
            console.error('Invalid assessment ID:', assessmentId);
            return;
        }

        try {
            console.log(`Starting assessment with ID: ${assessmentId}`);
            
            let foundCycle: any = null;
            
            // For completed assessments, always try to get the combined view from assessment cycle
            // This works for both Self and Team views
            const cycleResponse = await fetch(getApiUrl(`AssessmentCycles/employee/${employeeId}`));
            if (cycleResponse.ok) {
                const cycles = await cycleResponse.json();
                console.log('Found cycles:', cycles);
                
                foundCycle = cycles.find((c: any) => 
                    c.selfAssessmentID === assessmentId || c.managerAssessmentID === assessmentId
                );
                
                console.log('Found cycle:', foundCycle);
                
                if (foundCycle) {
                    console.log(`Cycle status: ${foundCycle.status}, Cycle ID: ${foundCycle.cycleID}`);
                    
                    // Check if the cycle is completed or if both assessments are completed
                    const isCompleted = foundCycle.status === 'Completed' || 
                                     (foundCycle.selfCompletedDate && foundCycle.managerCompletedDate);
                    
                    if (isCompleted) {
                        console.log('Using combined view for completed cycle');
                        // Use the combined view for completed cycles (works for both Self and Team views)
                        const combinedResponse = await fetch(getApiUrl(`Assessments/cycle/${foundCycle.cycleID}/combined`));
                        if (combinedResponse.ok) {
                            const data = await combinedResponse.json();
                            console.log('Combined assessment data:', data);
                            setCurrentAssessment(data);
                            setShowAssessmentForm(true);
                            return;
                        } else {
                            console.error('Failed to fetch combined assessment data');
                        }
                    } else {
                        console.log('Cycle not completed, using individual view');
                    }
                }
            }
            
            console.log('Using individual assessment view');
            // Fallback to individual assessment view
            const response = await fetch(getApiUrl(`Assessments/${assessmentId}/competencies`));
            if (response.ok) {
                const data = await response.json();
                console.log('Individual assessment data:', data);
                console.log('Assessment status:', data.status);
                
                // If this is a completed assessment, try to get the combined view again
                // This handles cases where the cycle status might not be 'Completed' but the assessment is
                if (data.status === 'Completed' && foundCycle) {
                    console.log('Assessment is completed, trying combined view again');
                    const combinedResponse = await fetch(getApiUrl(`Assessments/cycle/${foundCycle.cycleID}/combined`));
                    if (combinedResponse.ok) {
                        const combinedData = await combinedResponse.json();
                        console.log('Combined assessment data (fallback):', combinedData);
                        setCurrentAssessment(combinedData);
                        setShowAssessmentForm(true);
                        return;
                    }
                }
                
                setCurrentAssessment(data);
                setShowAssessmentForm(true);
            } else {
                console.error('Failed to fetch assessment details');
            }
        } catch (error) {
            console.error('Error fetching assessment details:', error);
        }
    };

    const handleTempLevelChange = (competencyId: number, level: number) => {
        setTempLevels(prev => ({
            ...prev,
            [competencyId]: level
        }));
    };



    const handleSubmitAssessment = async () => {
        if (!currentAssessment) return;

        // Check if all competencies have levels selected
        const allCompetencies = currentAssessment.competencies;
        const missingLevels = allCompetencies.filter(competency =>
            !tempLevels[competency.competencyID] && !competency.selfLevel
        );

        if (missingLevels.length > 0) {
            alert(`Please select levels for all competencies. Missing levels for ${missingLevels.length} competency(ies).`);
            return;
        }

        setIsSubmitting(true);

        try {
            // Submit all temporary levels
            const updatePromises = Object.entries(tempLevels).map(([competencyId, level]) => {
                return fetch(getApiUrl(`Assessments/${currentAssessment.assessmentID}/scores`), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        AssessmentID: currentAssessment.assessmentID,
                        CompetencyID: parseInt(competencyId),
                        CurrentLevel: level,
                        Comments: '',
                    }),
                });
            });

            const responses = await Promise.all(updatePromises);
            const allSuccessful = responses.every(response => response.ok);

            if (allSuccessful) {
                // Update assessment status to Completed
                const statusUpdateResponse = await fetch(getApiUrl(`Assessments/${currentAssessment.assessmentID}/status`), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        Status: 'Completed'
                    }),
                });

                if (statusUpdateResponse.ok) {
                    // Find the cycleId for this assessment
                    let cycleId = null;
                    try {
                        const cycleResponse = await fetch(getApiUrl(`AssessmentCycles/employee/${currentAssessment.employeeID}`));
                        if (cycleResponse.ok) {
                            const cycles = await cycleResponse.json();
                            const foundCycle = cycles.find((c: any) =>
                                c.selfAssessmentID === currentAssessment.assessmentID ||
                                c.managerAssessmentID === currentAssessment.assessmentID
                            );
                            if (foundCycle) {
                                cycleId = foundCycle.cycleID;
                            }
                        }
                    } catch (err) {
                        console.error('Error fetching assessment cycles:', err);
                    }

                    // Call the correct AssessmentCycles endpoint for status update
                    if (cycleId) {
                        if (viewMode === 'self') {
                            // Employee completes self assessment
                            await fetch(getApiUrl(`AssessmentCycles/${cycleId}/complete-self`), {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                            });
                        } else if (viewMode === 'team') {
                            // Manager completes assessment
                            await fetch(getApiUrl(`AssessmentCycles/${cycleId}/complete-manager`), {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                            });
                        }
                    }

                    // Send notification email directly for self assessments
                    if (viewMode === 'self') {
                        try {
                            console.log('Sending notification email for self assessment');
                            const notificationResponse = await fetch(getApiUrl(`Assessments/${currentAssessment.assessmentID}/send-notification`), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    managerEmail: 'pitipat.kananuruk@alliancels.com' // Replace with actual manager email
                                }),
                            });
                            if (notificationResponse.ok) {
                                console.log('Notification email sent successfully');
                            } else {
                                console.error('Failed to send notification email');
                            }
                        } catch (error) {
                            console.error('Error sending notification email:', error);
                        }
                    }

                    // Refresh the assessment data
                    const assessmentResponse = await fetch(getApiUrl(`Assessments/${currentAssessment.assessmentID}/competencies`));
                    if (assessmentResponse.ok) {
                        const updatedData = await assessmentResponse.json();
                        setCurrentAssessment(updatedData);
                        setTempLevels({}); // Clear temporary levels
                    }

                    // Close the assessment form
                    setShowAssessmentForm(false);

                    // Refresh the assessments list
                    fetchAssessments();
                } else {
                    console.error('Failed to update assessment status');
                }
            } else {
                console.error('Failed to update some scores');
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusIcon = (status?: string) => {
        if (!status) return <Clock className="w-4 h-4 text-gray-600" />;
        switch (status.toLowerCase()) {
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'in progress':
                return <Clock className="w-4 h-4 text-yellow-600" />;
            default:
                return <Clock className="w-4 h-4 text-gray-600" />;
        }
    };

    const getStatusColor = (status?: string) => {
        if (!status) return 'bg-gray-100 text-gray-800';
        switch (status.toLowerCase()) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'in progress':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading assessments...</p>
                </div>
            </div>
        );
    }

    if (showAssessmentForm && currentAssessment) {
        return (
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {currentAssessment.status.toLowerCase() === 'completed' ? 'Competency Assessment (Completed)' : 'Competency Assessment'}
                            </h2>
                            <p className="text-sm text-gray-600">{currentAssessment.assessmentPeriod}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            {currentAssessment.status.toLowerCase() !== 'completed' && (
                                <button
                                    onClick={handleSubmitAssessment}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Assessment'
                                    )}
                                </button>
                            )}
                            <button
                                onClick={() => setShowAssessmentForm(false)}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                ← Back to Assessments
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="overflow-x-auto">
                        <div className="max-h-[650px] overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            No.
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Domain
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Competency
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Required Level
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Level (Self)
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Gap
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Level (Manager)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentAssessment.competencies.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center text-gray-500 py-8">
                                                No competencies found for this assessment.
                                            </td>
                                        </tr>
                                    ) : (
                                        currentAssessment.competencies.map((competency: CompetencyAssessmentDto, index: number) => (
                                            <tr key={competency.competencyID}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {competency.domainName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {competency.categoryName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {competency.competencyName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {competency.requiredLevel}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {viewMode === 'team' ? (
                                                        <span className="text-sm text-gray-900">
                                                            {competency.selfLevel !== undefined && competency.selfLevel !== null ? competency.selfLevel : '-'}
                                                        </span>
                                                    ) : currentAssessment.status.toLowerCase() === 'completed' ? (
                                                        <span className="text-sm text-gray-900">
                                                            {competency.selfLevel !== undefined && competency.selfLevel !== null ? competency.selfLevel : '-'}
                                                        </span>
                                                    ) : (
                                                        <select
                                                            value={
                                                                tempLevels[competency.competencyID] !== undefined
                                                                    ? tempLevels[competency.competencyID]
                                                                    : (competency.selfLevel !== undefined ? competency.selfLevel : '')
                                                            }
                                                            onChange={(e) => {
                                                                const level = parseInt(e.target.value);
                                                                if (!isNaN(level)) {
                                                                    handleTempLevelChange(competency.competencyID, level);
                                                                }
                                                            }}
                                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                        >
                                                            <option value="">Select Level</option>
                                                            {[0, 1, 2, 3, 4].map((level) => (
                                                                <option key={level} value={level}>
                                                                    {level}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {(tempLevels[competency.competencyID] || competency.selfLevel) ? (
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${(tempLevels[competency.competencyID] || competency.selfLevel || 0) >= competency.requiredLevel
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {(tempLevels[competency.competencyID] || competency.selfLevel || 0) - competency.requiredLevel > 0 ? '+' : ''}
                                                            {(tempLevels[competency.competencyID] || competency.selfLevel || 0) - competency.requiredLevel}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {viewMode === 'team' && currentAssessment.status.toLowerCase() !== 'completed' ? (
                                                        <select
                                                            value={
                                                                tempLevels[competency.competencyID] !== undefined
                                                                    ? tempLevels[competency.competencyID]
                                                                    : (competency.managerLevel !== undefined ? competency.managerLevel : '')
                                                            }
                                                            onChange={(e) => {
                                                                const level = parseInt(e.target.value);
                                                                if (!isNaN(level)) {
                                                                    handleTempLevelChange(competency.competencyID, level);
                                                                }
                                                            }}
                                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                        >
                                                            <option value="">Select Level</option>
                                                            {[0, 1, 2, 3, 4].map((level) => (
                                                                <option key={level} value={level}>
                                                                    {level}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span className="text-sm text-gray-900">
                                                            {competency.managerLevel !== undefined && competency.managerLevel !== null ? competency.managerLevel : '-'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 text-left">Competency Assessment</h2>
                        <p className="text-sm text-gray-600">Create and manage competency assessments</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {viewMode === 'self' && (
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Assessment
                            </button>
                        )}
                        <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                            <button
                                onClick={() => setViewMode('self')}
                                className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'self'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Self
                            </button>
                            <button
                                onClick={() => setViewMode('team')}
                                className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'team'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Team
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showCreateForm && (
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <form onSubmit={handleCreateAssessment} className="flex items-start space-x-4">
                        <div className="flex-1">
                            <label htmlFor="assessmentPeriod" className="block text-sm font-medium text-gray-700 mb-1">
                                Assessment Name
                            </label>
                            <input
                                type="text"
                                id="assessmentPeriod"
                                value={assessmentPeriod}
                                onChange={(e) => setAssessmentPeriod(e.target.value)}
                                placeholder="e.g., Q1 2025"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div className="flex items-start space-x-2 pt-6">
                            <button
                                type="submit"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                Create
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setAssessmentPeriod('');
                                }}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="p-6">
                {assessments.length === 0 ? (
                    <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {viewMode === 'self' ? 'No assessments yet' : 'No team assessments yet'}
                        </h3>
                        <p className="text-gray-600">
                            {viewMode === 'self'
                                ? 'Create your first competency assessment to get started.'
                                : 'No assessments assigned to you as an assessor.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[650px] overflow-y-auto">
                        {assessments
                            .filter(assessment =>
                                viewMode === 'self'
                                    ? assessment.assessmentType === 'Self'
                                    : assessment.assessmentType !== 'Self'
                            )
                            .map((assessment) => (
                                <div
                                    key={assessment.assessmentID}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            <User className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-900">{assessment.assessmentPeriod}</h3>
                                            <p className="text-sm text-gray-500">
                                                {viewMode === 'self'
                                                    ? `Owner: ${assessment.employeeName || 'Unknown'}`
                                                    : `Employee: ${assessment.employeeName || 'Unknown'}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-6">
                                        <div className="text-sm text-gray-500 text-center">
                                            <p>Created on {new Date(assessment.assessmentDate).toLocaleDateString()}</p>
                                            <p>Created by: {assessment.createdByName || 'Unknown'}</p>
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                                            {getStatusIcon(assessment.status)}
                                            <span className="ml-1">{assessment.status}</span>
                                        </span>
                                        <button
                                            onClick={() => handleStartAssessment(assessment.assessmentID)}
                                            disabled={viewMode === 'team' && assessment.status === 'Pending'}
                                            className={`inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 w-32 ${assessment.status.toLowerCase() === 'completed'
                                                    ? 'text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500'
                                                    : 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                                                } ${viewMode === 'team' && assessment.status === 'Pending' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {assessment.status.toLowerCase() === 'completed' ? (
                                                <>
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4 mr-2" />
                                                    Start Assess
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompetencyAssessment; 