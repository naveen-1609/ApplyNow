# Notifications Test Endpoint

## ✅ Test Endpoint Created

A new test endpoint has been created at `/api/notifications/test` to allow manual testing of email notifications.

## 📋 Usage

### **Test All Users**
```bash
GET /api/notifications/test?type=both&force=true
```

### **Test Specific User**
```bash
GET /api/notifications/test?userId=USER_ID&type=reminder&force=true
```

### **Test Reminder Only**
```bash
GET /api/notifications/test?type=reminder&force=true
```

### **Test Summary Only**
```bash
GET /api/notifications/test?type=summary&force=true
```

## 🔧 Query Parameters

- **`userId`** (optional): Specific user ID to test. If not provided, tests all users.
- **`type`** (optional): Email type to test
  - `reminder` - Test reminder emails only
  - `summary` - Test summary emails only
  - `both` - Test both (default)
- **`force`** (optional): Set to `true` to send emails regardless of scheduled time matching

## 📊 Response Format

```json
{
  "success": true,
  "message": "Test completed",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "currentTime": "12:00",
  "summary": {
    "total": 2,
    "remindersSent": 1,
    "summariesSent": 1,
    "remindersFailed": 0,
    "summariesFailed": 0
  },
  "results": [
    {
      "userId": "abc123",
      "email": "user@example.com",
      "schedule": {
        "reminder_time": "07:00",
        "summary_time": "22:00",
        "email_enabled": true
      },
      "target": {
        "daily_target": 5
      },
      "reminder": {
        "sent": true
      },
      "summary": {
        "sent": true
      }
    }
  ],
  "instructions": {
    "testSingleUser": "/api/notifications/test?userId=USER_ID&type=reminder&force=true",
    "testAllUsers": "/api/notifications/test?type=both&force=true",
    "testReminderOnly": "/api/notifications/test?type=reminder&force=true",
    "testSummaryOnly": "/api/notifications/test?type=summary&force=true"
  }
}
```

## 🔍 What It Does

1. **Fetches Users**: Gets all users from Firestore (or specific user if `userId` provided)
2. **Gets Schedule**: Fetches schedule from `schedules` collection
3. **Gets Target**: Fetches today's target from `targets` collection
4. **Validates**: Checks if email is enabled and target exists
5. **Sends Emails**: Sends reminder/summary emails based on parameters
6. **Returns Results**: Detailed results for each user

## ⚠️ Important Notes

- **No Authentication**: This endpoint doesn't require authentication (for testing purposes)
- **Force Parameter**: Use `force=true` to send emails immediately, bypassing time matching
- **Real Emails**: This sends real emails via SendGrid (make sure API key is set)
- **Error Handling**: Errors are captured and returned in the response

## 🧪 Testing Scenarios

### **1. Test Single User Reminder**
```
GET /api/notifications/test?userId=YOUR_USER_ID&type=reminder&force=true
```

### **2. Test All Users (Both Types)**
```
GET /api/notifications/test?type=both&force=true
```

### **3. Test Without Force (Time Matching)**
```
GET /api/notifications/test?type=reminder
```
(Only sends if current time matches scheduled time)

## 📝 Example Response for Errors

```json
{
  "userId": "abc123",
  "email": "user@example.com",
  "schedule": null,
  "target": null,
  "reminder": {
    "sent": false,
    "error": "Email notifications not enabled"
  },
  "summary": {
    "sent": false,
    "error": "Email notifications not enabled"
  }
}
```

## ✅ Fixed Issues

1. **Real Data Fetching**: All functions now fetch from separate `schedules` and `targets` collections
2. **Proper Structure**: Schedule and Target objects include all required fields
3. **Error Handling**: Better error messages and handling
4. **Test Endpoint**: Allows manual testing without waiting for cron jobs

