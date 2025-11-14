# Notification System - Complete Explanation

## 🏗️ **System Architecture**

### **Overview**
The notification system sends daily reminder and summary emails to users using **SendGrid** as the email service provider. It runs on **Vercel Cron Jobs** that execute every minute to check if it's time to send emails to each user.

---

## 📧 **How Email Notifications Work**

### **1. Email Service Provider: SendGrid**

**What is SendGrid?**
- A cloud-based email delivery service
- Handles email sending, delivery tracking, and bounce management
- Used by thousands of applications for transactional emails

**Configuration:**
- **API Key**: Stored in `SENDGRID_API_KEY` environment variable
- **From Email**: `info@appconsole.tech` (your domain)
- **Service**: `@sendgrid/mail` npm package

**Files:**
- `src/lib/services/email.ts` - Email service functions
- `src/app/api/cron/notifications/route.ts` - Cron job that sends emails

---

### **2. Scheduling System**

**How Times Are Stored:**
- Each user has a `schedule` document in Firestore `schedules` collection
- Fields:
  - `reminder_time`: "HH:mm" format (e.g., "09:00")
  - `summary_time`: "HH:mm" format (e.g., "21:00")
  - `email_enabled`: boolean
  - `reminder_email_template`: Custom template text
  - `summary_email_template`: Custom template text

**Where Times Come From:**
- User sets times in **Settings → Notifications** page
- Times are stored in UTC (important!)
- Times are in 24-hour format (HH:mm)

**Files:**
- `src/lib/services/schedules-server.ts` - Server-side schedule management
- `src/components/settings/notifications-form.tsx` - UI for setting times

---

### **3. Cron Job System**

**What is a Cron Job?**
- A scheduled task that runs automatically at specified intervals
- In our case, runs **every minute** to check if it's time to send emails

**Configuration:**
- **File**: `vercel.json`
- **Schedule**: `* * * * *` (every minute)
- **Endpoint**: `/api/cron/notifications`

**How It Works:**
1. Vercel triggers the cron job every minute
2. Cron job gets current UTC time (e.g., "14:30")
3. Fetches all users with `email_enabled = true`
4. For each user:
   - Compares current time with their `reminder_time`
   - Compares current time with their `summary_time`
   - If times match → sends email
   - If times don't match → skips

**Example Flow:**
```
14:00 UTC → Cron runs
  → Checks user with reminder_time = "14:00"
  → ✅ MATCH → Sends reminder email
  
14:01 UTC → Cron runs
  → Checks user with reminder_time = "14:00"
  → ❌ No match → Skips
```

**Files:**
- `vercel.json` - Cron configuration
- `src/app/api/cron/notifications/route.ts` - Cron handler

---

### **4. Email Content Generation**

**Template Variables:**
- `{{daily_target}}` - User's daily application target
- `{{applications_today}}` - Number of applications submitted today
- `{{progress_percentage}}` - Percentage of target completed
- `{{motivational_message}}` - Auto-generated motivational message

**How Content is Generated:**
1. Fetch user's applications for today from `job_applications` collection
2. Count applications submitted today
3. Calculate progress percentage
4. Generate motivational message based on progress
5. Replace template variables in email template
6. Convert to HTML format
7. Send via SendGrid

**Files:**
- `src/app/api/cron/notifications/route.ts` - Email generation functions
  - `getApplicationsToday()` - Fetches today's applications
  - `generateMotivationalMessage()` - Creates motivational text
  - `replaceTemplateVariables()` - Replaces {{variables}}
  - `sendReminderEmail()` - Sends reminder
  - `sendSummaryEmail()` - Sends summary

---

## 🔍 **Quick SendGrid API Key Test**

### **Test Endpoint:**
```
GET /api/notifications/test-sendgrid?email=your@email.com
```

**What It Does:**
1. ✅ Checks if `SENDGRID_API_KEY` is set
2. ✅ Validates API key format (should start with "SG.")
3. ✅ Attempts to send a test email
4. ✅ Returns detailed status report

**Usage:**
Open in browser:
```
https://appconsole.tech/api/notifications/test-sendgrid?email=naveenvenkat58@gmail.com
```

**Response Examples:**

**✅ Success:**
```json
{
  "success": true,
  "message": "✅ Test email sent successfully to naveenvenkat58@gmail.com",
  "check": {
    "apiKeyExists": true,
    "apiKeyLength": 69,
    "isValidFormat": true,
    "sendGridConnected": true,
    "emailSent": true
  }
}
```

**❌ API Key Missing:**
```json
{
  "success": false,
  "error": "SENDGRID_API_KEY is not set in environment variables",
  "fix": "Set SENDGRID_API_KEY in your environment variables"
}
```

