# Dynamic Email Scheduler Setup Guide

## 🎯 What This Fixes

The `api-scheduler.js` now connects to your Application Console API to get real-time settings instead of using hardcoded values. When you change your email times or templates in the app, the scheduler will automatically pick up those changes!

## 🚀 Quick Setup

### Step 1: Get Your User ID

1. Open your Application Console app in browser: http://localhost:9002
2. Log in to your account
3. Open Developer Tools (F12)
4. Go to Console tab
5. Type this command and press Enter:
   ```javascript
   console.log(firebase.auth().currentUser?.uid)
   ```
6. Copy the user ID that appears (it will look like: `abc123def456ghi789`)

### Step 2: Update the Scheduler

1. Open `api-scheduler.js` in your editor
2. Find line 180: `const userId = 'current-user';`
3. Replace `'current-user'` with your actual user ID:
   ```javascript
   const userId = 'your-actual-user-id-here';
   ```

### Step 3: Test the Connection

1. Make sure your Application Console app is running: `npm run dev`
2. Run the test script: `node test-api-connection.js`
3. If successful, start the scheduler: `node api-scheduler.js`

## 🔄 How It Works Now

### Before (Hardcoded)
- ❌ Scheduler used fixed times: 07:55, 20:01
- ❌ Templates were hardcoded in the scheduler file
- ❌ You had to manually edit the scheduler file to change settings

### After (Dynamic)
- ✅ Scheduler reads your actual settings from the app
- ✅ When you change times in Settings → Notifications, scheduler picks them up
- ✅ When you customize email templates, scheduler uses them
- ✅ No more manual editing of scheduler files!

## 📧 Email Flow

1. **You change settings** in Application Console → Settings → Notifications
2. **Settings are saved** to Firebase (schedules collection)
3. **Scheduler checks every minute** by calling the API
4. **API returns your current settings** from Firebase
5. **Emails are sent** at your configured times with your custom templates

## 🛠️ API Endpoints

The scheduler now uses these new API endpoints:

- `GET /api/scheduler/settings?userId=<your-user-id>` - Gets your current settings
- `POST /api/scheduler/settings` - Shows available endpoints

## 🧪 Testing

### Test API Connection
```bash
node test-api-connection.js
```

### Test Scheduler
```bash
node api-scheduler.js
```

### Manual Email Test
You can still manually trigger emails for testing:
```bash
curl -X POST http://localhost:9002/api/scheduler/trigger \
  -H "Content-Type: application/json" \
  -d '{"userId":"your-user-id","type":"reminder"}'
```

## 🔧 Troubleshooting

### "API request failed"
- Make sure your Application Console app is running on http://localhost:9002
- Check that you're using the correct user ID

### "User not found"
- Verify your user ID is correct
- Make sure you're logged into the app

### "Settings not updating"
- The scheduler checks every minute, so changes may take up to 1 minute to take effect
- Check the console output to see if it's fetching your latest settings

### Emails not sending
- Check that email notifications are enabled in Settings → Notifications
- Verify your SendGrid API key is configured
- Check that your domain is authenticated in SendGrid

## 📝 Console Output

When working correctly, you should see:
```
📡 Fetching settings from Application Console API for user: your-user-id
✅ Successfully fetched settings from Application Console
📧 Email: your-email@example.com
🌅 Reminder time: 07:55
🌙 Summary time: 20:01
🎯 Daily target: 5
📧 Email enabled: true
```

## 🎉 Benefits

- **Real-time updates**: Change settings in the app, scheduler picks them up automatically
- **No manual editing**: No more editing scheduler files
- **Custom templates**: Use your personalized email templates
- **Accurate times**: Scheduler uses your exact configured times
- **Fallback safety**: If API fails, falls back to mock data with helpful error messages

## 🔄 Next Steps

1. Get your user ID and update the scheduler
2. Test the connection
3. Change your email times in the app
4. Watch the scheduler console to see it pick up your changes
5. Set up a cron job or keep the scheduler running for production use

The scheduler is now truly dynamic and will automatically adapt to your settings changes! 🚀
