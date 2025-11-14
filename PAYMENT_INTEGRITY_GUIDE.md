# Payment Integrity & Security Guide

## 🔒 How Payment Integrity is Maintained

### **1. Webhook-Only Subscription Updates**

**Critical Security Rule**: Users **CANNOT** modify their subscription directly.

**Firestore Rules Protection**:
```javascript
// firestore.rules
match /users/{userId} {
  // Users can update their profile, BUT...
  allow update: if request.auth != null && request.auth.uid == userId &&
    // ...subscription fields are protected!
    !request.resource.data.diff(resource.data).affectedKeys()
      .hasAny(['subscriptionPlan', 'subscriptionStatus', 'subscriptionStartDate', 'subscriptionEndDate']);
}
```

**What This Means**:
- ✅ Users can update their name, email, etc.
- ❌ Users **CANNOT** change `subscriptionPlan` directly
- ✅ Only server-side webhooks can update subscriptions
- ✅ Only admins can modify subscriptions (via admin dashboard)

### **2. Server-Side Verification**

All premium features are verified **server-side** before access is granted:

```typescript
// ✅ GOOD: Server-side check (cannot be bypassed)
const check = await verifyFeatureAccess(userId, 'ai');
if (!check.hasAccess) {
  return NextResponse.json({ error: 'Upgrade required' }, { status: 403 });
}

// ❌ BAD: Client-side only check (can be bypassed)
if (userProfile.subscriptionPlan === SubscriptionPlan.FREE) {
  // This can be modified in browser DevTools!
}
```

### **3. Webhook Signature Verification**

All Stripe webhooks are verified using cryptographic signatures:

```typescript
// This ensures the webhook actually came from Stripe
event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

**What This Prevents**:
- ❌ Fake webhook requests
- ❌ Manually crafted payment confirmations
- ❌ Unauthorized subscription upgrades

### **4. Transaction Records**

Every payment creates a permanent transaction record:

```typescript
await subscriptionService.createTransaction({
  userId,
  plan,
  amount: 5 or 50,
  currency: 'USD',
  paymentMethod: 'stripe',
  transactionId: session.id, // Stripe session ID
  status: 'completed',
  completedAt: new Date(),
});
```

**Benefits**:
- ✅ Complete payment audit trail
- ✅ Can verify payments in Stripe Dashboard
- ✅ Prevents duplicate payments
- ✅ Enables refund tracking

### **5. Subscription Expiration Checks**

The system automatically checks and handles expired subscriptions:

```typescript
// Automatically downgrades expired subscriptions
if (userProfile.subscriptionEndDate < new Date()) {
  await subscriptionService.updateSubscription(
    userId,
    SubscriptionPlan.FREE,
    'expired'
  );
}
```

**When This Runs**:
- Before every feature access check
- When user profile is loaded
- Periodically via cron job (optional)

---

## 🛡️ Feature Access Protection Layers

### **Layer 1: Client-Side (UI)**
- Hides premium features from UI
- Shows upgrade prompts
- **Purpose**: Better UX, not security

### **Layer 2: Server-Side (API)**
- Verifies subscription before processing requests
- Checks expiration dates
- Enforces application limits
- **Purpose**: Actual security - cannot be bypassed

### **Layer 3: Database (Firestore Rules)**
- Prevents direct subscription modifications
- Ensures data integrity
- **Purpose**: Last line of defense

---

## 🔐 How to Protect Your API Routes

### **Example: Protecting AI Features**

```typescript
// src/app/api/ai-feature/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAIFeatures } from '@/lib/subscription/api-protection';

export async function POST(request: NextRequest) {
  // Check if user has AI features
  const accessCheck = await requireAIFeatures(request);
  if (accessCheck) {
    return accessCheck; // Returns 403 if no access
  }

  // User has access - proceed with AI feature
  const body = await request.json();
  // ... your AI feature code ...
  
  return NextResponse.json({ result: '...' });
}
```

### **Example: Protecting Application Creation**

```typescript
// src/app/api/applications/route.ts
import { checkApplicationLimit } from '@/lib/subscription/api-protection';

export async function POST(request: NextRequest) {
  // Check application limit
  const limitCheck = await checkApplicationLimit(request);
  if (limitCheck) {
    return limitCheck; // Returns 403 if limit reached
  }

  // User has available slots - create application
  // ... your application creation code ...
}
```

---

## ✅ Payment Flow Security

### **Complete Payment Flow**:

```
1. User clicks "Upgrade"
   ↓
2. Client calls: POST /api/stripe/create-embedded-checkout
   - Server creates Stripe session
   - Includes userId and plan in metadata
   ↓
