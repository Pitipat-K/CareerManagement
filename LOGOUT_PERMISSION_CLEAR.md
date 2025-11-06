# Logout Permission Clearing Implementation

## Overview
When a user signs out, all cached permissions and authentication data are completely cleared to ensure security and prevent stale permission data.

## What Gets Cleared on Logout

### 1. Permission Cache (Context State)
- ✅ In-memory permissions array
- ✅ `isSystemAdmin` flag
- ✅ Permission error state

### 2. LocalStorage Items
- ✅ `userPermissions` - Cached permission list
- ✅ `isSystemAdmin` - System admin status
- ✅ `permissionsTimestamp` - Cache timestamp
- ✅ `userEmail` - User email address
- ✅ `oktaUser` - Okta user data
- ✅ `currentEmployee` - Employee information
- ✅ `isAuthenticated` - Authentication status
- ✅ `oktaAuthCode` - Okta authorization code
- ✅ `okta-token-storage` - Okta tokens
- ✅ `okta-cache-storage` - Okta cache

### 3. Okta Session
- ✅ Signs out from Okta Auth service
- ✅ Invalidates access tokens
- ✅ Clears Okta session

## Implementation Details

### Centralized Logout Function

**Location**: `src/utils/logout.ts`

```typescript
export const performLogout = async (
  oktaAuth: OktaAuth,
  clearPermissions?: () => void,
  navigate?: (path: string) => void
): Promise<void>
```

**Features**:
- Clears permission context if provided
- Clears all localStorage items
- Signs out from Okta
- Navigates to login page
- Handles errors gracefully
- Logs each step for debugging

### Usage in Components

#### Header Component (Main Logout Button)
```typescript
import { performLogout } from '../utils/logout';
import { usePermissionContext } from '../contexts/PermissionContext';

const Header = () => {
  const { oktaAuth } = useOktaAuth();
  const { clearPermissions } = usePermissionContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await performLogout(oktaAuth, clearPermissions, navigate);
  };
  
  // ...
};
```

#### Pages Without PermissionContext
For pages that don't have access to PermissionContext:

```typescript
import { simpleLogout } from '../utils/logout';

const SomePage = () => {
  const { oktaAuth } = useOktaAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await simpleLogout(oktaAuth, navigate);
  };
  
  // ...
};
```

## Logout Flow

```
User clicks "Sign out"
        ↓
┌───────────────────────────────────┐
│ 1. Clear Permission Context       │
│    - permissions = []              │
│    - isSystemAdmin = false         │
│    - error = null                  │
└───────────────────────────────────┘
        ↓
┌───────────────────────────────────┐
│ 2. Clear LocalStorage              │
│    - Remove userPermissions        │
│    - Remove isSystemAdmin          │
│    - Remove permissionsTimestamp   │
│    - Remove all auth data          │
└───────────────────────────────────┘
        ↓
┌───────────────────────────────────┐
│ 3. Sign Out from Okta              │
│    - Invalidate tokens             │
│    - Clear Okta session            │
└───────────────────────────────────┘
        ↓
┌───────────────────────────────────┐
│ 4. Navigate to Login Page          │
│    - Redirect to /login            │
└───────────────────────────────────┘
```

## Security Benefits

### ✅ Prevents Permission Persistence
- User permissions don't carry over between sessions
- No stale permission data
- Fresh permissions loaded on each login

### ✅ Prevents Role Confusion
- If user roles change while logged out, they get new permissions on next login
- No risk of using old permissions after role update

### ✅ Multi-User Device Safety
- Completely clears previous user's data
- Safe for shared devices
- No permission leakage between users

### ✅ Session Isolation
- Each login session is completely independent
- No cross-session permission contamination

## Console Output on Logout

When a user logs out, you'll see these console messages:

```
🚪 User logging out...
✅ Permission cache cleared from context
✅ Auth data cleared from localStorage
✅ Signed out from Okta
🧹 Permissions cache cleared
```

## Testing the Logout

