# Test Notification System

## Overview

The test notification system provides a user-friendly interface to test and debug email notifications without going through the full assessment process. This is useful for:

- Testing email configuration
- Debugging email sending issues
- Verifying email templates
- Testing with different data scenarios

## How to Access

Navigate to: `http://localhost:5173/test-notification`

## Features

### 1. Configuration Status Check
- **Token Config**: Shows if the email token configuration file exists
- **Notification Config**: Shows if the email template configuration file exists
- **File Paths**: Displays the exact paths where configuration files are expected

### 2. Test Email Form
Fill in the form with test data:
- **Employee Name**: Name of the employee who completed the assessment
- **Manager Email***: Email address to send the test notification to (required)
- **Position Title**: Employee's position title
- **Department Name**: Employee's department
- **Assessment Period**: Assessment period (e.g., "Q1 2025")
- **Completion Date**: Date when assessment was completed
- **Total Competencies**: Number of competencies assessed
- **Average Score**: Average competency score
- **Competencies Needing Attention**: Number of competencies below required level

### 3. Quick Select Options
- **Select Employee Data**: Click on any employee to auto-fill employee information
- **Select Manager Email**: Click on any manager to auto-fill their email address

### 4. Send Test Button
- Sends a test email using the current form data
- Shows loading state while sending
- Displays success/error messages
- Validates required fields

## Debugging Common Issues

### 1. Configuration Files Missing
**Symptoms**: Configuration status shows "✗ Missing"
**Solution**: 
- Check if `send-email-token.json` exists in `Career_Management.Server/Config/`
- Check if `assessment-notification-config.json` exists in `Career_Management.Server/Config/`
- Verify file paths are correct

### 2. Email Service Connection Issues
**Symptoms**: "Failed to send test email" error
**Possible Causes**:
- Network connectivity issues
- Invalid API token
- Email service API down
- Incorrect API endpoint

**Debugging Steps**:
1. Check browser console for detailed error messages
2. Verify the API token in `send-email-token.json`
3. Test the email service API directly
4. Check network connectivity

### 3. Email Template Issues
**Symptoms**: Email sent but content is incorrect
**Debugging Steps**:
1. Check the HTML template in `assessment-notification-config.json`
2. Verify placeholder replacements are working
3. Test with different data to see if placeholders are replaced correctly

### 4. Database Connection Issues
**Symptoms**: "No employees found" or "No managers found"
**Debugging Steps**:
1. Check if the backend server is running
2. Verify database connection
3. Check if employees and managers exist in the database
4. Ensure employees have email addresses

## API Endpoints Used

### Backend Endpoints:
- `GET /api/TestNotification/test-config` - Check configuration files
- `GET /api/TestNotification/employees-with-managers` - Get employee data
- `GET /api/TestNotification/managers` - Get manager data
- `POST /api/TestNotification/send-test-email` - Send test email

## Testing Scenarios

### 1. Basic Test
1. Fill in a valid manager email
2. Use default test data
3. Click "Send Test Email"
4. Check if email is received

### 2. Real Employee Data Test
1. Select an employee from the list
2. Select a manager from the list
3. Send test email
4. Verify email contains correct employee information

### 3. Custom Data Test
1. Fill in custom data for all fields
2. Test different assessment periods
3. Test different competency scores
4. Verify email template handles all scenarios

### 4. Error Testing
1. Try sending without manager email (should show validation error)
2. Try with invalid email format
3. Test with empty or null values
4. Verify error handling works correctly

## Troubleshooting Checklist

- [ ] Backend server is running
- [ ] Database is accessible
- [ ] Configuration files exist and are valid JSON
- [ ] API token is correct
- [ ] Email service API is accessible
- [ ] Network connectivity is working
- [ ] Employee and manager data exists in database
- [ ] Email addresses are valid

## Logs and Debugging

### Backend Logs
Check the backend console for:
- Configuration loading errors
- Email service API responses
- Database query errors
- Exception details

### Frontend Console
Check browser console for:
- API call errors
- Network request failures
- JavaScript errors

### Email Service Logs
If available, check the email service logs for:
- Authentication failures
- Email delivery status
- Rate limiting issues

## Security Notes

- The test system uses the same email service as production
- Test emails are real emails sent to actual addresses
- Be careful when testing with real email addresses
- Consider using test email addresses for debugging

## Next Steps

After successful testing:
1. Remove or secure the test route for production
2. Add proper logging for email notifications
3. Implement email delivery tracking
4. Add email templates for different scenarios 