3. User completes payment on Stripe
   - Stripe processes payment securely
   ↓
4. Stripe sends webhook: POST /api/stripe/webhook
   - Webhook signature is verified ✅
   - Only legitimate Stripe requests pass
   ↓
5. Webhook updates Firestore
   - subscriptionPlan: PLUS or PRO
   - subscriptionStatus: 'active'
   - Creates transaction record
   ↓
6. User returns to app
   - App fetches updated profile
   - Premium features unlock
   ↓
7. Every feature access checks server-side
   - verifyFeatureAccess() runs
   - Expiration checked
   - Access granted or denied
```

### **What Users CANNOT Do**:

1. ❌ **Modify subscription in Firestore** - Rules prevent it
2. ❌ **Bypass API checks** - Server-side verification required
3. ❌ **Fake webhook events** - Signature verification prevents it
4. ❌ **Access expired subscriptions** - Automatic expiration checks
5. ❌ **Exceed application limits** - Server-side limit enforcement

---

## 🔍 Monitoring & Auditing

### **Check Payment Integrity**

1. **Stripe Dashboard**:
   - View all payments
   - Check webhook deliveries
   - Verify customer subscriptions

2. **Firestore**:
   - Check `subscription_transactions` collection
   - Verify `users.subscriptionPlan` matches transactions
   - Monitor for suspicious changes

3. **Vercel Logs**:
   - Check webhook processing logs
   - Monitor API route access attempts
   - Track subscription verification failures

### **Audit Queries**

```typescript
// Find users with subscriptions but no transactions
const usersWithSubs = await getUsersWithSubscriptions();
const transactions = await getAllTransactions();

// Find mismatches
const suspicious = usersWithSubs.filter(user => {
  const userTransactions = transactions.filter(t => t.userId === user.id);
  return userTransactions.length === 0 && user.subscriptionPlan !== 'FREE';
});
```

---

## 🚨 Security Best Practices

### **DO**:
- ✅ Always verify subscriptions server-side
- ✅ Use webhook signature verification
- ✅ Log all subscription changes
- ✅ Monitor for suspicious activity
- ✅ Regularly audit payment records
- ✅ Test payment flows thoroughly

### **DON'T**:
- ❌ Trust client-side subscription checks alone
- ❌ Allow direct subscription modifications
- ❌ Skip webhook signature verification
- ❌ Store payment details in Firestore
- ❌ Expose subscription logic to client

---

## 📊 Subscription Status States

### **Active States**:
- `active` - Subscription is active and paid
- `past_due` - Payment failed, grace period (7 days)

### **Inactive States**:
- `cancelled` - User cancelled subscription
- `expired` - Subscription expired (auto-downgraded)
- `inactive` - Subscription is inactive

### **Status Flow**:
```
active → past_due (payment fails) → expired (after grace period) → FREE
active → cancelled → FREE
```

---

## 🧪 Testing Payment Integrity

### **Test Scenarios**:

1. **Test Payment Success**:
   - Complete payment
   - Verify subscription activates
   - Check transaction record created
   - Verify features unlock

2. **Test Payment Failure**:
   - Use declined card
   - Verify subscription stays FREE
   - Check no transaction record

3. **Test Subscription Expiration**:
   - Manually set `subscriptionEndDate` to past
   - Verify auto-downgrade to FREE
   - Check features lock

4. **Test Limit Enforcement**:
   - Create 100 applications (FREE limit)
   - Try to create 101st
   - Verify 403 error
   - Upgrade to PLUS
   - Verify can create more

5. **Test Bypass Attempts**:
   - Try to modify subscription in Firestore (should fail)
   - Try to call API without subscription (should fail)
   - Try to fake webhook (should fail signature check)

---

## 📝 Summary

### **Security Measures in Place**:

1. ✅ **Firestore Rules** - Prevent direct subscription modifications
2. ✅ **Webhook Verification** - Cryptographic signature checks
3. ✅ **Server-Side Checks** - All premium features verified server-side
4. ✅ **Transaction Logging** - Complete audit trail
5. ✅ **Expiration Handling** - Automatic downgrade on expiry
6. ✅ **Limit Enforcement** - Application limits enforced server-side

### **Payment Integrity Guarantees**:

- ✅ Users can only access features after **verified payment**
- ✅ Payments are **cryptographically verified** via webhooks
- ✅ Subscriptions **cannot be modified** by users
- ✅ Expired subscriptions **automatically downgrade**
- ✅ Application limits are **enforced server-side**
- ✅ All payments are **logged and auditable**

---

**Your payment system is secure and maintains integrity!** 🔒

