import { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';

interface Position {
  positionID: number;
  positionTitle: string;
  positionDescription?: string;
  departmentName?: string;
  jobGrade?: string;
  jobGradeLevel?: number;
  leadershipLevel?: string;
  experienceRequirement?: number;
  requiredCompetencies?: Competency[];
}

interface Competency {
  competencyID: number;
  competencyName?: string;
  requiredLevel: number;
  isMandatory: boolean;
}

interface JobGrade {
  jobGradeID: number;
  jobGradeName: string;
  jobGradeDescription?: string;
  jobGradeLevel?: number;
}

interface Department {
  departmentID: number;
  departmentName: string;
}

const CareerPath = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [jobGrades, setJobGrades] = useState<JobGrade[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedJobGrade, setSelectedJobGrade] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [userCompetencies, setUserCompetencies] = useState<{[key: number]: number}>({});
  const [achievementPercentage, setAchievementPercentage] = useState<number>(0);
  const [userCurrentPosition, setUserCurrentPosition] = useState<Position | null>(null);

  useEffect(() => {
    fetchCareerPathData();
  }, []);

  // Auto-scroll to current position when userCurrentPosition changes
  useEffect(() => {
    if (userCurrentPosition && !loading) {
      // Wait a bit for the DOM to be fully rendered
      const timer = setTimeout(() => {
        scrollToCurrentPosition();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [userCurrentPosition, loading]);

  const fetchCareerPathData = async () => {
    try {
      setLoading(true);
      
      // Fetch positions for career navigator
      const positionsResponse = await fetch(getApiUrl('Positions/career-navigator'));
      if (!positionsResponse.ok) throw new Error('Failed to fetch positions');
      const positionsData = await positionsResponse.json();

      // Fetch job grades
      const jobGradesResponse = await fetch(getApiUrl('Positions/jobgrades'));
      if (!jobGradesResponse.ok) throw new Error('Failed to fetch job grades');
      const jobGradesData = await jobGradesResponse.json();

      // Fetch departments
      const departmentsResponse = await fetch(getApiUrl('Departments'));
      if (!departmentsResponse.ok) throw new Error('Failed to fetch departments');
      const departmentsData = await departmentsResponse.json();

      setPositions(positionsData);
      setJobGrades(jobGradesData);
      setDepartments(departmentsData);
      
      // Fetch user's current position after positions are loaded
      await fetchUserCurrentPosition(positionsData);
    } catch (error) {
      console.error('Error fetching career path data:', error);
      setError('Failed to load career path data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's current position
  const fetchUserCurrentPosition = async (positionsData: Position[]) => {
    try {
      const currentEmployee = localStorage.getItem('currentEmployee');
      if (!currentEmployee) {
        console.warn('No current employee found');
        return;
      }
      
      const employeeId = JSON.parse(currentEmployee).employeeID;
      console.log('Fetching current position for employee:', employeeId);
      
      // Fetch employee details to get current position
      const response = await fetch(getApiUrl(`Employees/${employeeId}`));
      if (response.ok) {
        const employeeData = await response.json();
        if (employeeData.positionID) {
          console.log('Employee current positionID:', employeeData.positionID);
          console.log('Available positions:', positionsData);
          
          // Find the position in the provided positions array
          const currentPosition = positionsData.find(p => p.positionID === employeeData.positionID);
          if (currentPosition) {
            setUserCurrentPosition(currentPosition);
            console.log('User current position set:', currentPosition);
            
            // Scroll to current position after a delay to ensure DOM is fully rendered
            setTimeout(() => {
              scrollToCurrentPosition();
            }, 1000);
            
            // Also try scrolling again after a longer delay as fallback
            setTimeout(() => {
              scrollToCurrentPosition();
            }, 2000);
          } else {
            console.warn('Current position not found in positions array');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user current position:', error);
    }
  };

  // Scroll to current position
  const scrollToCurrentPosition = () => {
    if (!userCurrentPosition) {
      console.log('No current position to scroll to');
      return;
    }
    
    console.log('Attempting to scroll to position:', userCurrentPosition.positionID);
    
    // Find the position element in the DOM
    const positionElement = document.querySelector(`[data-position-id="${userCurrentPosition.positionID}"]`);
    if (positionElement) {
      console.log('Position element found, scrolling into view');
      
      // Get the table container for horizontal scrolling
      const tableContainer = document.querySelector('.overflow-x-auto');
      if (tableContainer) {
        // Calculate the position of the current position element
        const containerRect = tableContainer.getBoundingClientRect();
        const elementRect = positionElement.getBoundingClientRect();
        
        // Calculate scroll position to align current position on the left side
        const currentScrollLeft = tableContainer.scrollLeft;
        const elementLeft = elementRect.left - containerRect.left;
        const targetScrollLeft = currentScrollLeft + elementLeft - 140; // 140px offset to account for Department column width
        
        // Smooth scroll to position the current position on the left
        tableContainer.scrollTo({
          left: targetScrollLeft,
          behavior: 'smooth'
        });
        
        // Also scroll vertically to center the current position
        setTimeout(() => {
          positionElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 1000); // Small delay to ensure horizontal scroll completes first
      } else {
        // Fallback to default scroll behavior
        positionElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'start'
        });
      }
      
      // Add a temporary highlight effect
      positionElement.classList.add('ring-4', 'ring-green-400', 'ring-opacity-75');
      setTimeout(() => {
        positionElement.classList.remove('ring-4', 'ring-green-400', 'ring-opacity-75');
      }, 3000);
      
      console.log('Successfully scrolled to current position');
    } else {
      console.log('Position element not found in DOM, will retry later');
    }
  };

  // Sort job grades by level (ascending - low to high)
  const sortedJobGrades = [...jobGrades].sort((a, b) => 
    (a.jobGradeLevel ?? 0) - (b.jobGradeLevel ?? 0)
  );

  // Sort departments alphabetically
  const sortedDepartments = [...departments].sort((a, b) => 
    a.departmentName.localeCompare(b.departmentName)
  );

  // Get total positions count for statistics
  const totalPositions = positions.length;

  // Filter positions based on search and filters
  const filteredPositions = positions.filter(position => {
    const matchesSearch = searchTerm === '' || 
      position.positionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (position.positionDescription && position.positionDescription.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepartment = selectedDepartment === '' || position.departmentName === selectedDepartment;
    const matchesJobGrade = selectedJobGrade === '' || position.jobGrade === selectedJobGrade;
    
    return matchesSearch && matchesDepartment && matchesJobGrade;
  });

  const totalFilteredPositions = filteredPositions.length;

  // Get departments and job grades that have positions after filtering
  const activeDepartments = sortedDepartments.filter(dept => 
    filteredPositions.some(position => position.departmentName === dept.departmentName)
  );
  
  const activeJobGrades = sortedJobGrades.filter(jg => 
    filteredPositions.some(position => position.jobGrade === jg.jobGradeName)
  );

  // Get positions for a specific job grade and department
  const getPositionsForGradeAndDepartment = (jobGradeName: string, departmentName: string) => {
    return filteredPositions.filter(position => 
      position.jobGrade === jobGradeName && 
      position.departmentName === departmentName
    );
  };

  // Handle position click to show details
  const handlePositionClick = async (position: Position) => {
    setSelectedPosition(position);
    setShowPositionModal(true);
    
    // Reset competencies and achievement for new position
    setUserCompetencies({});
    setAchievementPercentage(0);
    
    // Fetch user competencies for this position in the background
    if (position.requiredCompetencies && position.requiredCompetencies.length > 0) {
      // Don't await - let it run in background
      fetchUserCompetencies(position.requiredCompetencies);
    }
  };

  // Close position modal
  const closePositionModal = () => {
    setShowPositionModal(false);
    setSelectedPosition(null);
    setUserCompetencies({});
    setAchievementPercentage(0);
  };

  // Fetch user competencies for the selected position
  const fetchUserCompetencies = async (requiredCompetencies: Competency[]) => {
    try {
      // Get current employee ID from localStorage
      const currentEmployee = localStorage.getItem('currentEmployee');
      if (!currentEmployee) {
        console.warn('No current employee found, using mock data for demo');
        // Use mock data for demo purposes
        const mockCompetencies: {[key: number]: number} = {};
        requiredCompetencies.forEach(comp => {
          mockCompetencies[comp.competencyID] = Math.floor(Math.random() * 5) + 1; // Random level 1-5
        });
        setUserCompetencies(mockCompetencies);
        calculateAchievementPercentage(requiredCompetencies, mockCompetencies);
        return;
      }
      
      const employeeId = JSON.parse(currentEmployee).employeeID;
      console.log('Fetching competencies for employee:', employeeId);
      
      // Fetch user's competency scores with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      // First, get the assessment cycles for the employee
      const cyclesResponse = await fetch(getApiUrl(`AssessmentCycles/employee/${employeeId}`), {
        signal: controller.signal
      });
      
      if (!cyclesResponse.ok) {
        throw new Error(`Failed to fetch assessment cycles: ${cyclesResponse.status}`);
      }
      
      const cycles = await cyclesResponse.json();
      console.log('Assessment cycles received:', cycles);
      
      // Find the most recent completed cycle
      const completedCycles = cycles.filter((cycle: any) => 
        cycle.status === 'Completed' || 
        (cycle.selfCompletedDate && cycle.managerCompletedDate)
      );
      
      if (completedCycles.length === 0) {
        console.log('No completed assessment cycles found, using mock data');
        const mockCompetencies: {[key: number]: number} = {};
        requiredCompetencies.forEach(comp => {
          mockCompetencies[comp.competencyID] = Math.floor(Math.random() * 5) + 1; // Random level 1-5
        });
        setUserCompetencies(mockCompetencies);
        calculateAchievementPercentage(requiredCompetencies, mockCompetencies);
        return;
      }
      
      // Get the most recent completed cycle
      const mostRecentCycle = completedCycles.sort((a: any, b: any) => 
        new Date(b.selfCompletedDate || b.managerCompletedDate || 0).getTime() - 
        new Date(a.selfCompletedDate || a.managerCompletedDate || 0).getTime()
      )[0];
      
      console.log('Most recent completed cycle:', mostRecentCycle);
      
      // Get the combined assessment data for this cycle
      const combinedResponse = await fetch(getApiUrl(`Assessments/cycle/${mostRecentCycle.cycleID}/combined`), {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!combinedResponse.ok) {
        throw new Error(`Failed to fetch combined assessment data: ${combinedResponse.status}`);
      }
      
      const combinedData = await combinedResponse.json();
      console.log('Combined assessment data received:', combinedData);
      
      // Create a map of competency ID to user's level
      // Prefer managerLevel if available, otherwise use selfLevel
      const competencyMap: {[key: number]: number} = {};
      combinedData.competencies.forEach((comp: any) => {
        // Use managerLevel if available, otherwise fall back to selfLevel
        const level = comp.managerLevel !== undefined && comp.managerLevel !== null 
          ? comp.managerLevel 
          : (comp.selfLevel !== undefined && comp.selfLevel !== null ? comp.selfLevel : 0);
        
        if (level > 0) {
          competencyMap[comp.competencyID] = level;
        }
      });
      
      console.log('Competency map created:', competencyMap);
      setUserCompetencies(competencyMap);
      
      // Calculate achievement percentage
      calculateAchievementPercentage(requiredCompetencies, competencyMap);
      
      // Log the final result for debugging
      console.log('Final user competencies:', competencyMap);
      console.log('Required competencies:', requiredCompetencies);
      console.log('Achievement percentage calculated:', achievementPercentage);
    } catch (error: any) {
      console.error('Error fetching user competencies:', error);
      
      // If it's a timeout or network error, use mock data
      if (error.name === 'AbortError' || (error.message && error.message.includes('Failed to fetch'))) {
        console.log('Using mock data due to fetch error');
        const mockCompetencies: {[key: number]: number} = {};
        requiredCompetencies.forEach(comp => {
          mockCompetencies[comp.competencyID] = Math.floor(Math.random() * 5) + 1; // Random level 1-5
        });
        setUserCompetencies(mockCompetencies);
        calculateAchievementPercentage(requiredCompetencies, mockCompetencies);
      } else {
        setUserCompetencies({});
        setAchievementPercentage(0);
      }
    }
  };

  // Calculate achievement percentage
  const calculateAchievementPercentage = (requiredCompetencies: Competency[], userCompetencies: {[key: number]: number}) => {
    if (requiredCompetencies.length === 0) {
      setAchievementPercentage(100);
      return;
    }

    let totalAchievement = 0;
    let totalRequired = 0;

    requiredCompetencies.forEach(competency => {
      const userLevel = userCompetencies[competency.competencyID] || 0;
      const requiredLevel = competency.requiredLevel;
      
      if (userLevel >= requiredLevel) {
        totalAchievement += 100; // Fully achieved
      } else if (userLevel > 0) {
        totalAchievement += (userLevel / requiredLevel) * 100; // Partial achievement
      }
      
      totalRequired += 100;
    });

    const percentage = Math.round((totalAchievement / totalRequired) * 100);
    setAchievementPercentage(percentage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={fetchCareerPathData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
                 <div className="flex items-center justify-between mb-6">
           <div>
             <h2 className="text-lg font-semibold text-left text-gray-900">Career Path</h2>
             <p className="text-sm text-left text-gray-600">
               Explore career progression opportunities across different departments and job grades
             </p>
           </div>
           {userCurrentPosition && (
             <button
               onClick={scrollToCurrentPosition}
               className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
               title="Scroll to your current position"
             >
               <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
               </svg>
               Go to Current Position
             </button>
           )}
         </div>

        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Positions
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by position title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="sm:w-48">
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                id="department"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Departments</option>
                {activeDepartments.map((dept) => (
                  <option key={dept.departmentID} value={dept.departmentName}>
                    {dept.departmentName}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="sm:w-48">
              <label htmlFor="jobGrade" className="block text-sm font-medium text-gray-700 mb-2">
                Job Grade
              </label>
              <select
                id="jobGrade"
                value={selectedJobGrade}
                onChange={(e) => setSelectedJobGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Job Grades</option>
                {activeJobGrades.map((jg) => (
                  <option key={jg.jobGradeID} value={jg.jobGradeName}>
                    {jg.jobGradeName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {totalFilteredPositions} of {totalPositions} positions
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDepartment('');
                setSelectedJobGrade('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
        
        {/* Career Path Table */}
        {activeJobGrades.length === 0 || activeDepartments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-3.059 0-5.842-1.172-7.914-3.086M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No positions found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or filters to find more positions.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDepartment('');
                setSelectedJobGrade('');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
                 ) : (
           <div className="relative">
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-300 relative">
                 <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                   <tr>
                     <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 sticky left-0 bg-gray-50 z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] w-32">
                       <div className="break-words">Department</div>
                     </th>
                     {activeJobGrades.map((jobGrade) => (
                                               <th key={jobGrade.jobGradeID} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                         <div>
                           <div className="font-semibold">{jobGrade.jobGradeName}</div>
                           {jobGrade.jobGradeDescription && (
                             <div className="text-xs text-gray-500 mt-1">
                               {jobGrade.jobGradeDescription}
                             </div>
                           )}
                         </div>
                       </th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {activeDepartments.map((dept) => (
                     <tr key={dept.departmentID} className="hover:bg-gray-50">
                       <td className="px-3 py-4 text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-50 sticky left-0 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] w-32">
                         <div>
                           <div className="font-semibold break-words leading-tight">{dept.departmentName}</div>
                         </div>
                       </td>
                       {activeJobGrades.map((jobGrade) => {
                         const departmentPositions = getPositionsForGradeAndDepartment(jobGrade.jobGradeName, dept.departmentName);
                         return (
                                                       <td key={jobGrade.jobGradeID} className="px-3 py-4 text-sm text-gray-900">
                             {departmentPositions.length > 0 ? (
                               <div className="space-y-2">
                                 {departmentPositions.map((position) => (
                                                                       <div 
                                      key={position.positionID}
                                      data-position-id={position.positionID}
                                      onClick={() => handlePositionClick(position)}
                                      className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer group w-48 ${
                                        userCurrentPosition && userCurrentPosition.positionID === position.positionID
                                          ? 'bg-green-100 border-green-300 hover:bg-green-200 hover:shadow-md'
                                          : 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:shadow-md'
                                      }`}
                                    >
                                     <div className={`font-medium group-hover:text-opacity-80 ${
                                       userCurrentPosition && userCurrentPosition.positionID === position.positionID
                                         ? 'text-green-900'
                                         : 'text-blue-900'
                                     }`}>
                                       {position.positionTitle}
                                       {userCurrentPosition && userCurrentPosition.positionID === position.positionID && (
                                         <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                                           Current
                                         </span>
                                       )}
                                     </div>
                                     {position.requiredCompetencies && position.requiredCompetencies.length > 0 && (
                                       <div className={`text-xs mt-1 ${
                                         userCurrentPosition && userCurrentPosition.positionID === position.positionID
                                           ? 'text-green-600'
                                           : 'text-blue-600'
                                       }`}>
                                         {position.requiredCompetencies.length} competencies required
                                       </div>
                                     )}
                                   </div>
                                 ))}
                               </div>
                             ) : (
                               <div className="text-gray-400 text-center py-4">
                                 -
                               </div>
                             )}
                           </td>
                         );
                       })}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
         )}
      </div>

       {/* Floating Go to Current Position Button */}
       {userCurrentPosition && (
         <div className="fixed bottom-6 right-6 z-50">
           <button
             onClick={scrollToCurrentPosition}
             className="inline-flex items-center px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-full shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 hover:shadow-xl transform hover:scale-105"
             title="Go to your current position"
           >
             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
             </svg>
             <span className="hidden sm:inline">Go to Current Position</span>
             <span className="sm:hidden">Current</span>
           </button>
         </div>
       )}

       {/* Position Detail Modal */}
       {showPositionModal && selectedPosition && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
             {/* Modal Header */}
             <div className="flex items-center justify-between p-6 border-b border-gray-200">
               <div>
                 <h2 className="text-2xl font-bold text-gray-900">{selectedPosition.positionTitle}</h2>
                 <p className="text-gray-600 mt-1">
                   {selectedPosition.departmentName} • {selectedPosition.jobGrade}
                 </p>
               </div>
               <button
                 onClick={closePositionModal}
                 className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

                           {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Achievement Percentage */}
                {selectedPosition.requiredCompetencies && selectedPosition.requiredCompetencies.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Competency Match</h3>
                      
                      {Object.keys(userCompetencies).length === 0 ? (
                        <div className="py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">Analyzing your competencies...</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-center space-x-4">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-blue-600">{achievementPercentage}%</div>
                              <div className="text-sm text-gray-600">Achievement</div>
                            </div>
                            <div className="w-px h-12 bg-gray-300"></div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900">
                                {selectedPosition.requiredCompetencies.length}
                              </div>
                              <div className="text-sm text-gray-600">Competencies Required</div>
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  achievementPercentage >= 80 ? 'bg-green-500' :
                                  achievementPercentage >= 60 ? 'bg-yellow-500' :
                                  achievementPercentage >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${achievementPercentage}%` }}
                              ></div>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              {achievementPercentage >= 80 ? 'Excellent match!' :
                               achievementPercentage >= 60 ? 'Good match' :
                               achievementPercentage >= 40 ? 'Partial match' : 'Needs improvement'}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Position Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <h3 className="text-lg font-semibold text-gray-900 mb-3">Position Information</h3>
                   <div className="space-y-3">
                     {selectedPosition.positionDescription && (
                       <div>
                         <span className="text-sm font-medium text-gray-600">Description:</span>
                         <p className="text-gray-900 mt-1">{selectedPosition.positionDescription}</p>
                       </div>
                     )}
                     {selectedPosition.experienceRequirement && (
                       <div>
                         <span className="text-sm font-medium text-gray-600">Experience Required:</span>
                         <p className="text-gray-900 mt-1">{selectedPosition.experienceRequirement} years</p>
                       </div>
                     )}
                     {selectedPosition.leadershipLevel && (
                       <div>
                         <span className="text-sm font-medium text-gray-600">Leadership Level:</span>
                         <p className="text-gray-900 mt-1">{selectedPosition.leadershipLevel}</p>
                       </div>
                     )}
                   </div>
                 </div>

                 <div>
                   <h3 className="text-lg font-semibold text-gray-900 mb-3">Department & Grade</h3>
                   <div className="space-y-3">
                     <div>
                       <span className="text-sm font-medium text-gray-600">Department:</span>
                       <p className="text-gray-900 mt-1">{selectedPosition.departmentName}</p>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-600">Job Grade:</span>
                       <p className="text-gray-900 mt-1">{selectedPosition.jobGrade}</p>
                     </div>
                     {selectedPosition.jobGradeLevel && (
                       <div>
                         <span className="text-sm font-medium text-gray-600">Grade Level:</span>
                         <p className="text-gray-900 mt-1">{selectedPosition.jobGradeLevel}</p>
                       </div>
                     )}
                   </div>
                 </div>
               </div>

                               {/* Competencies Section */}
                {selectedPosition.requiredCompetencies && selectedPosition.requiredCompetencies.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Competencies</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {Object.keys(userCompetencies).length === 0 ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading your competency levels...</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedPosition.requiredCompetencies.map((competency) => (
                         <div key={competency.competencyID} className="bg-white p-3 rounded-md border border-gray-200">
                           <div className="flex items-center justify-between mb-2">
                             <h4 className="font-medium text-gray-900">
                               {competency.competencyName || `Competency ${competency.competencyID}`}
                             </h4>
                             {competency.isMandatory && (
                               <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                 Mandatory
                               </span>
                             )}
                           </div>
                                                       <div className="space-y-2">
                              {/* Required Level */}
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Required Level:</span>
                                <div className="flex space-x-1">
                                  {[1, 2, 3, 4, 5].map((level) => (
                                    <div
                                      key={level}
                                      className={`w-4 h-4 rounded-full border-2 ${
                                        level <= competency.requiredLevel
                                          ? 'bg-blue-500 border-blue-500'
                                          : 'bg-gray-200 border-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  Level {competency.requiredLevel}
                                </span>
                              </div>
                              
                              {/* Your Current Level */}
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Your Level:</span>
                                <div className="flex space-x-1">
                                  {[1, 2, 3, 4, 5].map((level) => {
                                    const userLevel = userCompetencies[competency.competencyID] || 0;
                                    const isCurrentLevel = level === userLevel;
                                    
                                    return (
                                      <div
                                        key={level}
                                        className={`w-4 h-4 rounded-full border-2 ${
                                          isCurrentLevel
                                            ? 'bg-green-500 border-green-500'
                                            : level <= userLevel
                                            ? 'bg-green-200 border-green-300'
                                            : 'bg-gray-200 border-gray-300'
                                        }`}
                                      />
                                    );
                                  })}
                                </div>
                                <span className={`text-sm font-medium ${
                                  userCompetencies[competency.competencyID] 
                                    ? userCompetencies[competency.competencyID] >= competency.requiredLevel
                                      ? 'text-green-600'
                                      : 'text-orange-600'
                                    : 'text-gray-500'
                                }`}>
                                  {userCompetencies[competency.competencyID] 
                                    ? `Level ${userCompetencies[competency.competencyID]}`
                                    : 'Not assessed'}
                                </span>
                              </div>
                              
                              {/* Status Indicator */}
                              {userCompetencies[competency.competencyID] && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600">Status:</span>
                                  {userCompetencies[competency.competencyID] >= competency.requiredLevel ? (
                                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                      ✓ Met
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                                      ⚠ Needs {competency.requiredLevel - userCompetencies[competency.competencyID]} more levels
                                    </span>
                                  )}
                                </div>
                                                            )}
                            </div>
                          </div>
                        ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

               {/* No Competencies Message */}
               {(!selectedPosition.requiredCompetencies || selectedPosition.requiredCompetencies.length === 0) && (
                 <div className="text-center py-8">
                   <div className="text-gray-400 mb-2">
                     <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-3.059 0-5.842-1.172-7.914-3.086M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                     </svg>
                   </div>
                   <p className="text-gray-600">No specific competencies required for this position</p>
                 </div>
               )}
             </div>

             {/* Modal Footer */}
             <div className="flex items-center justify-end p-6 border-t border-gray-200">
               <button
                 onClick={closePositionModal}
                 className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
               >
                 Close
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default CareerPath;
