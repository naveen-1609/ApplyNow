# Vercel Cron Jobs Implementation

## Overview

Instead of running a continuous scheduler, we're now using [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) to trigger email notifications at specific times. This is much more efficient and cost-effective.

## How It Works

1. **Cron Job Configuration**: The `vercel.json` file defines two separate cron jobs:
   - **Reminder emails**: Daily at 7:00 AM UTC (`0 7 * * *`)
   - **Summary emails**: Daily at 8:00 PM UTC (`0 20 * * *`)
2. **Cron Endpoint**: `/api/cron/notifications` handles the email sending logic with SendGrid
3. **Email Type Parameter**: Uses `?type=reminder` or `?type=summary` to specify which emails to send
4. **User Settings**: Fetches user settings from the database to get email templates and targets

## Files Created/Modified

### 1. `vercel.json` - Cron Job Configuration
```json
{
  "crons": [
    {
      "path": "/api/cron/notifications?type=reminder",
      "schedule": "0 7 * * *"
    },
    {
      "path": "/api/cron/notifications?type=summary", 
      "schedule": "0 20 * * *"
    }
  ]
}
```

**Schedule Explanation**: 
- `0 7 * * *` - Daily at 7:00 AM UTC (reminder emails)
- `0 20 * * *` - Daily at 8:00 PM UTC (summary emails)

### 2. `src/app/api/cron/notifications/route.ts` - Main Cron Endpoint
- Verifies the request comes from Vercel cron (user-agent: `vercel-cron/1.0`)
- Uses SendGrid API for email sending (same as api-scheduler.js)
- Handles email type parameter (`?type=reminder` or `?type=summary`)
- Fetches user settings and sends appropriate emails

### 3. `src/app/api/cron/test/route.ts` - Test Endpoint
- Allows manual testing of the cron job
- Supports testing specific email types: `?type=reminder` or `?type=summary`
- Simulates Vercel cron user agent
- Useful for debugging and testing

## Environment Variables Required

Set these in your Vercel dashboard:

### Required:
- `USER_ID` - Your Firebase user ID
- `SENDGRID_API_KEY` - Your SendGrid API key

### Optional (with defaults):
- `USER_EMAIL` - Your email address
- `REMINDER_TIME` - Reminder time (defaults to 07:55)
- `SUMMARY_TIME` - Summary time (defaults to 20:01)
- `DAILY_TARGET` - Daily target (defaults to 5)

## How to Find Your User ID

1. Open your app in browser
2. Press F12 → Console tab
3. Type: `firebase.auth().currentUser.uid`
4. Copy the result
5. Set as `USER_ID` environment variable in Vercel

## Testing

### 1. Manual Test
- **Test all emails**: `https://your-app.vercel.app/api/cron/test`
- **Test reminder only**: `https://your-app.vercel.app/api/cron/test?type=reminder`
- **Test summary only**: `https://your-app.vercel.app/api/cron/test?type=summary`

This will trigger the cron job manually and show you the results.

### 2. Check Logs
In Vercel dashboard → Functions → View Function Logs to see cron job execution.

### 3. Set Test Times
To test immediately:
1. Go to your app's Settings → Notifications
2. Set reminder time to 07:00 and summary time to 20:00 (UTC)
3. Wait for the next scheduled cron job (daily at 7 AM or 8 PM UTC)
4. Check your email

**Note**: Cron jobs run in UTC timezone. Adjust your times accordingly.

## Cron Schedule Options

You can modify the schedule in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/notifications?type=reminder",
      "schedule": "0 7 * * *"  // Daily at 7 AM UTC
    },
    {
      "path": "/api/cron/notifications?type=summary", 
      "schedule": "0 20 * * *"  // Daily at 8 PM UTC
    }
  ]
}
```

Common schedules:
- `0 7 * * *` - Daily at 7:00 AM UTC (morning reminder)
- `0 20 * * *` - Daily at 8:00 PM UTC (evening summary)
- `0 9 * * *` - Daily at 9:00 AM UTC
- `0 18 * * *` - Daily at 6:00 PM UTC
- `*/5 * * * *` - Every 5 minutes (for testing only)

## Benefits of This Approach

1. **Cost Effective**: No continuous server running
2. **Reliable**: Vercel handles the scheduling
3. **Scalable**: Can handle multiple users easily
4. **Maintainable**: All logic in one endpoint
5. **Testable**: Easy to test manually

## Migration from Continuous Scheduler

The old `api-scheduler.js` file is no longer needed. You can:
1. Remove the separate Render service
2. Delete the `api-scheduler.js` file
3. All email logic is now in the cron endpoint

## Monitoring

- Check Vercel Function logs for cron job execution
- Monitor email delivery through SendGrid dashboard
- Use the test endpoint to verify functionality

## Troubleshooting

### Cron Job Not Running
1. Check `vercel.json` syntax
2. Verify the endpoint path is correct
3. Check Vercel Function logs

### Emails Not Sending
1. Verify `SENDGRID_API_KEY` is set
2. Check `USER_ID` is correct
3. Ensure email notifications are enabled in user settings
4. Check SendGrid logs for delivery issues

### Wrong Timing
1. Verify user's reminder/summary times in database
2. Check timezone (Vercel cron runs in UTC)
3. Adjust times accordingly
