# Okta OIDC Authentication Setup for Career Management System

## Overview
This guide will help you set up Okta OIDC (OpenID Connect) authentication for your Career Management System using a Single Page Application (SPA) configuration with PKCE.

## Prerequisites
- Okta Developer Account
- .NET 8.0 SDK
- Node.js and npm

## Step 1: Okta Application Setup

### 1.1 Create Okta Application
1. Log in to your Okta Developer Console
2. Navigate to Applications > Applications
3. Click "Create App Integration"
4. Select "OIDC - OpenID Connect"
5. Choose "Single Page App (SPA)" for the application type
6. Click "Next"

### 1.2 Configure Application Settings
1. **App name**: ALT Career path app
2. **App type**: Single Page App (SPA)
3. **Grant type**: Authorization Code
4. **PKCE**: Enabled (required for SPA)
5. **Sign-in redirect URIs**: 
   - `https://localhost:52930/login/callback` (development)
   - `https://yourdomain.com/login/callback` (production)
6. **Sign-out redirect URIs**:
   - `https://localhost:52930` (development)
   - `https://yourdomain.com` (production)
7. **Login initiated by**: App Only

### 1.3 Get Configuration Values
After creating the application, note down:
- **Client ID**: 0oat9b6xpeJfxVXYO4x7
- **Issuer URL**: https://login.alliancels.com

**Note**: SPA applications don't use client secrets as they use PKCE for security.

## Step 2: Frontend Setup

### 2.1 Install Dependencies
```bash
cd career_management.client
npm install @okta/okta-react @okta/okta-auth-js
```

### 2.2 Configure Environment Variables
Create a `.env` file in the `career_management.client` directory:
```env
VITE_OKTA_ISSUER=https://login.alliancels.com
VITE_OKTA_CLIENT_ID=0oat9b6xpeJfxVXYO4x7
VITE_API_BASE_URL=https://localhost:7026/api
```

### 2.3 Update Okta Configuration
Edit `src/config/okta.ts` and replace the placeholder values with your actual Okta configuration.

## Step 3: Backend Setup

### 3.1 Install NuGet Packages
```bash
cd Career_Management.Server
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 8.0.0
```

### 3.2 Update Configuration
Edit `appsettings.json` and add your Okta configuration:
```json
{
  "Okta": {
    "Issuer": "https://login.alliancels.com",
    "Audience": "api://default"
  }
}
```

## Step 4: User Mapping

### 4.1 Employee Email Mapping
The system will automatically try to match Okta users to employees by email address. Ensure that:
1. Employee records in your database have valid email addresses
2. Okta user profiles have matching email addresses

### 4.2 Custom User Attributes (Optional)
If you want to use employee codes instead of emails:
1. In Okta, go to Directory > Profile Editor
2. Add a custom attribute called `employeeCode`
3. Update the `LoginCallback.tsx` component to use this attribute

## Step 5: Testing

### 5.1 Start the Application
```bash
# Start backend
cd Career_Management.Server
dotnet run

# Start frontend (in new terminal)
cd career_management.client
npm run dev
```

### 5.2 Test Authentication
1. Navigate to `https://localhost:52930`
2. Click "Sign in with SSO"
3. Complete Okta authentication
4. Verify you're redirected to the home page

## Step 6: Production Deployment

### 6.1 Update Redirect URIs
In your Okta application settings, add your production URLs:
- **Sign-in redirect URIs**: `https://yourdomain.com/login/callback`
- **Sign-out redirect URIs**: `https://yourdomain.com`

### 6.2 Environment Variables
Set production environment variables:
```env
VITE_OKTA_ISSUER=https://login.alliancels.com
VITE_OKTA_CLIENT_ID=0oat3t6270niIvP574x7
VITE_API_BASE_URL=https://yourdomain.com/api
```

### 6.3 Security Considerations
1. Enable HTTPS in production
2. Set `RequireHttpsMetadata = true` in `Program.cs`
3. Configure proper CORS policies
4. Use secure session management

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your Okta domain is added to CORS policy
2. **Redirect URI Mismatch**: Double-check redirect URIs in Okta settings
3. **User Not Found**: Verify email addresses match between Okta and your database
4. **Token Validation Errors**: Check issuer and audience configuration

### Debug Mode
Enable debug logging in `Program.cs`:
```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"Authentication failed: {context.Exception}");
                return Task.CompletedTask;
            }
        };
    });
```

## Security Best Practices

1. **Use HTTPS**: Always use HTTPS in production
2. **Token Validation**: Validate tokens on every request
3. **Session Management**: Implement proper session timeout
4. **Audit Logging**: Log authentication events
5. **Regular Updates**: Keep Okta SDKs updated

## Support

For Okta-specific issues, refer to:
- [Okta Developer Documentation](https://developer.okta.com/)
- [Okta React SDK Documentation](https://github.com/okta/okta-react)
- [Okta Auth JS Documentation](https://github.com/okta/okta-auth-js)
