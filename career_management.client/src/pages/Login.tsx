import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Building2, ArrowRight } from 'lucide-react';

const Login = () => {
  const [employeeCode, setEmployeeCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login form submitted');
    if (!employeeCode.trim()) {
      setError('Please enter your Employee Code');
      console.log('No employee code entered');
      return;
    }

    setLoading(true);
    setError('');
    console.log('Attempting to fetch /api/Employees ...');

    try {
      // Search for employee by employee code
      const response = await fetch(`https://localhost:7026/api/Employees`);
      console.log('API response:', response);
      if (response.ok) {
        const employees = await response.json();
        console.log('Employees received:', employees);
        const employee = employees.find(
          (emp: any) =>
            emp.employeeCode &&
            emp.employeeCode.trim().toLowerCase() === employeeCode.trim().toLowerCase()
        );
        console.log('Employee found:', employee);
        
        if (employee) {
          // Store employee info in localStorage for session management
          localStorage.setItem('currentEmployee', JSON.stringify(employee));
          console.log('Navigating to /home');
          navigate('/home');
        } else {
          setError('Employee Code not found. Please check your code and try again.');
          console.log('Employee code not found in list');
        }
      } else {
        const text = await response.text();
        setError('Failed to connect to server. Please try again.');
        console.log('API error:', text);
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
      console.log('Login process finished');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Career Management System
          </h1>
          <p className="text-gray-600">
            Alliance Laundry Thailand
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Employee Login
            </h2>
            <p className="text-gray-600">
              Enter your Employee Code to access your development portal
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="employeeCode" className="block text-sm font-medium text-gray-700 mb-2">
                Employee Code
              </label>
              <input
                type="text"
                id="employeeCode"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="Enter your employee code"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-lg font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Demo Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Demo Information</h3>
            <p className="text-sm text-blue-800">
              For testing purposes, you can use any employee code that exists in the system. 
              The system will automatically redirect you to the Employee Development portal.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2024 Alliance Laundry Thailand. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 