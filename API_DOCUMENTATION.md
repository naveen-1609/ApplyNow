# API Documentation

## 📡 API Endpoints

### **Authentication Endpoints**

All authentication is handled client-side via Firebase Auth SDK. No custom API endpoints needed.

---

### **Cron Job Endpoints**

#### **GET `/api/cron/notifications`**
Sends scheduled email notifications (reminder and summary emails).

**Authorization**: Vercel Cron (or `?local=true` for testing)

**Query Parameters**:
- `local=true` - Bypass Vercel cron check for local testing

**Response**:
```json
{
  "success": true,
  "timestamp": "2025-01-14T10:00:00.000Z",
  "usersChecked": 5,
  "emailsSent": {
    "reminders": 2,
    "summaries": 1
  }
}
```

**Schedule**: Runs every minute via Vercel Cron

---

### **Notification Endpoints**

#### **GET `/api/notifications/test-sendgrid`**
Test SendGrid API key and email sending.

**Query Parameters**:
- `email` (optional) - Email address to send test to (default: naveenvenkat58@gmail.com)

**Response**:
```json
{
  "success": true,
  "message": "✅ Test email sent successfully to user@example.com"
}
```

---

#### **GET `/api/notifications/check-schedule`**
Check a user's email schedule and current status.

**Query Parameters**:
- `userId` (optional) - User ID
- `email` (optional) - User email

**Response**:
```json
{
  "user": {
    "id": "userId",
    "email": "user@example.com"
  },
  "schedule": {
    "reminder_time": "09:00",
    "summary_time": "21:00",
    "email_enabled": true
  },
  "currentTime": {
    "utc": "10:00",
    "timeString": "10:00"
  },
  "nextEmails": {
    "reminder": {
      "scheduledTime": "09:00",
      "nextOccurrence": "2025-01-15T09:00:00.000Z",
      "isNow": false
    },
    "summary": {
      "scheduledTime": "21:00",
      "nextOccurrence": "2025-01-14T21:00:00.000Z",
      "isNow": false
    }
  }
}
```

---

#### **GET `/api/notifications/trigger-now`**
Manually trigger reminder and/or summary emails immediately.

**Query Parameters**:
- `email` (required) - User email
- `type` (optional) - `'reminder'`, `'summary'`, or `'both'` (default: `'both'`)

**Response**:
```json
{
  "success": true,
  "message": "Email(s) sent successfully",
  "email": "user@example.com",
  "timestamp": "2025-01-14T10:00:00.000Z",
  "emails": {
    "reminder": {
      "sent": true,
      "message": "Reminder email sent successfully"
    },
    "summary": {
      "sent": true,
      "message": "Summary email sent successfully"
    }
  }
}
```

---

#### **GET `/api/notifications/diagnose`**
Comprehensive diagnostic endpoint for email notification system.

**Query Parameters**:
- `email` (required) - User email to diagnose

**Response**:
```json
{
  "timestamp": "2025-01-14T10:00:00.000Z",
  "checks": {
    "sendGrid": {
      "apiKeyExists": true,
      "apiKeyFormat": true,
      "status": "ok"
    },
    "userDocument": {
      "exists": true,
      "userId": "userId",
      "status": "ok"
    },
    "schedule": {
      "exists": true,
      "emailEnabled": true,
      "status": "ok"
    },
    "target": {
      "exists": true,
      "dailyTarget": 5,
      "status": "ok"
    }
  },
  "status": "ok",
  "issues": [],
  "fixes": []
}
```

---

#### **GET `/api/notifications/setup-complete`**
Perform complete setup for a user (create/update user, schedule, target).

**Query Parameters**:
- `email` (required) - User email
- `userId` (required) - User ID
- `name` (optional) - User name (default: "User")
- `reminderTime` (optional) - Reminder time in "HH:mm" (default: "09:00")
- `summaryTime` (optional) - Summary time in "HH:mm" (default: "21:00")
- `dailyTarget` (optional) - Daily target number (default: 5)

**Response**:
```json
{
  "success": true,
  "message": "Complete setup finished successfully",
  "actions": [
    "✅ Created user document",
    "✅ Created schedule (reminder: 09:00, summary: 21:00)",
    "✅ Created target for today (5 applications)"
  ]
}
```

---

### **Stripe Endpoints**

