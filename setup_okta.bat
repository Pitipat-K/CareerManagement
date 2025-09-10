@echo off
echo Setting up Okta Authentication for Career Management System...
echo.

echo Step 1: Installing frontend dependencies...
cd career_management.client
call npm install @okta/okta-react @okta/okta-auth-js
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Installing backend dependencies...
cd ..\Career_Management.Server
call dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 8.0.0
if %errorlevel% neq 0 (
    echo Error installing backend dependencies
    pause
    exit /b 1
)

echo.
echo Step 3: Creating environment file...
cd ..\career_management.client
if not exist .env (
    echo Creating .env file...
    echo VITE_OKTA_ISSUER=https://login.alliancels.com > .env
    echo VITE_OKTA_CLIENT_ID=0oat9b6xpeJfxVXYO4x7 >> .env
    echo VITE_API_BASE_URL=https://localhost:7026/api >> .env
    echo VITE_OKTA_REDIRECT_URI=https://localhost:52930/login/callback >> .env
    echo VITE_OKTA_SCOPES=openid,profile,email >> .env
    echo Environment file created successfully!
) else (
    echo .env file already exists
)

echo.
echo Setup completed successfully!
echo.
echo Next steps:
echo 1. Update the .env file with your actual Okta configuration
echo 2. Update appsettings.json with your Okta settings
echo 3. Start the backend: cd Career_Management.Server ^&^& dotnet run
echo 4. Start the frontend: cd career_management.client ^&^& npm run dev
echo.
pause
