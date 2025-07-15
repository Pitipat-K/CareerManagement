# Assessment Notification System

## Overview

The notification system automatically sends email notifications to managers when employees complete their self-assessments. This ensures managers are promptly notified to review and complete their manager assessments.

## How It Works

1. **Trigger**: When an employee completes their self-assessment, the frontend calls the `PUT /api/AssessmentCycles/{id}/complete-self` endpoint.

2. **Notification Process**: 
   - The assessment cycle is updated to "Manager_Notified" status
   - The manager assessment is activated to "In Progress" status
   - A notification is sent to the manager's email address (fire and forget)

3. **Email Content**: The notification includes:
   - Employee name and position
   - Department and assessment period
   - Completion date and due date (7 days from completion)
   - Assessment statistics (total competencies, average score, competencies needing attention)
   - Action items for the manager

## Configuration Files

### 1. `Config/send-email-token.json`
Contains the email service authentication details:
```json
{
  "emailConfig": {
    "token": "your-api-token-here",
    "FromAlias": "Career Management System"
  }
}
```

### 2. `Config/assessment-notification-config.json`
Contains the email template and subject:
```json
{
  "emailConfig": {
    "subject": "Manager Assessment Required: [Employee Name] Self-Assessment Complete",
    "body": "HTML email template with placeholders...",
    "isHTML": true
  }
}
```

## Email Template Placeholders

The email template supports the following placeholders that are automatically replaced:

- `[Employee Name]` - Employee's full name
- `[Manager Name]` - Manager's name (currently set to "Manager")
- `[Position Title]` - Employee's position title
- `[Department Name]` - Employee's department name
- `[Assessment Period]` - Assessment period (e.g., "Q1 2025")
- `[Completion Date]` - Date when self-assessment was completed
- `[Due Date]` - Due date for manager assessment (7 days from completion)
- `[Number]` - Total number of competencies assessed
- `[Average Score]` - Average competency score
- `[Count]` - Number of competencies needing attention
- `[Assessment System Link]` - Link to the assessment system (configure as needed)
- `[Company Name]` - Company name (configure as needed)

## API Endpoint

The notification is triggered by the existing endpoint:
```
PUT /api/AssessmentCycles/{id}/complete-self
```

This endpoint:
1. Updates the assessment cycle status
2. Activates the manager assessment
3. Sends the notification email to the manager

## Error Handling

- If the manager's email is not found or is empty, the notification is skipped
- If the email service fails, the error is logged but doesn't prevent the assessment completion
- All notification errors are handled gracefully to ensure the assessment process continues

## Testing

To test the notification system:

1. Ensure the configuration files are properly set up
2. Complete a self-assessment through the frontend
3. Check the console logs for notification status
4. Verify the manager receives the email notification

## Customization

To customize the notification:

1. **Email Template**: Modify the HTML template in `assessment-notification-config.json`
2. **Due Date**: Change the calculation in `NotificationService.PrepareEmailBody()`
3. **Company Information**: Update the placeholders in the email template
4. **Assessment System URL**: Replace the placeholder with your actual system URL

## Dependencies

The notification system requires:
- `HttpClient` for making API calls
- `System.Text.Json` for JSON serialization
- Access to the email service API at `https://altsmart.alliancels.net/api/SendMail` 