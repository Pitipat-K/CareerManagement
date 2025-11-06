import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { User, ClipboardList, ArrowLeft, Menu, X, LogOut, PieChart, TrendingUp, Map, ChevronLeft, ChevronRight, Building } from 'lucide-react';
import { useOktaAuth } from '@okta/okta-react';
import EmployeeProfile from '../components/EmployeeProfile';
import CompetencyAssessment from '../components/CompetencyAssessment';
import CompetencyDashboard from '../components/CompetencyDashboard';
import DevelopmentPlan from '../components/DevelopmentPlan';
import CareerNavigator from '../components/CareerNavigator';
import CareerPath from '../components/CareerPath';
import OrganizationCompetency from '../components/OrganizationCompetency';
import { getApiUrl } from '../config/api';
import { getCurrentEmployee, getUserEmail } from '../utils/auth';
import { usePermissionContext } from '../contexts/PermissionContext';
import { performLogout } from '../utils/logout';

interface Employee {
  employeeID: number;
  firstName: string;
  lastName: string;
  positionTitle: string;
  email?: string;
  phone?: string;
  hireDate?: string;
  employeeCode?: string;
  dateOfBirth?: string;
  gender?: string;
  // New fields for profile details
  positionDescription?: string;
  managerName?: string;
  departmentName?: string;
  jobGroup?: string;
  jobGrade?: string;
  companyName?: string;
}

const EmployeeDevelopment = () => {
  // Debug log for session
  const currentEmployee = getCurrentEmployee();
  const userEmail = getUserEmail();
  //console.log('currentEmployee in EmployeeDevelopment:', currentEmployee);
  const employeeId = currentEmployee?.employeeID || null;
  //const employeeId = 1;
  console.log('employeeId in EmployeeDevelopment:', employeeId);
  console.log('userEmail in EmployeeDevelopment:', userEmail);


  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const { oktaAuth } = useOktaAuth();

  const menuItems = [
    { path: 'profile', label: 'Profile', icon: User },
    { path: 'assessment', label: 'Competency Assessment', icon: ClipboardList },
    { path: 'dashboard', label: 'Competency Dashboard', icon: PieChart },
    { path: 'development-plan', label: 'Development Plan', icon: ClipboardList },
    { path: 'career-navigator', label: 'Career Navigator', icon: TrendingUp },
    { path: 'career-path', label: 'Career Path', icon: Map },
    { path: 'organization-competency', label: 'Organization Competency', icon: Building },
  ];

  useEffect(() => {
    if (!employeeId) {
      // Don't redirect immediately, show error message instead
      setLoading(false);
      return;
    }
    fetchEmployeeData();
  }, [employeeId]);

  const fetchEmployeeData = async () => {
    try {
      // 1. Fetch employee
      const response = await fetch(getApiUrl(`Employees/${employeeId}`));
      if (!response.ok) throw new Error('Failed to fetch employee data');
      const employeeData = await response.json();

      // 2. Fetch position
      const positionResponse = await fetch(getApiUrl(`Positions/${employeeData.positionID}`));
      const positionData = positionResponse.ok ? await positionResponse.json() : {};

      // 3. Fetch department
      const departmentResponse = await fetch(getApiUrl(`Departments/${positionData.departmentID}`));
      const departmentData = departmentResponse.ok ? await departmentResponse.json() : {};

      // 4. Fetch company
      const companyResponse = await fetch(getApiUrl(`Companies/${departmentData.companyID}`));
      const companyData = companyResponse.ok ? await companyResponse.json() : {};

      // 5. Fetch manager (employee)
      let managerName = '';
      if (employeeData.managerID) {
        const managerResponse = await fetch(getApiUrl(`Employees/${employeeData.managerID}`));
        if (managerResponse.ok) {
          const managerData = await managerResponse.json();
          managerName = `${managerData.firstName} ${managerData.lastName}`;
        }
      }

      // 6. Combine all data
      setEmployee({
        ...employeeData,
        positionDescription: positionData.positionDescription,
        jobGroup: positionData.jobGroup,
        jobGrade: positionData.jobGrade,
        departmentName: departmentData.departmentName,
        companyName: companyData.companyName,
        managerName,
      });
    } catch (error) {
      console.error('Error fetching employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const { clearPermissions } = usePermissionContext();

  const handleLogout = async () => {
    await performLogout(oktaAuth, clearPermissions);
  };

  if (!employeeId) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogOut className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Session Expired</h2>
          <p className="text-gray-600 mb-4">Your session has expired or you are not logged in.</p>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employee data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Sticky Header */}
      <header className="bg-white shadow-sm border-b flex-shrink-0 sticky top-0 z-40">
        <div className="flex items-center justify-between px-3 sm:px-4 py-3">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link 
              to="/home"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
            <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">
              Employee Development
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex-shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarCollapsed ? 'w-16 lg:w-16' : 'w-72 sm:w-80 lg:w-64'}
        `}>
          <div className="flex items-center justify-between p-4 border-b lg:hidden">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Collapse/Expand Button - Desktop Only */}
          <div className="hidden lg:flex items-center justify-center p-2 border-b border-gray-200">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
          
          {/* Employee Info */}
          <div className="p-4 border-b border-gray-200">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'mb-4'}`}>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              {!sidebarCollapsed && (
                <div className="ml-3 min-w-0">
                  <h2 className="text-sm font-semibold text-gray-900 truncate">
                    {employee?.firstName} {employee?.lastName}
                  </h2>
                  <p className="text-xs text-gray-600 truncate">{employee?.positionTitle}</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 h-full overflow-y-auto">
            <ul className="space-y-1 sm:space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <div className="relative group">
                      <NavLink
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center rounded-lg transition-colors text-sm sm:text-base ${
                            sidebarCollapsed 
                              ? 'justify-center px-2 py-2 sm:py-3' 
                              : 'space-x-3 px-3 py-2 sm:py-3'
                          } ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </NavLink>
                      
                      {/* Tooltip for collapsed sidebar */}
                      {sidebarCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          {item.label}
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-0 h-0 border-l-4 border-r-0 border-t-4 border-b-4 border-transparent border-r-gray-900"></div>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className={`h-full overflow-auto transition-all duration-300 ${
            sidebarCollapsed ? 'p-3 sm:p-4 lg:p-6 xl:p-8' : 'p-3 sm:p-4 lg:p-6 xl:p-8'
          }`}>
            <Routes>
              <Route path="profile" element={<EmployeeProfile employee={employee} />} />
              <Route path="assessment" element={<CompetencyAssessment employeeId={employeeId} />} />
              <Route path="dashboard" element={<CompetencyDashboard employeeId={employeeId} />} />
              <Route path="development-plan" element={<DevelopmentPlan />} />
              <Route path="career-navigator" element={<CareerNavigator employeeId={employeeId} />} />
              <Route path="career-path" element={<CareerPath />} />
              <Route path="organization-competency" element={<OrganizationCompetency />} />
              <Route path="" element={<EmployeeProfile employee={employee} />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployeeDevelopment; 