import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Security, LoginCallback } from '@okta/okta-react';
import { PermissionProvider } from './contexts/PermissionContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import OrganizationManagement from './pages/OrganizationManagement';
import CompetencyManagement from './pages/CompetencyManagement';
import EmployeeDevelopment from './pages/EmployeeDevelopment';
import ImportData from './pages/ImportData';
import UserManagement from './pages/UserManagement';
import TestNotification from './components/TestNotification';
import ProtectedRoute from './components/ProtectedRoute';
import oktaAuth from './config/okta';
import './App.css';

function App() {
  const restoreOriginalUri = async (_oktaAuth: any, originalUri: string) => {
    // After successful authentication, check for employee and redirect appropriately
    console.log('RestoreOriginalUri called with:', originalUri);
    
    // Get user info and find employee
    try {
      const user = await oktaAuth.getUser();
      console.log('User after authentication:', user);
      
      if (user && user.email) {
        // Store user info
        localStorage.setItem('oktaUser', JSON.stringify(user));
        localStorage.setItem('userEmail', user.email);
        
        // Find employee by email
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/Employees`);
        if (response.ok) {
          const employees = await response.json();
          const employee = employees.find((emp: any) => {
            const empEmail = emp.email?.toLowerCase()?.trim();
            const searchEmail = user.email?.toLowerCase()?.trim();
            return empEmail && searchEmail && empEmail === searchEmail;
          });
          
          if (employee) {
            localStorage.setItem('currentEmployee', JSON.stringify(employee));
            localStorage.setItem('isAuthenticated', 'true');
            window.location.replace('/home');
          } else {
            window.location.replace('/login?error=employee_not_found');
          }
        } else {
          window.location.replace('/login?error=employee_lookup_failed');
        }
      } else {
        window.location.replace('/login?error=no_user_info');
      }
    } catch (error) {
      console.error('Error in restoreOriginalUri:', error);
      window.location.replace('/login?error=restore_failed');
    }
  };

  return (
    <Security oktaAuth={oktaAuth} restoreOriginalUri={restoreOriginalUri}>
      <PermissionProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/login/callback" element={<LoginCallback />} />
            <Route path="/home" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/organization-management/*" element={
              <ProtectedRoute>
                <OrganizationManagement />
              </ProtectedRoute>
            } />
            <Route path="/competency-management/*" element={
              <ProtectedRoute>
                <CompetencyManagement />
              </ProtectedRoute>
            } />
            <Route path="/employee-development/*" element={
              <ProtectedRoute>
                <EmployeeDevelopment />
              </ProtectedRoute>
            } />
            <Route path="/import-data" element={
              <ProtectedRoute>
                <ImportData />
              </ProtectedRoute>
            } />
            <Route path="/user-management/*" element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="/test-notification" element={
              <ProtectedRoute>
                <TestNotification />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
      </PermissionProvider>
    </Security>
  );
}

export default App;