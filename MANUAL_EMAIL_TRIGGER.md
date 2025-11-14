# Manual Email Trigger Guide

## 🚀 How to Manually Trigger Emails

I've created a new endpoint that allows you to manually trigger reminder and summary emails immediately, without waiting for the scheduled time.

### **Endpoint**: `/api/notifications/trigger`

### **Usage Examples**:

#### 1. **Send Both Reminder and Summary Emails**:
```
GET https://appconsole.tech/api/notifications/trigger?email=naveenvenkat58@gmail.com&type=both
```

#### 2. **Send Only Reminder Email**:
```
GET https://appconsole.tech/api/notifications/trigger?email=naveenvenkat58@gmail.com&type=reminder
```

#### 3. **Send Only Summary Email**:
```
GET https://appconsole.tech/api/notifications/trigger?email=naveenvenkat58@gmail.com&type=summary
```

### **Parameters**:

- **`email`** (required): Your email address
- **`type`** (optional): `'reminder'`, `'summary'`, or `'both'` (default: `'both'`)

### **Response**:

The endpoint returns a JSON response showing:
- Whether emails were sent successfully
- Any errors that occurred
- Your current schedule settings
- Your target information

**Example Success Response**:
```json
{
  "success": true,
  "message": "Email(s) sent successfully to naveenvenkat58@gmail.com",
  "timestamp": "2024-01-15T14:30:00.000Z",
  "email": "naveenvenkat58@gmail.com",
  "type": "both",
  "results": {
    "reminder": { "sent": true },
    "summary": { "sent": true }
  },
  "schedule": {
    "reminder_time": "14:00",
    "summary_time": "22:00",
    "email_enabled": true
  },
  "target": {
    "daily_target": 5,
    "applications_done": 2
  }
}
```

### **Quick Test**:

1. **Open your browser** and go to:
   ```
   https://appconsole.tech/api/notifications/trigger?email=naveenvenkat58@gmail.com&type=both
   ```

2. **Check your email** - You should receive both emails immediately!

3. **Check the response** - The JSON response will tell you if emails were sent successfully

### **Requirements**:

For the trigger to work, you need:
- ✅ Email notifications enabled in Settings
- ✅ A schedule configured (reminder_time and summary_time)
- ✅ A daily target set for today
- ✅ SendGrid API key configured

### **Alternative: Use Test Endpoint**

You can also use the existing test endpoint with `force=true`:

```
GET /api/notifications/test?email=naveenvenkat58@gmail.com&type=both&force=true
```

### **Troubleshooting**:

If emails don't send, check the response for error messages:

- **"User not found"**: Email address doesn't exist in database
- **"No schedule found"**: Go to Settings → Notifications and save your schedule
- **"Email notifications not enabled"**: Enable email notifications in Settings
- **"No target found for today"**: Set a daily target in the Targets page
- **"SendGrid API key not configured"**: Set `SENDGRID_API_KEY` environment variable

### **What Happens**:

1. The endpoint finds your user by email
2. Checks your schedule and target settings
3. Immediately sends the email(s) you requested
4. Returns a status report

**Note**: This bypasses the scheduled time check - emails are sent immediately regardless of your configured times.

