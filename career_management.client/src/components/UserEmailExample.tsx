import { getUserEmail, getOktaUser, getCurrentEmployee } from '../utils/auth';

/**
 * Example component showing how to access user email and other auth data
 * This is for demonstration purposes - you can use these functions anywhere in your app
 */
const UserEmailExample = () => {
  const userEmail = getUserEmail();
  const oktaUser = getOktaUser();
  const currentEmployee = getCurrentEmployee();

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">User Email Access Example</h3>
      
      <div className="space-y-3 text-sm">
        <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
          <p className="font-semibold text-blue-800">User Email:</p>
          <p className="text-blue-700">{userEmail || 'Not available'}</p>
        </div>
        
        {oktaUser && (
          <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
            <p className="font-semibold text-green-800">Okta User Info:</p>
            <p className="text-green-700">Name: {oktaUser.name || 'N/A'}</p>
            <p className="text-green-700">Email: {oktaUser.email || 'N/A'}</p>
            <p className="text-green-700">ID: {oktaUser.sub || 'N/A'}</p>
          </div>
        )}
        
        {currentEmployee && (
          <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-500">
            <p className="font-semibold text-purple-800">Employee Info:</p>
            <p className="text-purple-700">Name: {currentEmployee.firstName} {currentEmployee.lastName}</p>
            <p className="text-purple-700">Position: {currentEmployee.positionTitle}</p>
            <p className="text-purple-700">Email: {currentEmployee.email || 'N/A'}</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <p className="text-xs text-gray-600">
          <strong>Usage:</strong> Import and use <code>getUserEmail()</code> from <code>../utils/auth</code> 
          to access the user email anywhere in your application.
        </p>
      </div>
    </div>
  );
};

export default UserEmailExample;