#### **POST `/api/stripe/webhook`**
Handles Stripe webhook events for payment processing.

**Authorization**: Stripe webhook signature verification

**Events Handled**:
- `checkout.session.completed` - Payment successful
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription cancelled

**Response**: 200 OK (Stripe expects 200 response)

---

#### **POST `/api/stripe/create-checkout-session`**
Creates a Stripe checkout session for subscription purchase.

**Request Body**:
```json
{
  "planId": "PLUS" | "PRO",
  "userId": "user_id",
  "userEmail": "user@example.com"
}
```

**Response**:
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

---

#### **POST `/api/stripe/create-embedded-checkout`**
Creates an embedded Stripe checkout session.

**Request Body**:
```json
{
  "planId": "PLUS" | "PRO",
  "userId": "user_id",
  "userEmail": "user@example.com"
}
```

**Response**:
```json
{
  "clientSecret": "cs_test_...",
  "sessionId": "cs_test_..."
}
```

---

## 🔐 Authentication

### **Client-Side Authentication**
- Uses Firebase Auth SDK
- No custom API endpoints needed
- Protected routes handled by Next.js middleware

### **Server-Side Authentication**
- API routes check `request.auth` from Firebase Admin
- User ID extracted from auth token
- Validated against Firestore user document

---

## 📊 Data Access Patterns

### **Client-Side (Firebase SDK)**
```typescript
// Read operations
const q = query(
  collection(db, 'collection'),
  where('user_id', '==', userId),
  orderBy('created_at', 'desc')
);
const snapshot = await getDocs(q);

// Write operations
await addDoc(collection(db, 'collection'), data);
await updateDoc(doc(db, 'collection', id), data);
await deleteDoc(doc(db, 'collection', id));
```

### **Server-Side (Firebase Admin)**
```typescript
// Read operations
const snapshot = await adminDb
  .collection('collection')
  .where('user_id', '==', userId)
  .get();

// Write operations
await adminDb.collection('collection').add(data);
await adminDb.collection('collection').doc(id).update(data);
await adminDb.collection('collection').doc(id).delete();
```

---

## 🎯 AI Endpoints (Genkit)

### **Client-Side Calls**
AI flows are called directly from client components:

```typescript
import { analyzeResume } from '@/ai/flows/ats-checker-flow';

const result = await analyzeResume({
  jobDescription: "...",
  resumeText: "..."
});
```

**Flows Available**:
- `analyzeResume` - ATS analysis
- `chatWithResumeAssistant` - Chat assistant
- `generateCoverLetter` - Cover letter generation

**Note**: These are server-side Genkit flows, not HTTP endpoints. They're called via Genkit's Next.js integration.

---

## 📝 Error Responses

### **Standard Error Format**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE" // Optional
}
```

### **HTTP Status Codes**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔄 Rate Limiting

### **Vercel Default Limits**
- API Routes: 100 requests/second per route
- Edge Functions: 1000 requests/second
- Cron Jobs: As scheduled

### **Firebase Limits**
- Firestore: 10,000 writes/second (default)
- Storage: 1GB free tier
- Auth: Unlimited

---

## 📚 Additional Endpoints

### **Diagnostic Endpoints** (Development)
- `/api/notifications/verify-save` - Verify schedule data
- `/api/notifications/schedule-status` - Get schedule status
- `/api/notifications/fix-user-email` - Fix user email field
- `/api/notifications/create-or-fix-user` - Create/fix user document

These endpoints are for debugging and should be restricted in production.

---

## 🧪 Testing Endpoints

### **Local Testing**
Add `?local=true` to cron endpoints to bypass Vercel cron check:

```
GET /api/cron/notifications?local=true
```

### **Manual Triggers**
Use trigger endpoints for testing:
```
GET /api/notifications/trigger-now?email=user@example.com&type=both
```

---

## 📖 Usage Examples

### **Example: Check Schedule**
```bash
curl "http://localhost:9002/api/notifications/check-schedule?email=user@example.com"
```

### **Example: Trigger Email**
```bash
curl "http://localhost:9002/api/notifications/trigger-now?email=user@example.com&type=reminder"
```

### **Example: Test SendGrid**
```bash
curl "http://localhost:9002/api/notifications/test-sendgrid?email=test@example.com"
```

---

All API endpoints return JSON responses and follow RESTful conventions where applicable.

