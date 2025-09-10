# Okta Profile Claims Storage in localStorage

This document explains how to store and use Okta profile claims (profile data) in localStorage in your Career Management application.

## Overview

Yes, you can store Okta profile data (profile claims) in localStorage! Your application already does this, and this guide shows you how to enhance and use this functionality.

## Available Profile Claims

When you request the `profile` scope in your Okta configuration, you get access to these standard OpenID Connect profile claims:

### Basic Information
- `sub` - Subject identifier (unique user ID)
- `name` - Full name
- `given_name` - First name
- `family_name` - Last name
- `middle_name` - Middle name
- `nickname` - Preferred nickname
- `preferred_username` - Username

### Contact & Profile
- `email` - Email address
- `email_verified` - Whether email is verified
- `profile` - Profile URL
- `picture` - Profile picture URL
- `website` - Website URL

### Personal Details
- `gender` - Gender
- `birthdate` - Date of birth
- `zoneinfo` - Timezone
- `locale` - Locale/language preference
- `updated_at` - Last updated timestamp

## Current Implementation

Your application already stores profile claims in localStorage through the `LoginCallback.tsx` component:

```typescript
// In LoginCallback.tsx
const userInfo = await oktaAuth.getUser();
localStorage.setItem('oktaUser', JSON.stringify(userInfo));
```

## Enhanced Implementation

### 1. TypeScript Interface

```typescript
// In utils/auth.ts
export interface OktaProfileClaims {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  middle_name?: string;
  nickname?: string;
  preferred_username?: string;
  profile?: string;
  picture?: string;
  website?: string;
  email?: string;
  email_verified?: boolean;
  gender?: string;
  birthdate?: string;
  zoneinfo?: string;
  locale?: string;
  updated_at?: number;
}
```

### 2. Utility Functions

```typescript
// Get specific profile claim
const email = getProfileClaim('email');

// Get user's full name (tries multiple sources)
const fullName = getUserFullName();

// Get profile picture URL
const profilePicture = getUserProfilePicture();

// Get preferred username
const username = getUserPreferredUsername();

// Store profile claims
storeProfileClaims(userInfo);
```

### 3. Usage Examples

#### Basic Usage
```typescript
import { getUserEmail, getUserFullName, getUserProfilePicture } from '../utils/auth';

const MyComponent = () => {
  const email = getUserEmail();
  const fullName = getUserFullName();
  const profilePicture = getUserProfilePicture();

  return (
    <div>
      <h1>Welcome, {fullName}!</h1>
      <p>Email: {email}</p>
      {profilePicture && <img src={profilePicture} alt="Profile" />}
    </div>
  );
};
```

#### Advanced Usage
```typescript
import { getOktaUser, getProfileClaim } from '../utils/auth';

const ProfileComponent = () => {
  const oktaUser = getOktaUser();
  const website = getProfileClaim('website');
  const locale = getProfileClaim('locale');
  const timezone = getProfileClaim('zoneinfo');

  return (
    <div>
      <h2>Profile Information</h2>
      {website && <p>Website: <a href={website}>{website}</a></p>}
      {locale && <p>Language: {locale}</p>}
      {timezone && <p>Timezone: {timezone}</p>}
    </div>
  );
};
```

## Storage Structure

Profile claims are stored in localStorage under the `oktaUser` key:

```json
{
  "sub": "00u1234567890abcdef",
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "email": "john.doe@company.com",
  "email_verified": true,
  "picture": "https://example.com/profile.jpg",
  "preferred_username": "john.doe",
  "locale": "en-US",
  "zoneinfo": "America/New_York",
  "updated_at": 1640995200
}
```

## Security Considerations

### What's Safe to Store
- ✅ Public profile information (name, email, picture)
- ✅ User preferences (locale, timezone)
- ✅ Non-sensitive metadata

### What to Avoid
- ❌ Sensitive personal information (SSN, passwords)
- ❌ Financial information
- ❌ Medical information
- ❌ Any data marked as confidential

### Best Practices
1. **Validate data** before storing
2. **Clear data** on logout
3. **Encrypt sensitive data** if needed
4. **Respect user privacy** settings
5. **Follow GDPR/privacy regulations**

## Debugging

Use the debug function to see what profile claims are available:

```typescript
import { debugAuthData } from '../utils/auth';

// This will log all stored profile claims to the console
debugAuthData();
```

## Example Components

### UserProfileDisplay Component
A comprehensive component that displays all available profile claims:

```typescript
import UserProfileDisplay from '../components/UserProfileDisplay';

// Use in your app
<UserProfileDisplay />
```

### Enhanced Home Page
The Home page now displays profile information including:
- Profile picture
- Full name and username
- Email verification status
- Locale and timezone
- Employee information

## Configuration

Make sure your Okta configuration includes the profile scope:

```typescript
// In config/okta.ts
const oktaAuth = new OktaAuth({
  // ... other config
  scopes: ['openid', 'profile', 'email'], // Include 'profile' scope
  // ... other config
});
```

## Troubleshooting

### Common Issues

1. **Profile claims not available**
   - Check if `profile` scope is included in Okta configuration
   - Verify Okta user has profile information configured

2. **Profile picture not loading**
   - Check if the URL is accessible
   - Verify CORS settings if loading from external domain

3. **Data not persisting**
   - Check localStorage quota limits
   - Verify data is being stored correctly

### Debug Steps

1. Use `debugAuthData()` to see what's stored
2. Check browser console for errors
3. Verify Okta user object structure
4. Test with different user accounts

## Migration from Current Implementation

Your current implementation already works! The enhancements provide:

1. **Type safety** with TypeScript interfaces
2. **Utility functions** for easy access
3. **Better error handling**
4. **Comprehensive debugging**
5. **Cleaner code organization**

No breaking changes - your existing code will continue to work while you can gradually adopt the new utilities.

## Conclusion

Storing Okta profile claims in localStorage is not only possible but already implemented in your application. The enhanced utilities make it easier to access and use this data throughout your application while maintaining type safety and good practices.


