import { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';
import { Users, Briefcase, UserCheck, BarChart3 } from 'lucide-react';

interface Department {
  departmentID: number;
  departmentName: string;
}

interface JobFunction {
  jobFunctionID: number;
  jobFunctionName: string;
}

interface Employee {
  employeeID: number;
  firstName: string;
  lastName: string;
  positionID: number;
  departmentName?: string;
  jobFunctionName?: string;
  jobGrade?: string;
  workerCategory?: string;
}

interface JobGrade {
  jobGradeID: number;
  jobGradeName: string;
  jobGradeLevel?: number;
}

interface CompetencyDomain {
  domainID: number;
  domainName: string;
  domainDescription?: string;
}

interface Competency {
  competencyID: number;
  competencyName: string;
  categoryID: number;
  categoryName?: string;
  domainID: number;
  domainName?: string;
}

interface PositionCompetencyRequirement {
  requirementID: number;
  positionID: number;
  competencyID: number;
  requiredLevel: number;
  isMandatory: boolean;
}

interface CompetencyScore {
  scoreID: number;
  assessmentID: number;
  competencyID: number;
  currentLevel: number;
  comments?: string;
}

interface Assessment {
  assessmentID: number;
  employeeID: number;
  assessmentDate: string;
  assessmentType: string;
  status: string;
}

// New interface for the CompetencyProgress view
interface CompetencyProgress {
  domainID: number;
  domain: string;
  categoryID: number;
  category: string;
  competencyID: number;
  competency: string;
  assigned: number;
  achieved: number;
}

const OrganizationCompetency = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobFunctions, setJobFunctions] = useState<JobFunction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobGrades, setJobGrades] = useState<JobGrade[]>([]);
  const [competencyDomains, setCompetencyDomains] = useState<CompetencyDomain[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [positionRequirements, setPositionRequirements] = useState<PositionCompetencyRequirement[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [competencyScores, setCompetencyScores] = useState<CompetencyScore[]>([]);
  const [competencyProgress, setCompetencyProgress] = useState<CompetencyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedJobFunctions, setSelectedJobFunctions] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Dropdown visibility states
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showJobFunctionDropdown, setShowJobFunctionDropdown] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // Search states
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [jobFunctionSearch, setJobFunctionSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.department-dropdown') && !target.closest('.jobfunction-dropdown') && !target.closest('.employee-dropdown')) {
        setShowDepartmentDropdown(false);
        setShowJobFunctionDropdown(false);
        setShowEmployeeDropdown(false);
        
        // Clear search fields when dropdowns are closed
        setDepartmentSearch('');
        setJobFunctionSearch('');
        setEmployeeSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch departments
      const departmentsResponse = await fetch(getApiUrl('Departments'));
      if (!departmentsResponse.ok) throw new Error('Failed to fetch departments');
      const departmentsData = await departmentsResponse.json();

      // Fetch job functions
      const jobFunctionsResponse = await fetch(getApiUrl('JobFunctions'));
      if (!jobFunctionsResponse.ok) throw new Error('Failed to fetch job functions');
      const jobFunctionsData = await jobFunctionsResponse.json();

      // Fetch employees
      const employeesResponse = await fetch(getApiUrl('Employees'));
      if (!employeesResponse.ok) throw new Error('Failed to fetch employees');
      const employeesData = await employeesResponse.json();
      
      // Debug: Log the raw API response for employees
      console.log('Raw employees API response:', employeesData.slice(0, 2));

      // Fetch job grades
      const jobGradesResponse = await fetch(getApiUrl('Positions/jobgrades'));
      if (!jobGradesResponse.ok) throw new Error('Failed to fetch job grades');
      const jobGradesData = await jobGradesResponse.json();

      // Fetch competency domains
      const domainsResponse = await fetch(getApiUrl('CompetencyDomains'));
      if (!domainsResponse.ok) throw new Error('Failed to fetch competency domains');
      const domainsData = await domainsResponse.json();

      // Fetch competencies
      const competenciesResponse = await fetch(getApiUrl('Competencies'));
      if (!competenciesResponse.ok) throw new Error('Failed to fetch competencies');
      const competenciesData = await competenciesResponse.json();

      // Fetch position competency requirements
      const requirementsResponse = await fetch(getApiUrl('PositionCompetencyRequirements'));
      if (!requirementsResponse.ok) throw new Error('Failed to fetch position requirements');
      const requirementsData = await requirementsResponse.json();

      // Fetch assessments
      const assessmentsResponse = await fetch(getApiUrl('Assessments'));
      if (!assessmentsResponse.ok) throw new Error('Failed to fetch assessments');
      const assessmentsData = await assessmentsResponse.json();

             // Fetch competency scores
       const scoresResponse = await fetch(getApiUrl('CompetencyScores'));
       if (!scoresResponse.ok) throw new Error('Failed to fetch competency scores');
       const scoresData = await scoresResponse.json();

       // Fetch competency progress from the view
       let progressData: CompetencyProgress[] = [];
       try {
         const progressResponse = await fetch(getApiUrl('CompetencyProgress'));
         if (progressResponse.ok) {
           progressData = await progressResponse.json();
         } else {
           console.warn('Failed to fetch competency progress, using empty data');
         }
       } catch (error) {
         console.warn('Error fetching competency progress:', error);
       }

       setDepartments(departmentsData);
       setJobFunctions(jobFunctionsData);
       setEmployees(employeesData);
       setJobGrades(jobGradesData.sort((a: JobGrade, b: JobGrade) => (a.jobGradeLevel || 0) - (b.jobGradeLevel || 0)));
       setCompetencyDomains(domainsData);
       setCompetencies(competenciesData);
       setPositionRequirements(requirementsData);
       setAssessments(assessmentsData);
       setCompetencyScores(scoresData);
       setCompetencyProgress(progressData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Filter employees based on selected criteria
  const filteredEmployees = employees.filter(employee => {
    const deptMatch = selectedDepartments.length === 0 || 
      (employee.departmentName && selectedDepartments.includes(employee.departmentName));
    const jobFuncMatch = selectedJobFunctions.length === 0 || 
      (employee.jobFunctionName && selectedJobFunctions.includes(employee.jobFunctionName));
    const employeeMatch = selectedEmployees.length === 0 || 
      selectedEmployees.includes(`${employee.firstName} ${employee.lastName}`);
    
    return deptMatch && jobFuncMatch && employeeMatch;
  });

  // Calculate statistics
  const totalEmployees = filteredEmployees.length;
  
  // Debug: Log the actual worker category values to see what's in the database
  console.log('Worker categories found:', [...new Set(filteredEmployees.map(emp => emp.workerCategory))]);
  
  // Check for worker category values based on database structure
  let whiteCollarCount = filteredEmployees.filter(emp => 
    emp.workerCategory && (
      emp.workerCategory === 'White collar' || 
      emp.workerCategory === 'White Collar' ||
      emp.workerCategory === 'W' ||
      emp.workerCategory.toLowerCase().includes('white')
    )
  ).length;
  
  let blueCollarCount = filteredEmployees.filter(emp => 
    emp.workerCategory && (
      emp.workerCategory === 'Blue collar' || 
      emp.workerCategory === 'Blue Collar' ||
      emp.workerCategory === 'B' ||
      emp.workerCategory.toLowerCase().includes('blue')
    )
  ).length;

  // If no worker categories are found, try to infer from job grades or other fields
  if (whiteCollarCount === 0 && blueCollarCount === 0) {
    console.log('No worker categories found, attempting to infer from job grades...');
    
    // Infer white collar from job grades (typically P1-P4, M1-M4 are white collar)
    const inferredWhiteCollar = filteredEmployees.filter(emp => 
      emp.jobGrade && (
        emp.jobGrade.startsWith('P') || 
        emp.jobGrade.startsWith('M') ||
        emp.jobGrade.startsWith('E') ||
        emp.jobGrade.startsWith('D')
      )
    ).length;
    
    // Infer blue collar from job grades (typically W1-W4 are blue collar)
    const inferredBlueCollar = filteredEmployees.filter(emp => 
      emp.jobGrade && emp.jobGrade.startsWith('W')
    ).length;
    
    if (inferredWhiteCollar > 0 || inferredBlueCollar > 0) {
      console.log(`Inferred: White Collar: ${inferredWhiteCollar}, Blue Collar: ${inferredBlueCollar}`);
      // Use inferred values if no explicit worker categories are set
      whiteCollarCount = inferredWhiteCollar;
      blueCollarCount = inferredBlueCollar;
    }
  }

  // Prepare chart data
  const chartData = jobGrades.map(grade => ({
    name: grade.jobGradeName,
    count: filteredEmployees.filter(emp => emp.jobGrade === grade.jobGradeName).length
  }));

     // Calculate competency achievement percentages by domain using the view data
   const calculateCompetencyAchievementByDomain = () => {
     const domainAchievement: { domainName: string; percentage: number; assignedCount: number; achievedCount: number }[] = [];

     // Group competency progress data by domain
     const domainProgress = competencyProgress.reduce((acc, item) => {
       if (!acc[item.domain]) {
         acc[item.domain] = {
           domainName: item.domain,
           totalAssigned: 0,
           totalAchieved: 0
         };
       }
       acc[item.domain].totalAssigned += item.assigned;
       acc[item.domain].totalAchieved += item.achieved;
       return acc;
     }, {} as Record<string, { domainName: string; totalAssigned: number; totalAchieved: number }>);

     // Convert to array and calculate percentages
     Object.values(domainProgress).forEach(domain => {
       const percentage = domain.totalAssigned > 0 ? (domain.totalAchieved / domain.totalAssigned) * 100 : 0;
       
       domainAchievement.push({
         domainName: domain.domainName,
         percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal place
         assignedCount: domain.totalAssigned,
         achievedCount: domain.totalAchieved
       });
     });

     return domainAchievement.sort((a, b) => b.percentage - a.percentage);
   };

  const domainAchievementData = calculateCompetencyAchievementByDomain();

     // Debug: Log competency progress data from the view
   console.log('Competency progress data from view:', competencyProgress.slice(0, 5));
   console.log('Domain achievement calculated:', domainAchievementData);

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
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-left text-gray-900">Organization Competency</h2>
            <p className="text-sm text-left text-gray-600">
              
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Department Filter */}
          <div className="relative department-dropdown">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department {selectedDepartments.length > 0 && <span className="text-blue-600">({selectedDepartments.length} selected)</span>}
              <span className="ml-1 text-xs text-gray-500">(Multiple)</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between"
              >
                <span className={selectedDepartments.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
                  {selectedDepartments.length === 0 ? 'All Departments' : `${selectedDepartments.length} selected`}
                </span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
                             {showDepartmentDropdown && (
                 <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                   <div className="p-2">
                     {/* Search Input */}
                     <div className="mb-3">
                       <input
                         type="text"
                         placeholder="Search departments..."
                         value={departmentSearch}
                         onChange={(e) => setDepartmentSearch(e.target.value)}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                       />
                     </div>
                     
                     <div className="flex items-center justify-between mb-2">
                       <span className="text-sm font-medium text-gray-700"></span>
                       <div className="flex space-x-2">
                         <button
                           onClick={() => setSelectedDepartments(departments.map(d => d.departmentName))}
                           className="text-xs text-green-600 hover:text-green-800"
                         >
                           Select All
                         </button>
                         <button
                           onClick={() => setSelectedDepartments([])}
                           className="text-xs text-blue-600 hover:text-blue-800"
                         >
                           Clear All
                         </button>
                       </div>
                     </div>
                     
                     {(() => {
                       const filteredDepartments = departments.filter(dept => 
                         dept.departmentName.toLowerCase().includes(departmentSearch.toLowerCase())
                       );
                       
                       if (filteredDepartments.length === 0) {
                         return (
                           <div className="text-center py-4 text-gray-500 text-sm">
                             No departments found matching "{departmentSearch}"
                           </div>
                         );
                       }
                       
                       return filteredDepartments.map((dept) => (
                         <label key={dept.departmentID} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                           <input
                             type="checkbox"
                             checked={selectedDepartments.includes(dept.departmentName)}
                             onChange={(e) => {
                               if (e.target.checked) {
                                 setSelectedDepartments([...selectedDepartments, dept.departmentName]);
                               } else {
                                 setSelectedDepartments(selectedDepartments.filter(d => d !== dept.departmentName));
                               }
                             }}
                             className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                           />
                           <span className="ml-2 text-sm text-gray-700">{dept.departmentName}</span>
                         </label>
                       ));
                     })()}
                   </div>
                 </div>
               )}
            </div>
          </div>

          {/* Job Function Filter */}
          <div className="relative jobfunction-dropdown">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Function {selectedJobFunctions.length > 0 && <span className="text-blue-600">({selectedJobFunctions.length} selected)</span>}
              <span className="ml-1 text-xs text-gray-500">(Multiple)</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowJobFunctionDropdown(!showJobFunctionDropdown)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between"
              >
                <span className={selectedJobFunctions.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
                  {selectedJobFunctions.length === 0 ? 'All Job Functions' : `${selectedJobFunctions.length} selected`}
                </span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
                             {showJobFunctionDropdown && (
                 <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                   <div className="p-2">
                     {/* Search Input */}
                     <div className="mb-3">
                       <input
                         type="text"
                         placeholder="Search job functions..."
                         value={jobFunctionSearch}
                         onChange={(e) => setJobFunctionSearch(e.target.value)}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                       />
                     </div>
                     
                     <div className="flex items-center justify-between mb-2">
                       <span className="text-sm font-medium text-gray-700"></span>
                       <div className="flex space-x-2">
                         <button
                           onClick={() => setSelectedJobFunctions(jobFunctions.map(j => j.jobFunctionName))}
                           className="text-xs text-green-600 hover:text-green-800"
                         >
                           Select All
                         </button>
                         <button
                           onClick={() => setSelectedJobFunctions([])}
                           className="text-xs text-blue-600 hover:text-blue-800"
                         >
                           Clear All
                         </button>
                       </div>
                     </div>
                     
                     {(() => {
                       const filteredJobFunctions = jobFunctions.filter(jobFunc => 
                         jobFunc.jobFunctionName.toLowerCase().includes(jobFunctionSearch.toLowerCase())
                       );
                       
                       if (filteredJobFunctions.length === 0) {
                         return (
                           <div className="text-center py-4 text-gray-500 text-sm">
                             No job functions found matching "{jobFunctionSearch}"
                           </div>
                         );
                       }
                       
                       return filteredJobFunctions.map((jobFunc) => (
                         <label key={jobFunc.jobFunctionID} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                           <input
                             type="checkbox"
                             checked={selectedJobFunctions.includes(jobFunc.jobFunctionName)}
                             onChange={(e) => {
                               if (e.target.checked) {
                                 setSelectedJobFunctions([...selectedJobFunctions, jobFunc.jobFunctionName]);
                               } else {
                                 setSelectedJobFunctions(selectedJobFunctions.filter(j => j !== jobFunc.jobFunctionName));
                               }
                             }}
                             className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                           />
                           <span className="ml-2 text-sm text-gray-700">{jobFunc.jobFunctionName}</span>
                         </label>
                       ));
                     })()}
                   </div>
                 </div>
               )}
            </div>
          </div>

          {/* Employee Filter */}
          <div className="relative employee-dropdown">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee {selectedEmployees.length > 0 && <span className="text-blue-600">({selectedEmployees.length} selected)</span>}
              <span className="ml-1 text-xs text-gray-500">(Multiple)</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between"
              >
                <span className={selectedEmployees.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
                  {selectedEmployees.length === 0 ? 'All Employees' : `${selectedEmployees.length} selected`}
                </span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
                             {showEmployeeDropdown && (
                 <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                   <div className="p-2">
                     {/* Search Input */}
                     <div className="mb-3">
                       <input
                         type="text"
                         placeholder="Search employees..."
                         value={employeeSearch}
                         onChange={(e) => setEmployeeSearch(e.target.value)}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                       />
                     </div>
                     
                     <div className="flex items-center justify-between mb-2">
                       <span className="text-sm font-medium text-gray-700"></span>
                       <div className="flex space-x-2">
                         <button
                           onClick={() => setSelectedEmployees(employees.map(e => `${e.firstName} ${e.lastName}`))}
                           className="text-xs text-green-600 hover:text-green-800"
                         >
                           Select All
                         </button>
                         <button
                           onClick={() => setSelectedEmployees([])}
                           className="text-xs text-blue-600 hover:text-blue-800"
                         >
                           Clear All
                         </button>
                       </div>
                     </div>
                     
                     {(() => {
                       const filteredEmployees = employees.filter(employee => {
                         const fullName = `${employee.firstName} ${employee.lastName}`;
                         return fullName.toLowerCase().includes(employeeSearch.toLowerCase());
                       });
                       
                       if (filteredEmployees.length === 0) {
                         return (
                           <div className="text-center py-4 text-gray-500 text-sm">
                             No employees found matching "{employeeSearch}"
                           </div>
                         );
                       }
                       
                       return filteredEmployees.map((employee) => (
                         <label key={employee.employeeID} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                           <input
                             type="checkbox"
                             checked={selectedEmployees.includes(`${employee.firstName} ${employee.lastName}`)}
                             onChange={(e) => {
                               const fullName = `${employee.firstName} ${employee.lastName}`;
                               if (e.target.checked) {
                                 setSelectedEmployees([...selectedEmployees, fullName]);
                               } else {
                                 setSelectedEmployees(selectedEmployees.filter(name => name !== fullName));
                               }
                             }}
                             className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                           />
                           <span className="ml-2 text-sm text-gray-700">{employee.firstName} {employee.lastName}</span>
                         </label>
                       ));
                     })()}
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>

             {/* Main Content Grid */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
         {/* Left Column - Employee Cards */}
         <div className="lg:col-span-1 space-y-4">
          {/* Total Employee Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Employees</h3>
                <p className="text-3xl font-bold text-blue-600">{totalEmployees}</p>
              </div>
            </div>
          </div>

                     {/* White Collar and Blue Collar Cards in same row */}
           <div className="grid grid-cols-2 gap-3">
            {/* White Collar Card */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-full">
                  <UserCheck className="w-5 h-5 text-gray-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-gray-900">White Collar</h3>
                  <p className="text-2xl font-bold text-gray-600">{whiteCollarCount}</p>
                  <p className="text-xs text-gray-500">
                    {totalEmployees > 0 ? `${((whiteCollarCount / totalEmployees) * 100).toFixed(1)}%` : '0%'} of total
                  </p>
                </div>
              </div>
            </div>

            {/* Blue Collar Card */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-gray-900">Blue Collar</h3>
                  <p className="text-2xl font-bold text-blue-600">{blueCollarCount}</p>
                  <p className="text-xs text-gray-500">
                    {totalEmployees > 0 ? `${((blueCollarCount / totalEmployees) * 100).toFixed(1)}%` : '0%'} of total
                  </p>
                </div>
              </div>
            </div>
          </div>

                     {/* Competency Overview Radar Chart */}
           <div className="bg-white rounded-lg shadow-sm border p-6">
             <div className="flex items-center mb-4">
               <div className="p-2 bg-green-100 rounded-full">
                 <BarChart3 className="w-5 h-5 text-green-600" />
               </div>
               <h3 className="ml-3 text-lg font-semibold text-gray-900">Competency Overview by Domain</h3>
             </div>
             
                           {domainAchievementData.length > 0 ? (
                <div className="space-y-4">
                  {/* Radar Chart */}
                  <div className="relative w-full h-64">
                    <svg className="w-full h-full" viewBox="0 0 300 300">
                      {/* Draw radar grid lines */}
                      {[20, 40, 60, 80, 100].map((percentage, index) => (
                        <circle
                          key={index}
                          cx="150"
                          cy="150"
                          r={120 * (percentage / 100)}
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="1"
                        />
                      ))}
                      
                      {/* Draw percentage labels */}
                      {[20, 40, 60, 80, 100].map((percentage, index) => (
                        <text
                          key={index}
                          x="150"
                          y={150 - 120 * (percentage / 100) - 5}
                          textAnchor="middle"
                          className="text-xs fill-gray-500"
                        >
                          {percentage}%
                        </text>
                      ))}
                      
                      {/* Draw domain axis lines */}
                      {domainAchievementData.map((domain, index) => {
                        const angle = (index * 2 * Math.PI) / domainAchievementData.length - Math.PI / 2;
                        const x1 = 150;
                        const y1 = 150;
                        const x2 = 150 + 120 * Math.cos(angle);
                        const y2 = 150 + 120 * Math.sin(angle);
                        
                        return (
                          <line
                            key={index}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                          />
                        );
                      })}
                      
                      {/* Draw radar chart data */}
                      {domainAchievementData.length > 0 && (
                        <polygon
                          points={domainAchievementData.map((domain, index) => {
                            const angle = (index * 2 * Math.PI) / domainAchievementData.length - Math.PI / 2;
                            const radius = 120 * (domain.percentage / 100);
                            const x = 150 + radius * Math.cos(angle);
                            const y = 150 + radius * Math.sin(angle);
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="rgba(59, 130, 246, 0.2)"
                          stroke="#3b82f6"
                          strokeWidth="2"
                        />
                      )}
                      
                      {/* Draw domain labels */}
                      {domainAchievementData.map((domain, index) => {
                        const angle = (index * 2 * Math.PI) / domainAchievementData.length - Math.PI / 2;
                        const labelRadius = 140;
                        const x = 150 + labelRadius * Math.cos(angle);
                        const y = 150 + labelRadius * Math.sin(angle);
                        
                        return (
                          <text
                            key={index}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            className="text-xs fill-gray-700 font-medium"
                          >
                            {domain.domainName}
                          </text>
                        );
                      })}
                    </svg>
                  </div>
                  
                  {/* Domain Details */}
                  <div className="grid grid-cols-1 gap-2">
                    {domainAchievementData.map((domain, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium text-gray-700">{domain.domainName}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {domain.achievedCount}/{domain.assignedCount}
                          </span>
                          <span className="text-sm font-semibold text-blue-600">
                            {domain.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : competencyProgress.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No competency progress data available</p>
                  <p className="text-xs text-gray-400">
                    The competency progress view may not have data yet.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Please ensure the vw_CompetencyProgress view is created and populated.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No competency data available</p>
                  <p className="text-xs text-gray-400">
                    To see competency data, please run the database setup scripts:
                  </p>
                  <div className="mt-3 text-xs text-gray-400 space-y-1">
                    <p>1. Career_Navigator_Sample_Data.sql</p>
                    <p>2. Add_Sample_Assessments_For_Radar_Chart.sql</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Or ensure competency domains, competencies, and assessments are configured.
                  </p>
                </div>
              )}
           </div>
        </div>

        {/* Right Column - Bar Chart */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-blue-100 rounded-full">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Employee Distribution by Job Grade</h3>
            </div>
            
                         {/* Column Chart */}
             <div className="flex items-end justify-between h-64 space-x-2">
               {chartData.map((item, index) => {
                 const maxCount = Math.max(...chartData.map(d => d.count));
                 const columnHeight = item.count === 0 ? 4 : Math.max(20, (item.count / maxCount) * 240);
                 return (
                   <div key={index} className="flex flex-col items-center flex-1">
                     <div className="text-xs text-gray-600 mb-2 text-center font-medium">{item.count}</div>
                     <div 
                       className="w-full bg-blue-600 rounded-t transition-all duration-300"
                       style={{ height: `${columnHeight}px` }}
                     ></div>
                     <div className="text-xs text-gray-600 mt-2 text-center truncate w-full">
                       {item.name}
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationCompetency;
