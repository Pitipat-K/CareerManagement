# Email Configuration Guide

## Overview

The Career Management System uses an API-based email service for sending emails. Both the notification service and password reset service use the same email API endpoint with token-based authentication.

## Email Service Architecture

### API Endpoint
- **URL**: `https://altsmart.alliancels.net/api/SendMail`
- **Method**: POST
- **Content-Type**: application/json

### Configuration Files

All email configurations are stored in the `Career_Management.Server/Config/` directory:

#### 1. Token Configuration (Shared)
**File**: `send-email-token.json`

```json
{
  "emailConfig": {
    "token": "YOUR_API_TOKEN",
    "FromAlias": "Career Management System"
  }
}
```

This configuration is shared across all email types for authentication.

#### 2. Password Reset Verification Email
**File**: `password-reset-verification-config.json`

Contains the subject and HTML body template for verification code emails.

**Placeholders**:
- `[Recipient Name]` - User's full name
- `[Verification Code]` - 6-digit verification code

#### 3. Password Reset Confirmation Email
**File**: `password-reset-confirmation-config.json`

Contains the subject and HTML body template for password reset confirmation emails.

**Placeholders**:
- `[Recipient Name]` - User's full name

#### 4. Assessment Notification Email
**File**: `assessment-notification-config.json`

Contains the subject and HTML body template for assessment completion notifications.

## Email Service Implementation

### Services

Both email services follow the same pattern:

1. **NotificationService** - For assessment notifications
   - Sends manager notifications when employees complete assessments
   
2. **EmailService** - For password reset emails
   - Sends verification codes
   - Sends password reset confirmation

### Service Registration

In `Program.cs`:

```csharp
// Register NotificationService with HttpClient
builder.Services.AddHttpClient<NotificationService>();

// Register EmailService with HttpClient
builder.Services.AddHttpClient<IEmailService, EmailService>();
```

## Email Request Format

When sending an email via the API, the request body follows this format:

```json
{
  "To": "recipient@example.com",
  "Cc": "",
  "Bcc": "",
  "Subject": "Email Subject",
  "Body": "HTML or plain text body",
  "IsHTML": true,
  "token": "YOUR_API_TOKEN",
  "FromAlias": "Career Management System"
}
```

## How It Works

### 1. Load Configuration
Both services load configuration from JSON files:
- Token and FromAlias from `send-email-token.json`
- Email template (subject and body) from specific config file

### 2. Prepare Email Content
- Replace placeholders in the template with actual data
- Format HTML content

### 3. Send via API
- Construct API request with all required fields
- Send POST request to email API endpoint
- Log success or error

### 4. Handle Response
- Return success/failure status
- Log detailed information for troubleshooting

## Password Reset Email Flow

### Step 1: User Requests Password Reset
1. User enters employee code and email
2. System generates 6-digit verification code
3. Verification code stored in database with 15-minute expiry
4. **Verification code email sent** using `password-reset-verification-config.json`

### Step 2: User Verifies Email
1. User enters verification code from email
2. System validates code (not expired, not used)
3. Code marked as used in database

### Step 3: User Resets Password
1. User enters new password
2. Password encrypted and saved to database
3. **Confirmation email sent** using `password-reset-confirmation-config.json`

## Email Templates

### Verification Code Email Features
- Large, centered verification code (32px, letter-spacing)
- 15-minute expiry notice
- Security warning (if user didn't request it)
- Step-by-step instructions
- Professional styling with company branding

### Confirmation Email Features
- Success checkmark icon
- What's next information
- Security alert (if user didn't make the change)
- Security tips list
- Professional styling with company branding

## Configuration Management

### Security Best Practices
1. **Never commit tokens to source control**
   - Keep `send-email-token.json` out of version control
   - Use `.gitignore` to exclude sensitive config files
   
2. **Use different tokens per environment**
   - Development token
   - Production token
   
3. **Rotate tokens regularly**
   - Update token in config file
   - No code changes needed

### Updating Email Templates

To update email content:

1. Open the appropriate config file in `Config/` directory
2. Modify the HTML in the `body` field
3. Maintain placeholder syntax: `[Placeholder Name]`
4. Test with development environment
5. Deploy to production

**Note**: No code changes or recompilation needed when updating email templates!

## Logging

Both services include comprehensive logging:

- Configuration file loading
- Email preparation
- API request/response
- Success/failure status
- Error details with stack traces

**Log Levels**:
- `Information`: Normal operations
- `Warning`: Non-critical issues
- `Error`: Failed operations

## Troubleshooting

### Email Not Sending

1. **Check configuration files exist**
   ```
   Config/send-email-token.json
   Config/password-reset-verification-config.json
   Config/password-reset-confirmation-config.json
   ```

2. **Verify token is valid**
   - Check token in `send-email-token.json`
   - Ensure no extra spaces or line breaks

3. **Check logs for errors**
   - Look for "Failed to load email configuration"
   - Look for API response errors

4. **Verify API endpoint is accessible**
   - Test: `https://altsmart.alliancels.net/api/SendMail`

### Template Not Rendering Correctly

1. **Check placeholder syntax**
   - Use exact placeholder names: `[Recipient Name]`
   - Case-sensitive

2. **Validate HTML**
   - Use inline CSS (external stylesheets not supported)
   - Test HTML in email client

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Token config file not found" | Missing config file | Create `send-email-token.json` in Config folder |
| "Email config is null" | Invalid JSON format | Validate JSON syntax |
| "Failed to send email. Status: 401" | Invalid token | Update token in config file |
| "Failed to send email. Status: 400" | Invalid request format | Check all required fields are present |

## Testing

### Development Mode
In development, you can test the email flow:
1. The verification code is returned in the API response (devCode field)
2. Logs show email content that would be sent
3. No actual emails sent in dev mode (optional)

### Production Mode
In production:
1. Actual emails sent via API
2. devCode field not included in responses
3. Full logging for audit trail

## Migration from SMTP

The system previously used SMTP for email. The new API-based approach offers:

### Advantages
- **No SMTP configuration needed** (no host, port, username, password)
- **Centralized email service** (shared infrastructure)
- **Better reliability** (managed service)
- **Easier template management** (JSON config files)
- **No code changes for template updates**

### Changes Made
1. Removed SMTP settings from `appsettings.json`
2. Updated `EmailService` to use HttpClient instead of SmtpClient
3. Created config files for email templates
4. Added token-based authentication

## Support

For issues or questions about email configuration:
1. Check logs in `Logs/` directory
2. Verify all config files are present and valid
3. Contact IT support for API token issues
4. Review this documentation for troubleshooting steps

