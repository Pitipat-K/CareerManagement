import { useState } from 'react';
import { Key, Eye, EyeOff, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
  employeeID: number;
  employeeName: string;
  mode: 'create' | 'reset';
}

const PasswordModal = ({ isOpen, onClose, onSubmit, employeeID, employeeName, mode }: PasswordModalProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const passwordStrength = password ? getPasswordStrength(password) : null;

  const validatePassword = () => {
    if (!password || !confirmPassword) {
      setError('Please fill in all password fields');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError('');

    if (!validatePassword()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(password);
      setPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setConfirmPassword('');
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Key className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {mode === 'create' ? 'Set Password' : 'Reset Password'}
              </h3>
              <p className="text-sm text-gray-500">{employeeName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Employee Info */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Employee ID:</strong> {employeeID}
          </p>
          {mode === 'reset' && (
            <p className="text-sm text-blue-700 mt-1">
              This will reset the user's password. They will need to use the new password to log in.
            </p>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {mode === 'create' ? 'Password' : 'New Password'} *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 8 characters)"
                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password && passwordStrength && (
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

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Match Indicator */}
            {password && confirmPassword && (
              <div className="mt-1">
                {password === confirmPassword ? (
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
              <li className={password.length >= 8 ? 'text-green-600' : ''}>
                • At least 8 characters
              </li>
              <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                • Uppercase letter (recommended)
              </li>
              <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                • Lowercase letter (recommended)
              </li>
              <li className={/\d/.test(password) ? 'text-green-600' : ''}>
                • Number (recommended)
              </li>
              <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600' : ''}>
                • Special character (recommended)
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !password || !confirmPassword || password !== confirmPassword}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{mode === 'create' ? 'Set Password' : 'Reset Password'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;

