import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Users, Briefcase, Building2, Building, Menu, X, ChevronLeft, ChevronRight, Wrench } from 'lucide-react';
import Employees from '../components/Employees';
import Positions from '../components/Positions';
import Departments from '../components/Departments';
import Companies from '../components/Companies';
import JobFunctions from '../components/JobFunctions';

const OrganizationManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const menuItems = [
    { path: 'employees', label: 'Employees', icon: Users },
    { path: 'positions', label: 'Positions', icon: Briefcase },
    { path: 'jobfunctions', label: 'Job Functions', icon: Wrench },
    { path: 'departments', label: 'Departments', icon: Building2 },
    { path: 'companies', label: 'Companies', icon: Building },
  ];

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
              Organization Management
            </h1>
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
              <Route path="employees" element={<Employees />} />
              <Route path="positions" element={<Positions />} />
              <Route path="jobfunctions" element={<JobFunctions />} />
              <Route path="departments" element={<Departments />} />
              <Route path="companies" element={<Companies />} />
              <Route path="" element={<Employees />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrganizationManagement; 