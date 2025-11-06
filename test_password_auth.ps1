# =============================================
# Test Password Authentication System
# =============================================

$ErrorActionPreference = "Stop"

# Configuration
$BaseUrl = "https://localhost:7026"  # Change if your API runs on different port
$TestEmployeeCode = "TEST001"
$TestEmail = "test.user@alliancelaundry.com"
$TestPassword = "TestPassword123!"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Password Authentication Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# =============================================
# Test 1: Set Password for Test User
# =============================================
Write-Host "[Test 1] Setting password for test user..." -ForegroundColor Yellow

try {
    # First, we need to get the employee ID
    Write-Host "  - Fetching employees..." -ForegroundColor Gray
    $employees = Invoke-RestMethod -Uri "$BaseUrl/api/Employees" -Method GET
    $testEmployee = $employees | Where-Object { $_.employeeCode -eq $TestEmployeeCode }
    
    if (-not $testEmployee) {
        Write-Host "  ✗ Test employee not found with code: $TestEmployeeCode" -ForegroundColor Red
        Write-Host "  Please run the Setup_Test_User_With_Password.sql script first" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  ✓ Found employee: $($testEmployee.firstName) $($testEmployee.lastName) (ID: $($testEmployee.employeeID))" -ForegroundColor Green
    
    # Set password
    Write-Host "  - Setting password..." -ForegroundColor Gray
    $setPasswordBody = @{
        employeeID = $testEmployee.employeeID
        newPassword = $TestPassword
    } | ConvertTo-Json
    
    $setPasswordResponse = Invoke-RestMethod -Uri "$BaseUrl/api/Authentication/set-password" `
        -Method POST `
        -Body $setPasswordBody `
        -ContentType "application/json"
    
    Write-Host "  ✓ Password set successfully" -ForegroundColor Green
}
catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "  ✗ User account not found. Create user account first." -ForegroundColor Red
    }
    else {
        Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# =============================================
# Test 2: Verify Employee Code
# =============================================
Write-Host "[Test 2] Verifying employee code..." -ForegroundColor Yellow

try {
    $verifyBody = @{
        employeeCode = $TestEmployeeCode
    } | ConvertTo-Json
    
    $verifyResponse = Invoke-RestMethod -Uri "$BaseUrl/api/Authentication/verify-employee-code" `
        -Method POST `
        -Body $verifyBody `
        -ContentType "application/json"
    
    Write-Host "  ✓ Employee code verified" -ForegroundColor Green
    Write-Host "    - Name: $($verifyResponse.firstName) $($verifyResponse.lastName)" -ForegroundColor Gray
    Write-Host "    - Email: $($verifyResponse.email)" -ForegroundColor Gray
    Write-Host "    - Position: $($verifyResponse.positionTitle)" -ForegroundColor Gray
}
catch {
    Write-Host "  ✗ Failed to verify employee code" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# =============================================
# Test 3: Login with Correct Credentials
# =============================================
Write-Host "[Test 3] Testing login with correct credentials..." -ForegroundColor Yellow

try {
    $loginBody = @{
        email = $TestEmail
        password = $TestPassword
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/Authentication/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json"
    
    Write-Host "  ✓ Login successful" -ForegroundColor Green
    Write-Host "    - User ID: $($loginResponse.user.userID)" -ForegroundColor Gray
    Write-Host "    - Employee: $($loginResponse.user.firstName) $($loginResponse.user.lastName)" -ForegroundColor Gray
    Write-Host "    - Is Admin: $($loginResponse.user.isSystemAdmin)" -ForegroundColor Gray
}
catch {
    Write-Host "  ✗ Login failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# =============================================
# Test 4: Login with Wrong Password
# =============================================
Write-Host "[Test 4] Testing login with wrong password..." -ForegroundColor Yellow

try {
    $wrongLoginBody = @{
        email = $TestEmail
        password = "WrongPassword123!"
    } | ConvertTo-Json
    
    $wrongLoginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/Authentication/login" `
        -Method POST `
        -Body $wrongLoginBody `
        -ContentType "application/json"
    
    Write-Host "  ✗ Unexpected success with wrong password!" -ForegroundColor Red
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "  ✓ Correctly rejected wrong password" -ForegroundColor Green
        
        # Try to get error message
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd() | ConvertFrom-Json
        Write-Host "    - Message: $($responseBody.message)" -ForegroundColor Gray
    }
    else {
        Write-Host "  ? Unexpected error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""

# =============================================
# Test 5: Verify Non-existent Employee Code
# =============================================
Write-Host "[Test 5] Testing with non-existent employee code..." -ForegroundColor Yellow

try {
    $invalidVerifyBody = @{
        employeeCode = "INVALID999"
    } | ConvertTo-Json
    
    $invalidVerifyResponse = Invoke-RestMethod -Uri "$BaseUrl/api/Authentication/verify-employee-code" `
        -Method POST `
        -Body $invalidVerifyBody `
        -ContentType "application/json"
    
    Write-Host "  ✗ Unexpected success with invalid code!" -ForegroundColor Red
}
catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "  ✓ Correctly rejected invalid employee code" -ForegroundColor Green
    }
    else {
        Write-Host "  ? Unexpected error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""

# =============================================
# Summary
# =============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Credentials:" -ForegroundColor White
Write-Host "  Employee Code: $TestEmployeeCode" -ForegroundColor Gray
Write-Host "  Email: $TestEmail" -ForegroundColor Gray
Write-Host "  Password: $TestPassword" -ForegroundColor Gray
Write-Host ""
Write-Host "You can now test the login page:" -ForegroundColor White
Write-Host "  1. Navigate to http://localhost:3000/login" -ForegroundColor Gray
Write-Host "  2. Enter Employee Code: $TestEmployeeCode" -ForegroundColor Gray
Write-Host "  3. Click 'Continue'" -ForegroundColor Gray
Write-Host "  4. Enter Email: $TestEmail" -ForegroundColor Gray
Write-Host "  5. Enter Password: $TestPassword" -ForegroundColor Gray
Write-Host "  6. Click 'Sign In'" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

