# 📋 Complete Login Workflow Summary - Submit Portal

## 🏗️ Architecture Overview

### **Dual Authentication System**
- **OTP Login** (One-Time Password) - For users without Active Directory
- **SSO Login** (Single Sign-On) - Using Okta authentication for AD users

### **Technology Stack**
- **Frontend**: React.js with Vite
- **Backend**: ASP.NET Core 8.0 Web API
- **Database**: SQL Server
- **Authentication**: JWT tokens + Okta OAuth 2.0
- **Email**: Alliance LS Email API

---

## 📊 Database Structure

### **Tables Required:**

```sql
-- dLoginType: Defines authentication method
CREATE TABLE dLoginType (
    LoginTypeId INT PRIMARY KEY,
    LoginTypeDesc NVARCHAR(50) NOT NULL
);
-- Values: 1='AD' (SSO), 2='Non AD' (OTP)

-- dCompany: Company information
CREATE TABLE dCompany (
    CompanyId INT PRIMARY KEY,
    CompanyName NVARCHAR(100) NOT NULL,
    City NVARCHAR(50),
    Country NVARCHAR(50)
);

-- dUser: User accounts
CREATE TABLE dUser (
    UserId INT PRIMARY KEY,
    LoginTypeId INT NOT NULL,
    CompanyId INT NOT NULL,
    UserName NVARCHAR(85) NOT NULL,
    Password VARBINARY(MAX) NULL,
    FirstName NVARCHAR(35) NOT NULL,
    LastName NVARCHAR(35) NULL,
    Email NVARCHAR(85) NULL,
    Photo VARCHAR(MAX) NULL,
    IsActive BIT NOT NULL,
    Lang NVARCHAR(15) NULL,
    StartDate DATETIME NULL,
    DisableDate DATETIME NULL,
    Editor NVARCHAR(85) NOT NULL,
    EditDate DATETIME NOT NULL,
    LastLogin DATETIME NULL,
    FOREIGN KEY (LoginTypeId) REFERENCES dLoginType(LoginTypeId),
    FOREIGN KEY (CompanyId) REFERENCES dCompany(CompanyId)
);
```

---

## 🔐 Backend Implementation (C#/.NET)

### **1. Configuration (`appsettings.json`)**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=YOUR_DB;User Id=USER;Password=PASS;TrustServerCertificate=true;"
  },
  "JwtSettings": {
    "SecretKey": "YOUR_SECRET_KEY_AT_LEAST_32_CHARACTERS_LONG!",
    "Issuer": "YourAppName",
    "Audience": "YourAppClient",
    "ExpirationMinutes": "480"
  },
  "Okta": {
    "Issuer": "https://your-okta-domain.okta.com",
    "ClientId": "your-okta-client-id"
  },
  "EmailConfig": {
    "Token": "YOUR_EMAIL_API_TOKEN",
    "FromAlias": "Your App Name"
  }
}
```

### **2. Services to Create**

#### **a) JwtTokenService.cs** - JWT Token Management
```csharp
public class JwtTokenService
{
    // Methods:
    // - GenerateToken(userId, username, email, firstName, lastName, companyId, loginTypeId)
    // - ValidateToken(token)
    // - RefreshToken(token)
}
```

#### **b) OtpService.cs** - OTP Generation & Verification
```csharp
public class OtpService
{
    // In-memory storage for OTP codes
    // Methods:
    // - GenerateOtp() - Returns 6-digit code
    // - StoreOtp(username, code, expiryMinutes)
    // - VerifyOtp(username, code)
}
```

#### **c) EmailService.cs** - Email Sending
```csharp
public class EmailService
{
    // Methods:
    // - SendEmailAsync(toEmail, subject, htmlBody)
    // Calls external email API
}
```

### **3. AuthController.cs** - API Endpoints

```csharp
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    // 1. Check User & Determine Login Type
    [HttpPost("check-user")]
    // Input: { username }
    // Output: { exists, loginType, requiresOtp, email, firstName }
    
    // 2. Request OTP (For Non-AD users)
    [HttpPost("request-otp")]
    // Input: { username }
    // Output: { success, message, expiresIn }
    // Action: Generate OTP, send email
    
    // 3. Verify OTP
    [HttpPost("verify-otp")]
    // Input: { username, otp }
    // Output: { success, token, user }
    // Action: Verify OTP, generate JWT
    
    // 4. Validate Okta Token (For AD users)
    [HttpPost("validate-okta")]
    // Input: { idToken }
    // Output: { success, token, user }
    // Action: Validate Okta ID token, check user exists, generate JWT
    
    // 5. Refresh Token
    [HttpPost("refresh-token")]
    // Input: { token }
    // Output: { success, token, user }
}
```

### **4. Program.cs Configuration**

```csharp
// Add DbContext
builder.Services.AddDbContext<AppsContext>(options =>
    options.UseSqlServer(connectionString));