### Test Case 1: Basic Logout
1. ✅ Login as a user
2. ✅ Navigate through the app (permissions cached)
3. ✅ Click "Sign out"
4. ✅ Check localStorage - all items cleared
5. ✅ Login again - permissions reloaded fresh

### Test Case 2: Permission Changes While Logged Out
1. ✅ Login as User A
2. ✅ Logout
3. ✅ Admin changes User A's permissions
4. ✅ User A logs in again
5. ✅ Verify User A has NEW permissions (not cached old ones)

### Test Case 3: Multi-User Device
1. ✅ Login as User A (has admin permissions)
2. ✅ Navigate to admin area
3. ✅ Logout
4. ✅ Login as User B (has read-only permissions)
5. ✅ Verify User B doesn't see admin menu (no permission leakage)

### Test Case 4: Logout Error Handling
1. ✅ Disconnect network
2. ✅ Click "Sign out"
3. ✅ Verify local data still cleared even if Okta signout fails
4. ✅ Redirected to login page

## Verification

### Check Browser DevTools

After logout, verify in **Application** → **Local Storage**:
- ❌ `userPermissions` should NOT exist
- ❌ `isSystemAdmin` should NOT exist
- ❌ `permissionsTimestamp` should NOT exist
- ❌ `userEmail` should NOT exist
- ❌ `currentEmployee` should NOT exist
- ❌ `isAuthenticated` should NOT exist
- ❌ All Okta storage items should NOT exist

### Check Browser Console

Should see logout sequence:
```
🚪 User logging out...
✅ Permission cache cleared from context
✅ Auth data cleared from localStorage
✅ Signed out from Okta
🧹 Permissions cache cleared
```

### Check Network Tab

Should see Okta signout requests completing successfully.

## Files Modified

### New Files
1. ✅ `src/utils/logout.ts` - Centralized logout utility

### Updated Files
1. ✅ `src/components/Header.tsx` - Uses new logout function
2. ✅ `src/utils/auth.ts` - Already clears permission cache
3. ✅ `src/contexts/PermissionContext.tsx` - Already has clearPermissions method

## Integration with Permission Caching

The logout process integrates perfectly with the permission caching system:

| Action | Permission Cache | LocalStorage | Okta Session |
|--------|-----------------|--------------|--------------|
| **Login** | Load from API | Cache for 24h | Create session |
| **Navigate** | Use cached | Read from LS | Active |
| **Logout** | ✅ Clear | ✅ Clear | ✅ Sign out |
| **Next Login** | ✅ Fresh load | ✅ New cache | ✅ New session |

## Best Practices

### ✅ DO
- Always use `performLogout()` for consistent logout behavior
- Clear permissions before clearing auth data
- Handle logout errors gracefully
- Log logout steps for debugging

### ❌ DON'T
- Don't manually clear individual localStorage items
- Don't forget to clear permission context
- Don't skip Okta signout
- Don't assume logout always succeeds

## Troubleshooting

### Issue: Permissions persist after logout
**Solution**: Check if `clearPermissions()` is being called
```typescript
// Verify this is called
const { clearPermissions } = usePermissionContext();
await performLogout(oktaAuth, clearPermissions, navigate);
```

### Issue: User sees old permissions after re-login
**Solution**: Check browser console for "Loaded permissions from cache" - should show fresh load
```
🔄 Loading user permissions from API...  ← Should see this on re-login
✅ Permissions loaded and cached successfully
```

### Issue: Logout button doesn't clear everything
**Solution**: Use the centralized `performLogout()` function instead of custom logic

### Issue: Error during logout
**Solution**: Check console for error details. Even if Okta fails, local data should still clear:
```
❌ Error during logout: [error details]
✅ Permission cache cleared from context  ← Should still happen
✅ Auth data cleared from localStorage    ← Should still happen
```

## Summary

✅ **Complete Cleanup**: All permissions and auth data cleared on logout
✅ **Security**: No permission leakage between sessions
✅ **Consistency**: Centralized logout function across all components
✅ **Error Handling**: Graceful fallback even if Okta fails
✅ **Logging**: Clear console output for debugging
✅ **Integration**: Works perfectly with permission caching system
