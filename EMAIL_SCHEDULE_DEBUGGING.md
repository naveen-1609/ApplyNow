# Email Schedule Debugging Guide

## 🔍 How to Check Your Email Schedule

### Method 1: Use the Diagnostic Endpoint

Visit this URL in your browser (replace with your email or userId):
```
https://appconsole.tech/api/notifications/check-schedule?email=naveenvenkat58@gmail.com
```

Or with userId:
```
https://appconsole.tech/api/notifications/check-schedule?userId=YOUR_USER_ID
```

This will show you:
- Your current reminder_time and summary_time
- Whether email is enabled
- Current UTC time
- Next email trigger times
- Whether emails will trigger right now

### Method 2: Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → Logs
2. Look for cron job executions
3. Search for your email address
4. Check the logs for:
   - `👤 Checking user` - Shows your times
   - `📧 Sending` - Shows when emails are sent
   - `✅ Email sent` - Confirms successful send

## ⚠️ Important: Timezone Issue

**The cron job runs in UTC timezone!**

If you set your reminder time as `09:00` in your local timezone (e.g., EST), but you're actually in UTC+5, then:
- Your local 9:00 AM = UTC 2:00 PM
- The cron will trigger at UTC 09:00, which is your local 4:00 AM

### How to Fix:

1. **Convert your local time to UTC:**
   - If you want emails at 9:00 AM EST (UTC-5):
     - 9:00 AM EST = 2:00 PM UTC (14:00)
   - If you want emails at 9:00 PM EST (UTC-5):
     - 9:00 PM EST = 2:00 AM UTC next day (02:00)

2. **Set the times in UTC in your settings:**
   - Go to Settings → Notifications
   - Set reminder_time to UTC time (e.g., `14:00` for 9 AM EST)
   - Set summary_time to UTC time (e.g., `02:00` for 9 PM EST previous day, or `14:00` for 9 PM EST)

## 📋 Current Schedule Check

Based on the code, here's what happens:

1. **Cron runs**: Every minute (`* * * * *`)
2. **Time check**: Compares current UTC time (HH:mm format) with your `reminder_time` and `summary_time`
3. **Email sent**: Only when times match exactly

### Example:
- If your `reminder_time = "14:00"` (2 PM UTC)
- Cron runs at 14:00 UTC → ✅ Match → Email sent
- Cron runs at 14:01 UTC → ❌ No match → No email

## 🐛 Common Issues

### Issue 1: Times are in wrong timezone
**Symptom**: Emails never arrive at expected time
**Fix**: Convert your local time to UTC and update settings

### Issue 2: Email not enabled
**Symptom**: No emails sent
**Fix**: Check Settings → Notifications → Enable email notifications

### Issue 3: No target set
**Symptom**: Cron runs but no emails sent
**Fix**: Set a daily target in Targets page

### Issue 4: Schedule not created
**Symptom**: No schedule found in database
**Fix**: Go to Settings → Notifications and save your schedule

## 🔧 Quick Test

To test if emails are working:

1. **Set a test time 2-3 minutes from now:**
   - Get current UTC time
   - Add 2-3 minutes
   - Update your reminder_time to that time
   - Wait for cron to run
   - Check if email arrives

2. **Use the test endpoint:**
   ```
   /api/notifications/test?email=your@email.com&type=reminder
   ```

## 📊 What the Logs Show

When cron runs, you'll see:
```
🕰️  Cron job triggered at 2024-01-15T14:00:00.000Z (UTC: 14:00)
👤 Checking user naveenvenkat58@gmail.com:
   - Reminder time: 14:00 (✅ MATCH)
   - Summary time: 22:00 (❌ no match)
   - Current UTC time: 14:00
   - Email enabled: true
📧 Sending reminder email to naveenvenkat58@gmail.com at 14:00...
✅ Reminder email sent successfully to naveenvenkat58@gmail.com
```

## 🎯 Next Steps

1. **Check your current schedule:**
   ```
   GET /api/notifications/check-schedule?email=your@email.com
   ```

2. **Verify times are in UTC:**
   - Check what times you have set
   - Convert to UTC if needed
   - Update in Settings

3. **Monitor Vercel logs:**
   - Watch for cron executions
   - Check for your email in logs
   - Verify times match

4. **Test with immediate time:**
   - Set reminder_time to current UTC time + 1 minute
   - Wait and check if email arrives

