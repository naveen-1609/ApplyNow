# Quick Email Test - Working Endpoints

## ✅ **Use These Working Endpoints**

Since the new endpoints might need a server restart, use these **existing endpoints** that should already work:

### **1. Test SendGrid API Key (Use Existing Test Endpoint)**

**Option A: Use the existing test endpoint with force=true**
```
GET /api/notifications/test?email=naveenvenkat58@gmail.com&type=both&force=true
```

**Option B: Check if SendGrid is configured**
The test endpoint will show SendGrid errors if the API key is wrong.

### **2. Manually Trigger Emails (Use Existing Test Endpoint)**

```
GET /api/notifications/test?email=naveenvenkat58@gmail.com&type=both&force=true
```

This will:
- ✅ Send both reminder and summary emails immediately
- ✅ Show detailed results
- ✅ Work even if times don't match (because of `force=true`)

### **3. Check Your Schedule**

```
GET /api/notifications/check-schedule?email=naveenvenkat58@gmail.com
```

---

## 🔧 **If Getting 404 - Try These Steps**

### **Step 1: Restart Your Dev Server**

If running locally:
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### **Step 2: Use Existing Endpoints**

The `/api/notifications/test` endpoint already exists and should work:

**In Browser:**
```
http://localhost:9002/api/notifications/test?email=naveenvenkat58@gmail.com&type=both&force=true
```

**Or on Production:**
```
https://appconsole.tech/api/notifications/test?email=naveenvenkat58@gmail.com&type=both&force=true
```

### **Step 3: Check SendGrid API Key**

The test endpoint will automatically check SendGrid. Look for these in the response:

**✅ If API Key is Working:**
```json
{
  "reminder": { "sent": true },
  "summary": { "sent": true }
}
```

**❌ If API Key is Missing:**
```json
{
  "reminder": { "sent": false, "error": "..." },
  "summary": { "sent": false, "error": "..." }
}
```

---

## 🚀 **Quick Test Commands**

### **Test 1: Check SendGrid (via test endpoint)**
```
GET /api/notifications/test?email=naveenvenkat58@gmail.com&type=reminder&force=true
```

### **Test 2: Send Both Emails**
```
GET /api/notifications/test?email=naveenvenkat58@gmail.com&type=both&force=true
```

### **Test 3: Check Schedule**
```
GET /api/notifications/check-schedule?email=naveenvenkat58@gmail.com
```

---

## 📝 **What Each Endpoint Does**

### `/api/notifications/test`
- ✅ **Already exists** - Should work immediately
- Sends test emails
- Shows SendGrid errors if any
- Use `force=true` to bypass time checks

### `/api/notifications/check-schedule`
- ✅ **Already exists** - Should work immediately
- Shows your current schedule
- Shows when emails will trigger
- Shows current UTC time

### `/api/notifications/test-sendgrid` (NEW)
- ⚠️ **New endpoint** - May need server restart
- Specifically tests SendGrid API key
- Sends a test email

### `/api/notifications/trigger` (NEW)
- ⚠️ **New endpoint** - May need server restart
- Manually triggers emails
- Simpler than test endpoint

---

## 🎯 **Recommended: Use Existing Test Endpoint**

**Right now, use this (it already exists):**

```
https://appconsole.tech/api/notifications/test?email=naveenvenkat58@gmail.com&type=both&force=true
```

This will:
1. ✅ Send both emails immediately
2. ✅ Show if SendGrid is working
3. ✅ Show any errors
4. ✅ Work without server restart

---

## 🔍 **If Still Getting 404**

1. **Check you're using the correct URL:**
   - Local: `http://localhost:9002/api/notifications/test?...`
   - Production: `https://appconsole.tech/api/notifications/test?...`

2. **Check the endpoint exists:**
   - File: `src/app/api/notifications/test/route.ts`
   - Should have `export async function GET`

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

4. **Check browser console** for any errors

5. **Try the check-schedule endpoint first** (simpler):
   ```
   /api/notifications/check-schedule?email=naveenvenkat58@gmail.com
   ```

