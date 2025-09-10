import React from 'react';
import { 
  getOktaUser, 
  getUserFullName, 
  getUserFirstName, 
  getUserLastName, 
  getUserEmail, 
  getUserProfilePicture, 
  getUserPreferredUsername,
  getProfileClaim,
  debugAuthData 
} from '../utils/auth';

const UserProfileDisplay = () => {
  const oktaUser = getOktaUser();
  const fullName = getUserFullName();
  const firstName = getUserFirstName();
  const lastName = getUserLastName();
  const email = getUserEmail();
  const profilePicture = getUserProfilePicture();
  const preferredUsername = getUserPreferredUsername();

  const handleDebugAuth = () => {
    debugAuthData();
  };

  if (!oktaUser) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">No Okta profile data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Okta Profile Information</h3>
        <button 
          onClick={handleDebugAuth}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Debug Auth Data
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Profile Picture */}
        {profilePicture && (
          <div className="flex items-center space-x-4">
            <img 
              src={profilePicture} 
              alt="Profile" 
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <p className="text-sm text-gray-600">Profile Picture</p>
              <p className="text-xs text-gray-500 break-all">{profilePicture}</p>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <p className="mt-1 text-sm text-gray-900">{fullName || 'Not available'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">{email || 'Not available'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <p className="mt-1 text-sm text-gray-900">{firstName || 'Not available'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <p className="mt-1 text-sm text-gray-900">{lastName || 'Not available'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Preferred Username</label>
            <p className="mt-1 text-sm text-gray-900">{preferredUsername || 'Not available'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject ID</label>
            <p className="mt-1 text-sm text-gray-900">{oktaUser.sub || 'Not available'}</p>
          </div>
        </div>

        {/* Additional Profile Claims */}
        <div className="border-t pt-4">
          <h4 className="text-md font-medium text-gray-800 mb-3">Additional Profile Claims</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Profile URL</label>
              <p className="mt-1 text-sm text-gray-900">
                {getProfileClaim('profile') ? (
                  <a href={getProfileClaim('profile') as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                    {getProfileClaim('profile')}
                  </a>
                ) : 'Not available'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <p className="mt-1 text-sm text-gray-900">
                {getProfileClaim('website') ? (
                  <a href={getProfileClaim('website') as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                    {getProfileClaim('website')}
                  </a>
                ) : 'Not available'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <p className="mt-1 text-sm text-gray-900">{getProfileClaim('gender') || 'Not available'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Birthdate</label>
              <p className="mt-1 text-sm text-gray-900">{getProfileClaim('birthdate') || 'Not available'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Timezone</label>
              <p className="mt-1 text-sm text-gray-900">{getProfileClaim('zoneinfo') || 'Not available'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Locale</label>
              <p className="mt-1 text-sm text-gray-900">{getProfileClaim('locale') || 'Not available'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Updated</label>
              <p className="mt-1 text-sm text-gray-900">
                {getProfileClaim('updated_at') ? 
                  new Date(getProfileClaim('updated_at') as number * 1000).toLocaleString() : 
                  'Not available'
                }
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Verified</label>
              <p className="mt-1 text-sm text-gray-900">
                {getProfileClaim('email_verified') !== null ? 
                  (getProfileClaim('email_verified') ? 'Yes' : 'No') : 
                  'Not available'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Raw Data */}
        <div className="border-t pt-4">
          <h4 className="text-md font-medium text-gray-800 mb-3">Raw Profile Data</h4>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(oktaUser, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default UserProfileDisplay;


