import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { User, Building2, ArrowRight, Shield, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useOktaAuth } from '@okta/okta-react';
import { getApiUrl } from '../config/api';

const Login = () => {
  // Step 1: Employee Code
  const [employeeCode, setEmployeeCode] = useState('');
  
  // Step 2: Email and Password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeInfo, setEmployeeInfo] = useState<any>(null);
  
  // UI State
  const [currentStep, setCurrentStep] = useState(1); // 1 = Employee Code, 2 = Email/Password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { oktaAuth, authState } = useOktaAuth();

  // Check for error parameters from callback
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'employee_not_found') {
      setError('Your account was not found in our employee system. Please contact HR.');
    } else if (errorParam === 'no_user_account') {
      setError('You authenticated successfully, but you do not have a user account in this system. Please contact your administrator to create a user account for you.');
    } else if (errorParam === 'auth_failed') {
      setError('Authentication failed. Please try again.');
    } else if (errorParam === 'no_email_found') {
      setError('No email found in your user profile. Please contact IT support.');
    } else if (errorParam === 'no_user_info') {
      setError('Failed to retrieve user information. Please try again.');
    } else if (errorParam === 'token_exchange_failed') {
      setError('Token exchange failed. Please try again.');
    } else if (errorParam === 'redirect_failed') {
      setError('Failed to complete authentication redirect. Please try again.');
    } else if (errorParam === 'process_failed') {
      setError('Authentication process failed. Please try again.');
    } else if (errorParam === 'timeout') {
      setError('Authentication timeout. Please try again.');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (authState?.isAuthenticated) {
      navigate('/home');
    }
  }, [authState, navigate]);

  const handleOktaLogin = async () => {
    setLoading(true);
    try {
      await oktaAuth.signInWithRedirect();
    } catch (error) {
      console.error('Okta login error:', error);
      setError('Failed to initiate login. Please try again.');
      setLoading(false);
    }
  };

  // Step 1: Verify employee code
  const handleEmployeeCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeCode.trim()) {
      setError('Please enter your Employee Code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(getApiUrl('Authentication/verify-employee-code'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeCode: employeeCode.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Employee code verified, move to step 2
        setEmployeeInfo(data);
        setEmail(data.email || ''); // Pre-fill email if available
        setCurrentStep(2);
        setError('');
      } else {
        setError(data.message || 'Employee code not found');
      }
    } catch (error) {
      console.error('Error verifying employee code:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Login with email and password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(getApiUrl('Authentication/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Login successful
        const userData = data.user;
        const token = data.token;
        
        // Store JWT token
        if (token) {
          localStorage.setItem('jwtToken', token);
        }
        
        // Store user info in localStorage
        localStorage.setItem('currentEmployee', JSON.stringify(userData));
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('isAuthenticated', 'true');
        
        console.log('Login successful, navigating to home');
        navigate('/home');
      } else {
        setError(data.message || 'Invalid email or password');
        
        // If account is locked, show lockout message
        if (data.isLocked) {
          setPassword(''); // Clear password field
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Go back to step 1
  const handleBack = () => {
    setCurrentStep(1);
    setEmail('');
    setPassword('');
    setError('');
    setEmployeeInfo(null);
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
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Employee Code</span>
            </div>
            <div className={`mx-4 w-12 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Sign In</span>
            </div>
          </div>

          {/* Step 1: Employee Code */}
          {currentStep === 1 && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Employee Login
                </h2>
                <p className="text-gray-600">
                  Enter your Employee Code to continue
                </p>
              </div>

              <form onSubmit={handleEmployeeCodeSubmit} className="space-y-6">
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
                      Verifying...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>

                {/* Okta SSO Button */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOktaLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-lg font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
                  Sign in with SSO
                </button>
              </form>
            </>
          )}

          {/* Step 2: Email and Password */}
          {currentStep === 2 && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Welcome Back
                </h2>
                {employeeInfo && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>{employeeInfo.firstName} {employeeInfo.lastName}</strong>
                    </p>
                    <p className="text-xs text-blue-700">
                      {employeeInfo.positionTitle}
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      <Lock className="w-4 h-4 inline mr-1" />
                      Password
                    </label>
                    <Link 
                      to="/forgot-password" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading}
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 text-lg font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center px-4 py-3 border border-transparent text-lg font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                </div>
              </form>
            </>
          )}
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