**❌ Domain Not Verified:**
```json
{
  "success": false,
  "error": "The from address does not match a verified Sender Identity",
  "fix": [
    "Go to SendGrid Dashboard → Settings → Sender Authentication",
    "Authenticate your domain: appconsole.tech"
  ]
}
```

---

## 🔧 **Complete System Flow**

### **Daily Email Flow:**

```
1. User Sets Schedule
   └─> Settings → Notifications
       └─> Sets reminder_time = "09:00"
       └─> Sets summary_time = "21:00"
       └─> Saves to Firestore 'schedules' collection

2. Cron Job Runs (Every Minute)
   └─> Vercel triggers /api/cron/notifications
       └─> Gets current UTC time (e.g., "09:00")
       └─> Fetches all users with email_enabled = true
       └─> For each user:
           ├─> Checks if reminder_time === current time
           │   └─> If match → Send reminder email
           └─> Checks if summary_time === current time
               └─> If match → Send summary email

3. Email Generation
   └─> Fetch today's applications from 'job_applications'
   └─> Get user's target from 'targets' collection
   └─> Calculate progress
   └─> Generate email content with template variables
   └─> Send via SendGrid API

4. Email Delivery
   └─> SendGrid receives email
   └─> Validates sender (appconsole.tech)
   └─> Delivers to user's inbox
```

---

## 🐛 **Troubleshooting Guide**

### **Issue 1: No Emails Received**

**Check 1: SendGrid API Key**
```
GET /api/notifications/test-sendgrid?email=your@email.com
```
- If fails → API key is missing or invalid
- Fix: Set `SENDGRID_API_KEY` in Vercel environment variables

**Check 2: Email Enabled?**
```
GET /api/notifications/check-schedule?email=your@email.com
```
- Check `emailEnabled: true`
- Fix: Enable in Settings → Notifications

**Check 3: Schedule Configured?**
```
GET /api/notifications/check-schedule?email=your@email.com
```
- Check `hasSchedule: true`
- Fix: Set reminder_time and summary_time in Settings

**Check 4: Target Set?**
```
GET /api/notifications/check-schedule?email=your@email.com
```
- Check `hasTarget: true`
- Fix: Set daily target in Targets page

**Check 5: Time Match?**
- Times are in UTC!
- If you set 9:00 AM EST, that's 2:00 PM UTC (14:00)
- Fix: Convert your local time to UTC

**Check 6: Cron Running?**
- Go to Vercel Dashboard → Logs
- Look for cron executions every minute
- Check for errors

---

### **Issue 2: SendGrid Errors**

**Error: "Sender Identity not verified"**
- **Fix**: Authenticate domain in SendGrid Dashboard
- Go to: Settings → Sender Authentication → Domain Authentication
- Add DNS records for `appconsole.tech`
- Wait for verification (up to 48 hours)

**Error: "API key invalid"**
- **Fix**: Regenerate API key in SendGrid Dashboard
- Update `SENDGRID_API_KEY` in Vercel

**Error: "Permission denied"**
- **Fix**: Check API key has "Mail Send" permission
- Regenerate if needed

---

## 📋 **Quick Diagnostic Checklist**

Run these checks in order:

1. **Test SendGrid API Key:**
   ```
   GET /api/notifications/test-sendgrid?email=your@email.com
   ```

2. **Check Your Schedule:**
   ```
   GET /api/notifications/check-schedule?email=your@email.com
   ```

3. **Manually Trigger Email:**
   ```
   GET /api/notifications/trigger?email=your@email.com&type=both
   ```

4. **Check Vercel Logs:**
   - Look for cron executions
   - Check for error messages
   - Verify times are matching

---

## 🎯 **Key Points to Remember**

1. **Times are in UTC** - Convert your local time to UTC when setting schedules
2. **Cron runs every minute** - Checks all users each minute
3. **Time must match exactly** - "09:00" only triggers at exactly 09:00 UTC
4. **SendGrid requires domain verification** - Must authenticate `appconsole.tech`
5. **Need target set** - Daily target must exist for today
6. **Email must be enabled** - `email_enabled = true` in schedule

---

## 📞 **Quick Test Commands**

```bash
# Test SendGrid API key
curl "https://appconsole.tech/api/notifications/test-sendgrid?email=naveenvenkat58@gmail.com"

# Check your schedule
curl "https://appconsole.tech/api/notifications/check-schedule?email=naveenvenkat58@gmail.com"

# Manually trigger emails
curl "https://appconsole.tech/api/notifications/trigger?email=naveenvenkat58@gmail.com&type=both"
```

Or open these URLs directly in your browser!

