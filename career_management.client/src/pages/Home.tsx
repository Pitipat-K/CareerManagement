import { Link } from 'react-router-dom';
import { 
  Building2, Users, Briefcase, Upload, Shield, 
  Target, FolderOpen, Globe, Package, UserCheck, 
  Wrench, Building, Settings, Activity, BarChart3,
  FileSpreadsheet, TrendingUp
} from 'lucide-react';
import { getUserEmail, getOktaUser, getCurrentEmployee, debugAuthData } from '../utils/auth';
import { PermissionGuard } from '../hooks/usePermissions';
import Header from '../components/Header';

const Home = () => {
  
  // Get user data using utility functions
  const userEmail = getUserEmail();
  const oktaUserData = getOktaUser();
  const employeeData = getCurrentEmployee();
  
  // Debug: Log what's in localStorage
  console.log('=== HOME PAGE DEBUG ===');
  console.log('userEmail from getUserEmail():', userEmail);
  console.log('oktaUserData:', oktaUserData);
  console.log('employeeData:', employeeData);
  
  // Use the debug utility function
  debugAuthData();
  
  // Check if employee matching was successful
  if (employeeData && employeeData.employeeID) {
    console.log('✅ Employee matching successful!');
    console.log('EmployeeID:', employeeData.employeeID);
    console.log('Employee Name:', employeeData.firstName, employeeData.lastName);
    console.log('Employee Email:', employeeData.email);
  } else {
    console.warn('⚠️ Employee matching may have failed or using default employee');
  }
  console.log('========================');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header showUserInfo={true} />
      
      <div className="w-full px-4 py-6 sm:py-8 lg:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            Welcome to Your Career Portal
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto px-4">
            Manage your professional development and explore career opportunities
          </p>
          
          
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 lg:p-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-800 mb-4 sm:mb-6 lg:mb-8">
              Organization Management
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 mb-8">
              {/* Employees */}
              <PermissionGuard 
                moduleCode="EMPLOYEES" 
                permissionCode="R"
                fallback={
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 opacity-60">
                    <div className="flex flex-col items-center text-center">
                      <Users className="w-8 h-8 mb-3 text-gray-400" />
                      <h3 className="text-sm font-semibold mb-1 text-gray-600">Employees</h3>
                      <p className="text-gray-500 text-xs">Access restricted</p>
                    </div>
                  </div>
                }
              >
                <Link 
                  to="/organization-management/employees"
                  className="group bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center">
                    <Users className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="text-sm font-semibold mb-1">Employees</h3>
                    <p className="text-blue-100 text-xs">Manage employee records</p>
                  </div>
                </Link>
              </PermissionGuard>

              {/* Positions */}
              <PermissionGuard 
                moduleCode="POSITIONS" 
                permissionCode="R"
                fallback={
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 opacity-60">
                    <div className="flex flex-col items-center text-center">
                      <Briefcase className="w-8 h-8 mb-3 text-gray-400" />
                      <h3 className="text-sm font-semibold mb-1 text-gray-600">Positions</h3>
                      <p className="text-gray-500 text-xs">Access restricted</p>
                    </div>
                  </div>
                }
              >
              <Link 
                  to="/organization-management/positions"
                  className="group bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4 hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center">
                    <Briefcase className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="text-sm font-semibold mb-1">Positions</h3>
                    <p className="text-purple-100 text-xs">Manage job positions</p>
                  </div>
                </Link>
              </PermissionGuard>

              {/* Job Functions */}
              <PermissionGuard 
                moduleCode="JOBFUNCTIONS" 
                permissionCode="R"
                fallback={
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 opacity-60">
                    <div className="flex flex-col items-center text-center">
                      <Wrench className="w-8 h-8 mb-3 text-gray-400" />
                      <h3 className="text-sm font-semibold mb-1 text-gray-600">Job Functions</h3>
                      <p className="text-gray-500 text-xs">Access restricted</p>
                    </div>
                  </div>
                }
              >
                <Link 
                  to="/organization-management/jobfunctions"
                  className="group bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                    <Wrench className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="text-sm font-semibold mb-1">Job Functions</h3>
                    <p className="text-green-100 text-xs">Manage job functions</p>
                </div>
              </Link>
              </PermissionGuard>

              {/* Departments */}
              <PermissionGuard 
                moduleCode="DEPARTMENTS" 
                permissionCode="R"
                fallback={
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 opacity-60">
                    <div className="flex flex-col items-center text-center">
                      <Building2 className="w-8 h-8 mb-3 text-gray-400" />
                      <h3 className="text-sm font-semibold mb-1 text-gray-600">Departments</h3>
                      <p className="text-gray-500 text-xs">Access restricted</p>
                    </div>
                  </div>
                }
              >
                <Link 
                  to="/organization-management/departments"
                  className="group bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-4 hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center">
                    <Building2 className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="text-sm font-semibold mb-1">Departments</h3>
                    <p className="text-yellow-100 text-xs">Manage departments</p>
                  </div>
                </Link>
              </PermissionGuard>

              {/* Companies */}
              <PermissionGuard 
                moduleCode="COMPANIES" 
                permissionCode="R"
                fallback={
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 opacity-60">
                    <div className="flex flex-col items-center text-center">
                      <Building className="w-8 h-8 mb-3 text-gray-400" />
                      <h3 className="text-sm font-semibold mb-1 text-gray-600">Companies</h3>
                      <p className="text-gray-500 text-xs">Access restricted</p>
                    </div>
                  </div>
                }
              >
                <Link 
                  to="/organization-management/companies"
                  className="group bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg p-4 hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center">
                    <Building className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="text-sm font-semibold mb-1">Companies</h3>
                    <p className="text-indigo-100 text-xs">Manage companies</p>
                  </div>
                </Link>
              </PermissionGuard>
                </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-800 mb-4 sm:mb-6 lg:mb-8">
              Competency Management
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 mb-8">
              {/* Competencies */}
              <PermissionGuard 
                moduleCode="COMPETENCIES" 
                permissionCode="R"
                fallback={
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 opacity-60">
                    <div className="flex flex-col items-center text-center">
                      <Target className="w-8 h-8 mb-3 text-gray-400" />
                      <h3 className="text-sm font-semibold mb-1 text-gray-600">Competencies</h3>
                      <p className="text-gray-500 text-xs">Access restricted</p>
                    </div>
                  </div>
                }
              >
                <Link 
                  to="/competency-management/competencies"
                  className="group bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg p-4 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center">
                    <Target className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="text-sm font-semibold mb-1">Competencies</h3>
                    <p className="text-emerald-100 text-xs">Manage competencies</p>
                  </div>
                </Link>
              </PermissionGuard>

              {/* Categories */}
              <PermissionGuard 
                moduleCode="COMP_CATEGORIES" 
                permissionCode="R"
                fallback={
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 opacity-60">
                    <div className="flex flex-col items-center text-center">
                      <FolderOpen className="w-8 h-8 mb-3 text-gray-400" />
                      <h3 className="text-sm font-semibold mb-1 text-gray-600">Categories</h3>
                      <p className="text-gray-500 text-xs">Access restricted</p>
                    </div>
                  </div>
                }
              >
              <Link 
                  to="/competency-management/categories"
                  className="group bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg p-4 hover:from-teal-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center">
                    <FolderOpen className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="text-sm font-semibold mb-1">Categories</h3>
                    <p className="text-teal-100 text-xs">Manage categories</p>
                  </div>
                </Link>
              </PermissionGuard>

              {/* Domains */}
              <PermissionGuard 
                moduleCode="COMP_DOMAINS" 
                permissionCode="R"
                fallback={
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 opacity-60">
                    <div className="flex flex-col items-center text-center">
                      <Globe className="w-8 h-8 mb-3 text-gray-400" />
                      <h3 className="text-sm font-semibold mb-1 text-gray-600">Domains</h3>
                      <p className="text-gray-500 text-xs">Access restricted</p>
                    </div>
                  </div>
                }
              >
                <Link 
                  to="/competency-management/domains"
                  className="group bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg p-4 hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                    <Globe className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="text-sm font-semibold mb-1">Domains</h3>
                    <p className="text-cyan-100 text-xs">Manage domains</p>
                </div>
              </Link>
              </PermissionGuard>

              {/* Competency Sets */}
              <PermissionGuard 
                moduleCode="COMP_SETS" 
                permissionCode="R"
                fallback={
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 opacity-60">
                <div className="flex flex-col items-center text-center">
                      <Package className="w-8 h-8 mb-3 text-gray-400" />
                      <h3 className="text-sm font-semibold mb-1 text-gray-600">Sets</h3>
                      <p className="text-gray-500 text-xs">Access restricted</p>
                </div>
              </div>
                }
              >
                <Link 
                  to="/competency-management/sets"
                  className="group bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg p-4 hover:from-pink-600 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center">
                    <Package className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="text-sm font-semibold mb-1">Sets</h3>
                    <p className="text-pink-100 text-xs">Manage competency sets</p>
                  </div>
                </Link>
              </PermissionGuard>

              {/* Assign */}
              <PermissionGuard 
                moduleCode="COMP_ASSIGN" 
                permissionCode="R"
                fallback={
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 opacity-60">
                    <div className="flex flex-col items-center text-center">
                      <UserCheck className="w-8 h-8 mb-3 text-gray-400" />
                      <h3 className="text-sm font-semibold mb-1 text-gray-600">Assign</h3>
                      <p className="text-gray-500 text-xs">Access restricted</p>
                    </div>
                  </div>
                }
              >
              <Link 
                  to="/competency-management/assign"
                  className="group bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg p-4 hover:from-rose-600 hover:to-rose-700 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center">
                    <UserCheck className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="text-sm font-semibold mb-1">Assign</h3>
                    <p className="text-rose-100 text-xs">Assign competencies</p>
                  </div>
                </Link>
              </PermissionGuard>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-800 mb-4 sm:mb-6 lg:mb-8">
              Employee Development
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-8">
              {/* Employee Development Link */}
              <PermissionGuard 
                moduleCode="EMP_PROFILE" 
                permissionCode="R"
                fallback={
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 opacity-60">
                    <div className="flex flex-col items-center text-center">
                      <TrendingUp className="w-8 h-8 mb-3 text-gray-400" />
                      <h3 className="text-sm font-semibold mb-1 text-gray-600">Employee Development</h3>
                      <p className="text-gray-500 text-xs">Access restricted</p>
                    </div>
                  </div>
                }
              >
                <Link 
                  to="/employee-development"
                  className="group bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg p-4 hover:from-violet-600 hover:to-violet-700 transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                    <TrendingUp className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="text-sm font-semibold mb-1">Employee Development</h3>
                    <p className="text-violet-100 text-xs">Track career progression</p>
                </div>
              </Link>
              </PermissionGuard>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-800 mb-4 sm:mb-6 lg:mb-8">
              User Management
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-8">
              {/* Users */}
              <PermissionGuard 
                moduleCode="USERS" 
                permissionCode="R"
                fallback={
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 opacity-60">
                    <div className="flex flex-col items-center text-center">
                      <Users className="w-8 h-8 mb-3 text-gray-400" />
                      <h3 className="text-sm font-semibold mb-1 text-gray-600">Users</h3>
                      <p className="text-gray-500 text-xs">Access restricted</p>
                    </div>
                  </div>
                }
              >
                <Link 
                  to="/user-management"
                  className="group bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center">
                    <Users className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="text-sm font-semibold mb-1">Users</h3>
                    <p className="text-blue-100 text-xs">Manage user accounts</p>
                  </div>
                </Link>
              </PermissionGuard>

              {/* Roles */}
              <PermissionGuard 
                moduleCode="ROLES" 
                permissionCode="R"
                fallback={
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 opacity-60">
                    <div className="flex flex-col items-center text-center">
                      <Shield className="w-8 h-8 mb-3 text-gray-400" />
                      <h3 className="text-sm font-semibold mb-1 text-gray-600">Roles</h3>
                      <p className="text-gray-500 text-xs">Access restricted</p>
                    </div>
                  </div>
                }
              >
                <Link 
                  to="/user-management/roles"
                  className="group bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4 hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center">
                    <Shield className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="text-sm font-semibold mb-1">Roles</h3>
                    <p className="text-purple-100 text-xs">Manage user roles</p>
                  </div>
                </Link>
              </PermissionGuard>

              {/* Permissions */}
              <PermissionGuard 
                moduleCode="PERMISSIONS" 
                permissionCode="R"
                fallback={
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 opacity-60">
                    <div className="flex flex-col items-center text-center">
                      <Settings className="w-8 h-8 mb-3 text-gray-400" />
                      <h3 className="text-sm font-semibold mb-1 text-gray-600">Permissions</h3>
                      <p className="text-gray-500 text-xs">Access restricted</p>
                    </div>
                  </div>
                }
              >
                <Link 
                  to="/user-management/permissions"
                  className="group bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center">
                    <Settings className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="text-sm font-semibold mb-1">Permissions</h3>
                    <p className="text-green-100 text-xs">Manage permissions</p>
                  </div>
                </Link>
              </PermissionGuard>

              {/* Audit Log */}
              <PermissionGuard 
                moduleCode="AUDIT" 
                permissionCode="R"
                fallback={
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 opacity-60">
                    <div className="flex flex-col items-center text-center">
                      <Activity className="w-8 h-8 mb-3 text-gray-400" />
                      <h3 className="text-sm font-semibold mb-1 text-gray-600">Audit Log</h3>
                      <p className="text-gray-500 text-xs">Access restricted</p>
                    </div>
                  </div>
                }
              >
                <Link 
                  to="/user-management/audit"
                  className="group bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-4 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center">
                    <Activity className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="text-sm font-semibold mb-1">Audit Log</h3>
                    <p className="text-orange-100 text-xs">View audit logs</p>
                  </div>
                </Link>
              </PermissionGuard>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-800 mb-4 sm:mb-6 lg:mb-8">
              System Functions
            </h2>
         
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {/* Reports */}
              <PermissionGuard 
                moduleCode="REPORTS" 
                permissionCode="R"
                fallback={
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 opacity-60">
                    <div className="flex flex-col items-center text-center">
                      <BarChart3 className="w-8 h-8 mb-3 text-gray-400" />
                      <h3 className="text-sm font-semibold mb-1 text-gray-600">Reports</h3>
                      <p className="text-gray-500 text-xs">Access restricted</p>
                    </div>
                  </div>
                }
              >
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg p-4 hover:from-teal-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 cursor-pointer">
                  <div className="flex flex-col items-center text-center">
                    <BarChart3 className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="text-sm font-semibold mb-1">Reports</h3>
                    <p className="text-teal-100 text-xs">Generate reports (Coming Soon)</p>
                  </div>
                </div>
              </PermissionGuard>

              {/* Import Data */}
              <PermissionGuard 
                moduleCode="IMPORT_DATA" 
                permissionCode="R"
                fallback={
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 opacity-60">
                    <div className="flex flex-col items-center text-center">
                      <Upload className="w-8 h-8 mb-3 text-gray-400" />
                      <h3 className="text-sm font-semibold mb-1 text-gray-600">Import Data</h3>
                      <p className="text-gray-500 text-xs">Access restricted</p>
                    </div>
                  </div>
                }
              >
                <Link 
                  to="/import-data"
                  className="group bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg p-4 hover:from-amber-600 hover:to-amber-700 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center">
                    <Upload className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="text-sm font-semibold mb-1">Import Data</h3>
                    <p className="text-amber-100 text-xs">Import employee data</p>
                  </div>
                </Link>
              </PermissionGuard>

              {/* Assessments */}
              <PermissionGuard 
                moduleCode="ASSESSMENTS" 
                permissionCode="R"
                fallback={
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 opacity-60">
                    <div className="flex flex-col items-center text-center">
                      <FileSpreadsheet className="w-8 h-8 mb-3 text-gray-400" />
                      <h3 className="text-sm font-semibold mb-1 text-gray-600">Assessments</h3>
                      <p className="text-gray-500 text-xs">Access restricted</p>
                    </div>
                  </div>
                }
              >
                <div className="bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-lg p-4 hover:from-slate-600 hover:to-slate-700 transition-all duration-200 transform hover:scale-105 cursor-pointer">
                  <div className="flex flex-col items-center text-center">
                    <FileSpreadsheet className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="text-sm font-semibold mb-1">Assessments</h3>
                    <p className="text-slate-100 text-xs">Manage assessments (Coming Soon)</p>
                  </div>
                </div>
              </PermissionGuard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 