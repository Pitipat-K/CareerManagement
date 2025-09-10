# User Email Storage and Access

This document explains how user email is stored and accessed after successful Okta login.

## Overview

When a user successfully logs in through Okta, their email address is automatically stored in localStorage for easy access throughout the application.

## Storage Location

The user email is stored in two places in localStorage:

1. **Dedicated key**: `userEmail` - Contains just the email address
2. **Full user object**: `oktaUser` - Contains the complete Okta user object including email

## How to Access User Email

### Using the Utility Functions (Recommended)

Import the utility functions from `src/utils/auth.ts`:

```typescript
import { getUserEmail, getOktaUser, getCurrentEmployee } from '../utils/auth';

// Get just the email
const userEmail = getUserEmail();

// Get the full Okta user object
const oktaUser = getOktaUser();

// Get the current employee object
const currentEmployee = getCurrentEmployee();
```

### Direct localStorage Access

You can also access the email directly from localStorage:

```typescript
// Get email from dedicated key
const userEmail = localStorage.getItem('userEmail');

// Get email from Okta user object
const oktaUser = localStorage.getItem('oktaUser');
const userData = oktaUser ? JSON.parse(oktaUser) : null;
const email = userData?.email;
```

## Available Utility Functions

### `getUserEmail()`
Returns the user email if available, null otherwise.
- First tries to get from the dedicated `userEmail` key
- Falls back to extracting from the `oktaUser` object
- Returns `null` if no email is found

### `getOktaUser()`
Returns the full Okta user object if available, null otherwise.
- Parses the `oktaUser` object from localStorage
- Returns `null` if no user data is found

### `getCurrentEmployee()`
Returns the current employee object if available, null otherwise.
- Parses the `currentEmployee` object from localStorage
- Returns `null` if no employee data is found

### `isAuthenticated()`
Returns true if user is authenticated, false otherwise.
- Checks the `isAuthenticated` flag in localStorage

### `clearAuthData()`
Clears all authentication-related data from localStorage.
- Removes `userEmail`, `oktaUser`, `currentEmployee`, `isAuthenticated`, and `oktaAuthCode`

## Example Usage

```typescript
import React from 'react';
import { getUserEmail } from '../utils/auth';

const MyComponent = () => {
  const userEmail = getUserEmail();
  
  return (
    <div>
      {userEmail ? (
        <p>Welcome, {userEmail}!</p>
      ) : (
        <p>Please log in to continue.</p>
      )}
    </div>
  );
};
```

## When Email is Stored

The user email is stored in localStorage when:

1. User successfully completes Okta authentication
2. The `LoginCallback` component processes the authentication
3. User information is retrieved from Okta
4. Email is extracted and stored in both `userEmail` and `oktaUser` keys

## Security Notes

- The email is stored in localStorage, which persists until the browser tab is closed or localStorage is cleared
- localStorage is accessible via JavaScript, so sensitive operations should be validated server-side
- The email is used primarily for user identification and display purposes
- For sensitive operations, always validate the user's identity on the server side

## Troubleshooting

If the user email is not available:

1. Check if the user is properly authenticated
2. Verify that Okta login was successful
3. Check browser console for any authentication errors
4. Ensure the `LoginCallback` component completed successfully
5. Check if localStorage is available and not disabled

## Related Files

- `src/pages/LoginCallback.tsx` - Handles Okta authentication and stores user data
- `src/utils/auth.ts` - Utility functions for accessing authentication data
- `src/pages/Home.tsx` - Example usage of user email display
- `src/components/UserEmailExample.tsx` - Demonstration component