// Add Services
builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddSingleton<OtpService>();
builder.Services.AddSingleton<EmailService>();
builder.Services.AddHttpClient();

// Configure JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSettings["Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

// Add CORS
builder.Services.AddCors(options => {
    options.AddPolicy("AllowReactApp", policy => {
        policy.WithOrigins("https://localhost:PORT")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Use middleware
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
```

---

## 🎨 Frontend Implementation (React)

### **1. Environment Variables (`.env`)**

```env
VITE_OKTA_ISSUER=https://your-okta-domain.okta.com
VITE_OKTA_CLIENT_ID=your-okta-client-id
VITE_API_BASE_URL=https://localhost:7177/api
VITE_OKTA_REDIRECT_URI=https://localhost:5173/login/callback
VITE_OKTA_SCOPES=openid,profile,email
```

### **2. Okta Configuration (`oktaConfig.js`)**

```javascript
import { OktaAuth } from '@okta/okta-auth-js';

const oktaConfig = {
  issuer: import.meta.env.VITE_OKTA_ISSUER,
  clientId: import.meta.env.VITE_OKTA_CLIENT_ID,
  redirectUri: import.meta.env.VITE_OKTA_REDIRECT_URI,
  scopes: (import.meta.env.VITE_OKTA_SCOPES || 'openid,profile,email').split(','),
  pkce: true,
  responseType: ['code'],
  responseMode: 'query'
};

export default oktaConfig;
```

### **3. Auth Context (`AuthContext.jsx`)**

```javascript
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    const login = (authToken, userData) => {
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('authUser', JSON.stringify(userData));
        setToken(authToken);
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        // Clear Okta storage
        localStorage.removeItem('okta-token-storage');
        localStorage.removeItem('okta-cache-storage');
        localStorage.removeItem('okta-shared-transaction-storage');
        localStorage.removeItem('okta-original-uri-storage');
        sessionStorage.clear();
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
```

### **4. Auth Service (`authService.js`)**

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authService = {
    // Check if user exists and get login type
    checkUser: async (username) => {
        const response = await axios.post(`${API_BASE_URL}/auth/check-user`, { username });
        return response.data;
    },

    // Request OTP
    requestOtp: async (username) => {
        const response = await axios.post(`${API_BASE_URL}/auth/request-otp`, { username });
        return response.data;
    },

    // Verify OTP
    verifyOtp: async (username, otp) => {
        const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, { username, otp });
        return response.data;
    },

    // Validate Okta token
    validateOkta: async (idToken) => {
        const response = await axios.post(`${API_BASE_URL}/auth/validate-okta`, { idToken });
        return response.data;
    }
};

export default authService;
```

### **5. Protected Route (`ProtectedRoute.jsx`)**

```javascript
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};
```

### **6. App.jsx - Main Setup**

```javascript
import { Security } from '@okta/okta-react';
import { OktaAuth, toRelativeUrl } from '@okta/okta-auth-js';
import oktaConfig from './config/oktaConfig';

const oktaAuth = new OktaAuth(oktaConfig);

function App() {
    const restoreOriginalUri = async (_oktaAuth, originalUri) => {
        window.location.replace(toRelativeUrl(originalUri || '/', window.location.origin));
    };

    return (
        <Router>
            <Security oktaAuth={oktaAuth} restoreOriginalUri={restoreOriginalUri}>
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/login/callback" element={<OktaCallback />} />
                        <Route path="*" element={
                            <ProtectedRoute>
                                <MainLayout />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </AuthProvider>
            </Security>
        </Router>
    );
}
```

---

## 🔄 Authentication Workflows

### **A) OTP Login Flow**

```
1. User enters username
   ↓
2. Frontend calls: POST /api/auth/check-user
   ↓
3. Backend checks database
   - If user exists and LoginTypeId = 2 (Non AD)
   - Returns: { exists: true, requiresOtp: true }
   ↓
4. Frontend shows "Send OTP" button
   ↓
5. User clicks "Send OTP"
   ↓
6. Frontend calls: POST /api/auth/request-otp
   ↓
7. Backend:
   - Generates 6-digit OTP
   - Stores in memory with 10min expiry
   - Sends email via Email API
   ↓
8. User receives email, enters OTP code
   ↓
9. Frontend calls: POST /api/auth/verify-otp
   ↓
10. Backend:
    - Validates OTP
    - Generates JWT token
    - Returns: { success: true, token, user }
    ↓
11. Frontend:
    - Stores token in localStorage
    - Updates AuthContext
    - Redirects to dashboard
```

### **B) SSO (Okta) Login Flow**

```
1. User enters username
   ↓
2. Frontend calls: POST /api/auth/check-user
   ↓
3. Backend checks database
   - If user exists and LoginTypeId = 1 (AD)
   - Returns: { exists: true, requiresOtp: false }
   ↓
4. Frontend shows "Login with SSO" button
   ↓
5. User clicks "Login with SSO"
   ↓
6. Frontend:
   - Stores username in sessionStorage
   - Calls: oktaAuth.signInWithRedirect()
   ↓
7. Browser redirects to Okta login page
   ↓
8. User authenticates with Okta
   ↓
9. Okta redirects back to: /login/callback?code=XXX
   ↓
10. OktaCallback component:
    - Checks if login redirect
    - Calls: oktaAuth.token.parseFromUrl()
    - Stores tokens: oktaAuth.tokenManager.setTokens()
    - Retrieves idToken from tokenManager
    ↓
11. Frontend calls: POST /api/auth/validate-okta
    - Sends: { idToken }
    ↓
12. Backend:
    - Validates Okta ID token signature (JWKS)
    - Extracts email/username from token claims
    - Checks if user exists in database
    - Generates JWT token
    - Returns: { success: true, token, user }
    ↓
13. Frontend:
    - Stores token in localStorage
    - Updates AuthContext
    - Redirects to dashboard
```

---

## 🔑 Key Implementation Points

### **1. Security**
- ✅ JWT tokens stored in `localStorage`
- ✅ Okta ID token validated server-side (signature, issuer, expiry)
- ✅ OTP expires after 10 minutes
- ✅ CORS configured for specific origin
- ✅ HTTPS required for production

### **2. Token Management**
- ✅ JWT contains: userId, username, email, firstName, lastName
- ✅ Token expiration: 8 hours (configurable)
- ✅ Refresh token endpoint available
- ✅ Okta tokens managed by `oktaAuth.tokenManager`

### **3. User Experience**
- ✅ Single login page handles both auth types
- ✅ Dynamic UI based on user's login type
- ✅ Loading states during authentication
- ✅ Error messages for failed attempts
- ✅ Automatic redirect after successful login

### **4. Database Design**
- ✅ `LoginTypeId` determines authentication method
- ✅ Foreign keys ensure data integrity
- ✅ `IsActive` flag for user management
- ✅ `LastLogin` tracks user activity

---

## 📦 NuGet Packages Required (Backend)

```xml
<PackageReference Include="Microsoft.EntityFrameworkCore" Version="9.0.8" />
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.0.8" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.11" />
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.2.1" />
<PackageReference Include="Microsoft.IdentityModel.Protocols.OpenIdConnect" Version="8.2.1" />
```

## 📦 NPM Packages Required (Frontend)

```json
{
  "@okta/okta-auth-js": "^7.x",
  "@okta/okta-react": "^6.x",
  "react-router-dom": "^6.x",
  "axios": "^1.x"
}
```

---

## 🎯 Summary

This workflow provides:
- ✅ Flexible dual authentication (OTP + SSO)
- ✅ Secure token-based authentication
- ✅ Database-driven user management
- ✅ Easy to extend and maintain
- ✅ Production-ready architecture

**Copy this entire workflow** to implement the same authentication system in your other applications! 🚀

```sql
-- dLoginType: Defines authentication method
CREATE TABLE dLoginType (
    LoginTypeId INT PRIMARY KEY,
    LoginTypeDesc NVARCHAR(50) NOT NULL
);
-- Values: 1='AD' (SSO), 2='Non AD' (OTP)

-- dCompany: Company information
CREATE TABLE dCompany (
    CompanyId INT PRIMARY KEY,
    CompanyName NVARCHAR(100) NOT NULL,
    City NVARCHAR(50),
    Country NVARCHAR(50)
);

-- dUser: User accounts
CREATE TABLE dUser (
    UserId INT PRIMARY KEY,
    LoginTypeId INT NOT NULL,
    CompanyId INT NOT NULL,
    UserName NVARCHAR(85) NOT NULL,
    Password VARBINARY(MAX) NULL,
    FirstName NVARCHAR(35) NOT NULL,
    LastName NVARCHAR(35) NULL,
    Email NVARCHAR(85) NULL,
    Photo VARCHAR(MAX) NULL,
    IsActive BIT NOT NULL,
    Lang NVARCHAR(15) NULL,
    StartDate DATETIME NULL,
    DisableDate DATETIME NULL,
    Editor NVARCHAR(85) NOT NULL,
    EditDate DATETIME NOT NULL,
    LastLogin DATETIME NULL,
    FOREIGN KEY (LoginTypeId) REFERENCES dLoginType(LoginTypeId),
    FOREIGN KEY (CompanyId) REFERENCES dCompany(CompanyId)
);
```

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=YOUR_DB;User Id=USER;Password=PASS;TrustServerCertificate=true;"
  },
  "JwtSettings": {
    "SecretKey": "YOUR_SECRET_KEY_AT_LEAST_32_CHARACTERS_LONG!",
    "Issuer": "YourAppName",
    "Audience": "YourAppClient",
    "ExpirationMinutes": "480"
  },
  "Okta": {
    "Issuer": "https://your-okta-domain.okta.com",
    "ClientId": "your-okta-client-id"
  },
  "EmailConfig": {
    "Token": "YOUR_EMAIL_API_TOKEN",
    "FromAlias": "Your App Name"
  }
}
```

```csharp
public class JwtTokenService
{
    // Methods:
    // - GenerateToken(userId, username, email, firstName, lastName, companyId, loginTypeId)
    // - ValidateToken(token)
    // - RefreshToken(token)
}
```

```csharp
public class OtpService
{
    // In-memory storage for OTP codes
    // Methods:
    // - GenerateOtp() - Returns 6-digit code
    // - StoreOtp(username, code, expiryMinutes)
    // - VerifyOtp(username, code)
}
```

```csharp
public class EmailService
{
    // Methods:
    // - SendEmailAsync(toEmail, subject, htmlBody)
    // Calls external email API
}
```

```csharp
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    // 1. Check User & Determine Login Type
    [HttpPost("check-user")]
    // Input: { username }
    // Output: { exists, loginType, requiresOtp, email, firstName }
    
    // 2. Request OTP (For Non-AD users)
    [HttpPost("request-otp")]
    // Input: { username }
    // Output: { success, message, expiresIn }
    // Action: Generate OTP, send email
    
    // 3. Verify OTP
    [HttpPost("verify-otp")]
    // Input: { username, otp }
    // Output: { success, token, user }
    // Action: Verify OTP, generate JWT
    
    // 4. Validate Okta Token (For AD users)
    [HttpPost("validate-okta")]
    // Input: { idToken }
    // Output: { success, token, user }
    // Action: Validate Okta ID token, check user exists, generate JWT
    
    // 5. Refresh Token
    [HttpPost("refresh-token")]
    // Input: { token }
    // Output: { success, token, user }
}
```

```csharp
// Add DbContext
builder.Services.AddDbContext<AppsContext>(options =>
    options.UseSqlServer(connectionString));

// Add Services
builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddSingleton<OtpService>();
builder.Services.AddSingleton<EmailService>();
builder.Services.AddHttpClient();

// Configure JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSettings["Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

// Add CORS
builder.Services.AddCors(options => {
    options.AddPolicy("AllowReactApp", policy => {
        policy.WithOrigins("https://localhost:PORT")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Use middleware
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
```

```plaintext
VITE_OKTA_ISSUER=https://your-okta-domain.okta.com
VITE_OKTA_CLIENT_ID=your-okta-client-id
VITE_API_BASE_URL=https://localhost:7177/api
VITE_OKTA_REDIRECT_URI=https://localhost:5173/login/callback
VITE_OKTA_SCOPES=openid,profile,email
```

```javascript
import { OktaAuth } from '@okta/okta-auth-js';

const oktaConfig = {
  issuer: import.meta.env.VITE_OKTA_ISSUER,
  clientId: import.meta.env.VITE_OKTA_CLIENT_ID,
  redirectUri: import.meta.env.VITE_OKTA_REDIRECT_URI,
  scopes: (import.meta.env.VITE_OKTA_SCOPES || 'openid,profile,email').split(','),
  pkce: true,
  responseType: ['code'],
  responseMode: 'query'
};

export default oktaConfig;
```

```javascript
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    const login = (authToken, userData) => {
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('authUser', JSON.stringify(userData));
        setToken(authToken);
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        // Clear Okta storage
        localStorage.removeItem('okta-token-storage');
        localStorage.removeItem('okta-cache-storage');
        localStorage.removeItem('okta-shared-transaction-storage');
        localStorage.removeItem('okta-original-uri-storage');
        sessionStorage.clear();
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
```

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authService = {
    // Check if user exists and get login type
    checkUser: async (username) => {
        const response = await axios.post(`${API_BASE_URL}/auth/check-user`, { username });
        return response.data;
    },

    // Request OTP
    requestOtp: async (username) => {
        const response = await axios.post(`${API_BASE_URL}/auth/request-otp`, { username });
        return response.data;
    },

    // Verify OTP
    verifyOtp: async (username, otp) => {
        const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, { username, otp });
        return response.data;
    },

    // Validate Okta token
    validateOkta: async (idToken) => {
        const response = await axios.post(`${API_BASE_URL}/auth/validate-okta`, { idToken });
        return response.data;
    }
};

export default authService;
```

```javascript
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};
```

```javascript
import { Security } from '@okta/okta-react';
import { OktaAuth, toRelativeUrl } from '@okta/okta-auth-js';
import oktaConfig from './config/oktaConfig';

const oktaAuth = new OktaAuth(oktaConfig);

function App() {
    const restoreOriginalUri = async (_oktaAuth, originalUri) => {
        window.location.replace(toRelativeUrl(originalUri || '/', window.location.origin));
    };

    return (
        <Router>
            <Security oktaAuth={oktaAuth} restoreOriginalUri={restoreOriginalUri}>
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/login/callback" element={<OktaCallback />} />
                        <Route path="*" element={
                            <ProtectedRoute>
                                <MainLayout />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </AuthProvider>
            </Security>
        </Router>
    );
}
```

```plaintext
1. User enters username
   ↓
2. Frontend calls: POST /api/auth/check-user
   ↓
3. Backend checks database
   - If user exists and LoginTypeId = 2 (Non AD)
   - Returns: { exists: true, requiresOtp: true }
   ↓
4. Frontend shows "Send OTP" button
   ↓
5. User clicks "Send OTP"
   ↓
6. Frontend calls: POST /api/auth/request-otp
   ↓
7. Backend:
   - Generates 6-digit OTP
   - Stores in memory with 10min expiry
   - Sends email via Email API
   ↓
8. User receives email, enters OTP code
   ↓
9. Frontend calls: POST /api/auth/verify-otp
   ↓
10. Backend:
    - Validates OTP
    - Generates JWT token
    - Returns: { success: true, token, user }
    ↓
11. Frontend:
    - Stores token in localStorage
    - Updates AuthContext
    - Redirects to dashboard
```

```plaintext
1. User enters username
   ↓
2. Frontend calls: POST /api/auth/check-user
   ↓
3. Backend checks database
   - If user exists and LoginTypeId = 1 (AD)
   - Returns: { exists: true, requiresOtp: false }
   ↓
4. Frontend shows "Login with SSO" button
   ↓
5. User clicks "Login with SSO"
   ↓
6. Frontend:
   - Stores username in sessionStorage
   - Calls: oktaAuth.signInWithRedirect()
   ↓
7. Browser redirects to Okta login page
   ↓
8. User authenticates with Okta
   ↓
9. Okta redirects back to: /login/callback?code=XXX
   ↓
10. OktaCallback component:
    - Checks if login redirect
    - Calls: oktaAuth.token.parseFromUrl()
    - Stores tokens: oktaAuth.tokenManager.setTokens()
    - Retrieves idToken from tokenManager
    ↓
11. Frontend calls: POST /api/auth/validate-okta
    - Sends: { idToken }
    ↓
12. Backend:
    - Validates Okta ID token signature (JWKS)
    - Extracts email/username from token claims
    - Checks if user exists in database
    - Generates JWT token
    - Returns: { success: true, token, user }
    ↓
13. Frontend:
    - Stores token in localStorage
    - Updates AuthContext
    - Redirects to dashboard
```

```xml
<PackageReference Include="Microsoft.EntityFrameworkCore" Version="9.0.8" />
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.0.8" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.11" />
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.2.1" />
<PackageReference Include="Microsoft.IdentityModel.Protocols.OpenIdConnect" Version="8.2.1" />
```

```json
{
  "@okta/okta-auth-js": "^7.x",
  "@okta/okta-react": "^6.x",
  "react-router-dom": "^6.x",
  "axios": "^1.x"
}
```

