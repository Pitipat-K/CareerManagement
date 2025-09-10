import { Link } from 'react-router-dom';
import { Building2, Users, Briefcase, MapPin, Upload } from 'lucide-react';
import { getUserEmail, getOktaUser, getCurrentEmployee, debugAuthData } from '../utils/auth';
import Header from '../components/Header';

const Home = () => {
  // Check if a user is logged in
  const currentEmployee = localStorage.getItem('currentEmployee');
  const isLoggedIn = !!currentEmployee;
  
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
          
          {/* Debug User Info Section - Only show in development */}
          {process.env.NODE_ENV === 'development' && isLoggedIn && (
            <div className="mt-6 bg-white rounded-lg shadow-md p-4 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Debug Info</h3>
              <div className="space-y-1 text-sm text-gray-600">
                {userEmail && (
                  <div className="mb-2 p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                    <p><strong>User Email:</strong> {userEmail}</p>
                  </div>
                )}
                {oktaUserData && (
                  <div>
                    <p><strong>Okta Name:</strong> {oktaUserData.name || 'Not available'}</p>
                    <p><strong>Okta ID:</strong> {oktaUserData.sub || 'Not available'}</p>
                  </div>
                )}
                {employeeData && (
                  <div>
                    <p><strong>Employee ID:</strong> {employeeData.employeeID}</p>
                    <p><strong>Employee:</strong> {employeeData.firstName} {employeeData.lastName}</p>
                    <p><strong>Position:</strong> {employeeData.positionTitle}</p>
                    <p><strong>Department:</strong> {employeeData.departmentName}</p>
                    <p><strong>Employee Email:</strong> {employeeData.email || 'Not set'}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 lg:p-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-800 mb-4 sm:mb-6 lg:mb-8">
              Main menu
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
              <Link 
                to="/organization-management"
                className="group bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 sm:p-6 lg:p-8 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                  <Building2 className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mb-3 sm:mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-200" />
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-2">Organization Management</h3>
                  <p className="text-blue-100 text-xs sm:text-sm lg:text-base">
                    Manage employees, positions, departments, and companies
                  </p>
                </div>
              </Link>

              {isLoggedIn ? (
                <Link 
                  to="/employee-development"
                  className="group bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4 sm:p-6 lg:p-8 hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center">
                    <Users className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mb-3 sm:mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-2">Employee Development</h3>
                    <p className="text-purple-100 text-xs sm:text-sm lg:text-base">
                      Track career progression and development plans
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 sm:p-6 lg:p-8 opacity-60">
                  <div className="flex flex-col items-center text-center">
                    <Users className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mb-3 sm:mb-4 lg:mb-6 text-gray-400" />
                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-2 text-gray-600">Employee Development</h3>
                    <p className="text-gray-500 text-xs sm:text-sm lg:text-base">
                      Access through employee login portal
                    </p>
                  </div>
                </div>
              )}

              <Link 
                to="/competency-management"
                className="group bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 sm:p-6 lg:p-8 hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                  <Briefcase className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mb-3 sm:mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-200" />
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-2">Competency Management</h3>
                  <p className="text-green-100 text-xs sm:text-sm lg:text-base">
                    Manage employee competencies
                  </p>
                </div>
              </Link>

              <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 sm:p-6 lg:p-8 opacity-60">
                <div className="flex flex-col items-center text-center">
                  <MapPin className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mb-3 sm:mb-4 lg:mb-6 text-gray-400" />
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-2 text-gray-600">Analytics & Reporting</h3>
                  <p className="text-gray-500 text-xs sm:text-sm lg:text-base">
                    Generate insights and reports
                  </p>
                </div>
              </div>

              <Link 
                to="/import-data"
                className="group bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-4 sm:p-6 lg:p-8 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                  <Upload className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mb-3 sm:mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-200" />
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-2">Import Data</h3>
                  <p className="text-orange-100 text-xs sm:text-sm lg:text-base">
                    Import employee data from Excel files
                  </p>
                </div>
              </Link>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 lg:mt-12 bg-white rounded-lg shadow-lg p-6 sm:p-8 lg:p-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-800 mb-4 sm:mb-6 lg:mb-8">
              System Overview
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
              <div>
                <h3 className="text-lg lg:text-xl font-semibold text-gray-700 mb-3 lg:mb-4">Features</h3>
                <ul className="space-y-2 lg:space-y-3 text-gray-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></span>
                    <span className="text-sm sm:text-base lg:text-lg">Employee Information Management</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></span>
                    <span className="text-sm sm:text-base lg:text-lg">Position and Department Management</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></span>
                    <span className="text-sm sm:text-base lg:text-lg">Company Structure Management</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></span>
                    <span className="text-sm sm:text-base lg:text-lg">Real-time Data Updates</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg lg:text-xl font-semibold text-gray-700 mb-3 lg:mb-4">Benefits</h3>
                <ul className="space-y-2 lg:space-y-3 text-gray-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></span>
                    <span className="text-sm sm:text-base lg:text-lg">Centralized Data Management</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></span>
                    <span className="text-sm sm:text-base lg:text-lg">Improved Organizational Visibility</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></span>
                    <span className="text-sm sm:text-base lg:text-lg">Streamlined HR Processes</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></span>
                    <span className="text-sm sm:text-base lg:text-lg">Better Decision Making</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 