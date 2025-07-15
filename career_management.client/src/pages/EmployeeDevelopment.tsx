import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { User, ClipboardList, ArrowLeft, Menu, X, LogOut } from 'lucide-react';
import EmployeeProfile from '../components/EmployeeProfile';
import CompetencyAssessment from '../components/CompetencyAssessment';

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
  const currentEmployee = localStorage.getItem('currentEmployee');
  //console.log('currentEmployee in EmployeeDevelopment:', currentEmployee);
  const employeeId = currentEmployee ? JSON.parse(currentEmployee).employeeID : null;
  //const employeeId = 1;
  console.log('employeeId in EmployeeDevelopment:', employeeId);


  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const menuItems = [
    { path: 'profile', label: 'Profile', icon: User },
    { path: 'assessment', label: 'Competency Assessment', icon: ClipboardList },
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
      const response = await fetch(`https://localhost:7026/api/Employees/${employeeId}`);
      if (!response.ok) throw new Error('Failed to fetch employee data');
      const employeeData = await response.json();

      // 2. Fetch position
      const positionResponse = await fetch(`https://localhost:7026/api/Positions/${employeeData.positionID}`);
      const positionData = positionResponse.ok ? await positionResponse.json() : {};

      // 3. Fetch department
      const departmentResponse = await fetch(`https://localhost:7026/api/Departments/${positionData.departmentID}`);
      const departmentData = departmentResponse.ok ? await departmentResponse.json() : {};

      // 4. Fetch company
      const companyResponse = await fetch(`https://localhost:7026/api/Companies/${departmentData.companyID}`);
      const companyData = companyResponse.ok ? await companyResponse.json() : {};

      // 5. Fetch manager (employee)
      let managerName = '';
      if (departmentData.managerID) {
        const managerResponse = await fetch(`https://localhost:7026/api/Employees/${departmentData.managerID}`);
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

  const handleLogout = () => {
    localStorage.removeItem('currentEmployee');
    window.location.href = '/';
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
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-72 sm:w-80 lg:w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex-shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
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
          
          {/* Employee Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <h2 className="text-sm font-semibold text-gray-900">
                  {employee?.firstName} {employee?.lastName}
                </h2>
                <p className="text-xs text-gray-600">{employee?.positionTitle}</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 h-full overflow-y-auto">
            <ul className="space-y-1 sm:space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-3 py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
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
          <div className="h-full p-3 sm:p-4 lg:p-6 xl:p-8 overflow-auto">
            <Routes>
              <Route path="profile" element={<EmployeeProfile employee={employee} />} />
              <Route path="assessment" element={<CompetencyAssessment employeeId={employeeId} />} />
              <Route path="" element={<EmployeeProfile employee={employee} />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployeeDevelopment; 