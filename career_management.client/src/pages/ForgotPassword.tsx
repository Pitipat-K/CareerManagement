import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Mail, Key, ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { getApiUrl } from '../config/api';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1 = verify identity, 2 = verify code, 3 = reset password
  const [employeeCode, setEmployeeCode] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifiedEmployee, setVerifiedEmployee] = useState<any>(null);
  const [expiryMinutes, setExpiryMinutes] = useState(15);
  const [devCode, setDevCode] = useState('');
  const navigate = useNavigate();

  // Password strength validation
  const getPasswordStrength = (pass: string) => {
    if (pass.length < 8) return { strength: 'weak', message: 'Password must be at least 8 characters' };
    if (pass.length < 12) return { strength: 'medium', message: 'Good password' };
    
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumbers = /\d/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    
    const criteriaCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (criteriaCount >= 3) return { strength: 'strong', message: 'Strong password' };
    if (criteriaCount >= 2) return { strength: 'medium', message: 'Good password' };
    return { strength: 'weak', message: 'Add uppercase, numbers, or special characters' };
  };

  const passwordStrength = newPassword ? getPasswordStrength(newPassword) : null;

  const handleVerifyIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeCode.trim() || !email.trim()) {
      setError('Please enter both employee code and email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(getApiUrl('Authentication/forgot-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          employeeCode: employeeCode.trim(), 
          email: email.trim() 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Verification code sent, move to step 2
        setExpiryMinutes(data.expiryMinutes || 15);
        setDevCode(data.devCode || ''); // For development testing
        setStep(2);
        setError('');
      } else {
        setError(data.message || 'Unable to verify your identity. Please check your employee code and email.');
      }
    } catch (error) {
      console.error('Error verifying identity:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(getApiUrl('Authentication/verify-code'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(),
          verificationCode: verificationCode.trim()
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Code verified, move to step 3
        setVerifiedEmployee(data);
        setStep(3);
        setError('');
      } else {
        setError(data.message || 'Invalid or expired verification code');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!verifiedEmployee) {
      setError('Session expired. Please start over.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(getApiUrl('Authentication/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          employeeID: verifiedEmployee.employeeID,
          employeeCode: verifiedEmployee.employeeCode,
          email: verifiedEmployee.email,
          newPassword: newPassword
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Password reset successful
        alert('Password reset successfully! You can now login with your new password.');
        navigate('/login');
      } else {
        setError(data.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    } else if (step === 2) {
      setStep(1);
      setVerificationCode('');
      setError('');
    } else {
      navigate('/login');
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(getApiUrl('Authentication/forgot-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          employeeCode: employeeCode.trim(), 
          email: email.trim() 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDevCode(data.devCode || '');
        alert('A new verification code has been sent to your email.');
      } else {
        setError(data.message || 'Failed to resend code');
      }
    } catch (error) {
      console.error('Error resending code:', error);
      setError('Failed to resend code');
    } finally {
      setLoading(false);
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

        {/* Forgot Password Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-1 text-xs font-medium hidden sm:inline">Identity</span>
            </div>
            <div className={`mx-2 w-8 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-1 text-xs font-medium hidden sm:inline">Verify</span>
            </div>
            <div className={`mx-2 w-8 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-1 text-xs font-medium hidden sm:inline">Reset</span>
            </div>
          </div>

          {/* Step 1: Verify Identity */}
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Forgot Password?
                </h2>
                <p className="text-gray-600 text-sm">
                  Enter your employee code and email to verify your identity
                </p>
              </div>

              <form onSubmit={handleVerifyIdentity} className="space-y-6">
                <div>
                  <label htmlFor="employeeCode" className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Employee Code
                  </label>
                  <input
                    type="text"
                    id="employeeCode"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder="Enter your employee code"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                    autoFocus
                  />
                </div>

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
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Code
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 2: Verify Code */}
          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Check Your Email
                </h2>
                <p className="text-gray-600 text-sm">
                  We've sent a 6-digit verification code to<br/>
                  <strong>{email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div>
                  <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                    <Key className="w-4 h-4 inline mr-1" />
                    Verification Code
                  </label>
                  <input
                    type="text"
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest font-mono"
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-2">
                  <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p><strong>Code expires in {expiryMinutes} minutes</strong></p>
                    <p className="mt-1">Didn't receive the code? <button type="button" onClick={handleResendCode} className="text-blue-600 hover:underline font-medium" disabled={loading}>Resend code</button></p>
                  </div>
                </div>

                {devCode && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Development Mode:</strong> {devCode}
                    </p>
                  </div>
                )}

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
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading || verificationCode.length !== 6}
                    className="flex-1 flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify Code
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && verifiedEmployee && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Create New Password
                </h2>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>{verifiedEmployee.firstName} {verifiedEmployee.lastName}</strong>
                  </p>
                  <p className="text-xs text-blue-700">
                    {verifiedEmployee.email}
                  </p>
                </div>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    <Key className="w-4 h-4 inline mr-1" />
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 8 characters)"
                      className="block w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && passwordStrength && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              passwordStrength.strength === 'weak'
                                ? 'bg-red-500 w-1/3'
                                : passwordStrength.strength === 'medium'
                                ? 'bg-yellow-500 w-2/3'
                                : 'bg-green-500 w-full'
                            }`}
                          />
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            passwordStrength.strength === 'weak'
                              ? 'text-red-600'
                              : passwordStrength.strength === 'medium'
                              ? 'text-yellow-600'
                              : 'text-green-600'
                          }`}
                        >
                          {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{passwordStrength.message}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="block w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Match Indicator */}
                  {newPassword && confirmPassword && (
                    <div className="mt-1">
                      {newPassword === confirmPassword ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="text-xs">Passwords match</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-red-600">
                          <AlertCircle className="w-3 h-3" />
                          <span className="text-xs">Passwords do not match</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li className={newPassword.length >= 8 ? 'text-green-600' : ''}>
                      • At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>
                      • Uppercase letter (recommended)
                    </li>
                    <li className={/[a-z]/.test(newPassword) ? 'text-green-600' : ''}>
                      • Lowercase letter (recommended)
                    </li>
                    <li className={/\d/.test(newPassword) ? 'text-green-600' : ''}>
                      • Number (recommended)
                    </li>
                    <li className={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-green-600' : ''}>
                      • Special character (recommended)
                    </li>
                  </ul>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading}
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                    className="flex-1 flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Resetting...
                      </>
                    ) : (
                      <>
                        Reset Password
                        <CheckCircle2 className="w-5 h-5 ml-2" />
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

export default ForgotPassword;

