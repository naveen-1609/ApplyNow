# 🚀 Quick Email Test - Start Here!

## ✅ **Use This Working Endpoint (Already Exists)**

The `/api/notifications/test` endpoint already exists and works. Use this:

### **Send Both Emails Immediately:**
```
https://appconsole.tech/api/notifications/test?email=naveenvenkat58@gmail.com&type=both&force=true
```

Or if running locally:
```
http://localhost:9002/api/notifications/test?email=naveenvenkat58@gmail.com&type=both&force=true
```

---

## 🔍 **What This Endpoint Does**

1. ✅ Finds your user by email
2. ✅ Checks your schedule and target
3. ✅ Sends reminder email immediately
4. ✅ Sends summary email immediately
5. ✅ Returns detailed status (shows if SendGrid is working)

---

## 📊 **Understanding the Response**

### **✅ Success Response:**
```json
{
  "success": true,
  "summary": {
    "remindersSent": 1,
    "summariesSent": 1
  },
  "results": [{
    "email": "naveenvenkat58@gmail.com",
    "reminder": { "sent": true },
    "summary": { "sent": true }
  }]
}
```

### **❌ SendGrid Error Response:**
```json
{
  "results": [{
    "email": "naveenvenkat58@gmail.com",
    "reminder": { 
      "sent": false, 
      "error": "The from address does not match a verified Sender Identity"
    }
  }]
}
```

---

## 🎯 **Quick Diagnostic Steps**

### **Step 1: Test Email Sending**
Open in browser:
```
/api/notifications/test?email=naveenvenkat58@gmail.com&type=both&force=true
```

**Check the response:**
- If `"sent": true` → ✅ SendGrid is working!
- If `"sent": false` → Check the error message

### **Step 2: Check Your Schedule**
Open in browser:
```
/api/notifications/check-schedule?email=naveenvenkat58@gmail.com
```

**This shows:**
- Your reminder_time and summary_time
- Whether email is enabled
- Current UTC time
- When emails will trigger next

### **Step 3: Check SendGrid API Key**

The test endpoint will automatically show SendGrid errors. Common errors:

**Error: "Sender Identity not verified"**
- **Fix**: Authenticate domain in SendGrid Dashboard
- Go to: SendGrid → Settings → Sender Authentication
- Authenticate: `appconsole.tech`

**Error: "API key invalid"**
- **Fix**: Check `SENDGRID_API_KEY` in Vercel environment variables
- Should start with `SG.`
- Regenerate in SendGrid if needed

**Error: "Permission denied"**
- **Fix**: Check API key has "Mail Send" permission

---

## 🔧 **How Notification System Works (Brief)**

### **1. Email Service: SendGrid**
- **Service**: SendGrid API
- **API Key**: `SENDGRID_API_KEY` environment variable
- **From**: `info@appconsole.tech`

### **2. Scheduling**
- Times stored in Firestore `schedules` collection
- Each user has: `reminder_time`, `summary_time`, `email_enabled`
- Set in: Settings → Notifications

### **3. Cron Job**
- Runs **every minute** on Vercel
- Checks all users with `email_enabled = true`
- Compares current UTC time with user's times
- Sends email if times match exactly

### **4. Email Generation**
- Fetches today's applications
- Gets user's target
- Calculates progress
- Replaces template variables
- Sends via SendGrid

---

## ⚠️ **Important Notes**

1. **Times are in UTC** - Not your local timezone!
   - If you want 9 AM EST → Set 14:00 UTC (EST is UTC-5)

2. **Time must match exactly** - "09:00" only triggers at exactly 09:00 UTC

3. **Need target for today** - Set daily target in Targets page

4. **Email must be enabled** - Enable in Settings → Notifications

---

## 🐛 **Troubleshooting**

### **No Emails Received?**

1. **Test immediately:**
   ```
   /api/notifications/test?email=your@email.com&type=both&force=true
   ```

2. **Check response for errors:**
   - Look for `"error"` in the response
   - Check SendGrid error messages

3. **Verify settings:**
   ```
   /api/notifications/check-schedule?email=your@email.com
   ```

4. **Check Vercel logs:**
   - Go to Vercel Dashboard → Logs
   - Look for cron executions
   - Check for error messages

---

## 📞 **Quick Commands**

**Test Email Sending:**
```
GET /api/notifications/test?email=naveenvenkat58@gmail.com&type=both&force=true
```

**Check Schedule:**
```
GET /api/notifications/check-schedule?email=naveenvenkat58@gmail.com
```

**Send Reminder Only:**
```
GET /api/notifications/test?email=naveenvenkat58@gmail.com&type=reminder&force=true
```

**Send Summary Only:**
```
GET /api/notifications/test?email=naveenvenkat58@gmail.com&type=summary&force=true
```

---

**Start with the test endpoint above - it will show you exactly what's wrong!**

