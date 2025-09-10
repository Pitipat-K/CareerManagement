import { useNavigate } from 'react-router-dom';
import { useOktaAuth } from '@okta/okta-react';
import { LogOut, User, Building2 } from 'lucide-react';
import { getUserEmail, getCurrentEmployee, clearAuthData } from '../utils/auth';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showUserInfo?: boolean;
}

const Header = ({ 
  title = "Career Management System", 
  subtitle = "Alliance Laundry Thailand",
  showUserInfo = false 
}: HeaderProps) => {
  const navigate = useNavigate();
  const { oktaAuth } = useOktaAuth();
  const userEmail = getUserEmail();
  const employeeData = getCurrentEmployee();

  const handleLogout = async () => {
    try {
      // Clear local storage
      clearAuthData();
      
      // Sign out from Okta
      await oktaAuth.signOut();
      
      // Navigate to login page
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if Okta signout fails, clear local data and redirect
      clearAuthData();
      navigate('/login');
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left side - Logo and title */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right side - User info and logout */}
          <div className="flex items-center space-x-4">
            {showUserInfo && (userEmail || employeeData) && (
              <div className="hidden md:flex items-center space-x-3 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <div>
                  {employeeData && (
                    <div className="font-medium text-gray-900">
                      {employeeData.firstName} {employeeData.lastName}
                    </div>
                  )}
                  {userEmail && (
                    <div className="text-gray-500">{userEmail}</div>
                  )}
                  {employeeData?.positionTitle && (
                    <div className="text-gray-500 text-xs">{employeeData.positionTitle}</div>
                  )}
                </div>
              </div>
            )}
            
            {/* Logout button */}
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
      </div>
    </header>
  );
};

export default Header;
