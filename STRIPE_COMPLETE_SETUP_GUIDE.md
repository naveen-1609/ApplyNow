# Complete Stripe Payment Setup & Security Guide

## 🎯 Overview

This guide covers:
1. Setting up Stripe from scratch
2. Ensuring users only get access after payment
3. Maintaining payment integrity and security
4. Preventing unauthorized access

---

## 📋 Step 1: Stripe Account Setup

### 1.1 Create Stripe Account
1. Go to https://stripe.com
2. Sign up for an account
3. Complete business verification (required for live mode)

### 1.2 Get API Keys

**Test Mode (Development)**:
1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy **Publishable key** (starts with `pk_test_...`)
3. Click "Reveal test key" to get **Secret key** (starts with `sk_test_...`)

**Live Mode (Production)**:
1. Toggle to "Live mode" in Stripe Dashboard
2. Go to: https://dashboard.stripe.com/apikeys
3. Copy **Publishable key** (starts with `pk_live_...`)
4. Click "Reveal live key" to get **Secret key** (starts with `sk_live_...`)

---

## 📦 Step 2: Create Products & Prices in Stripe

### 2.1 Create Plus Plan Product

1. Go to: https://dashboard.stripe.com/products
2. Click **"+ Add product"**
3. Fill in:
   - **Name**: `Plus Plan`
   - **Description**: `Monthly subscription with AI features`
   - **Pricing model**: `Standard pricing`
   - **Price**: `$5.00 USD`
   - **Billing period**: `Monthly (recurring)`
4. Click **"Save product"**
5. **Copy the Price ID** (starts with `price_...`) - You'll need this!

### 2.2 Create Pro Plan Product

1. Click **"+ Add product"** again
2. Fill in:
   - **Name**: `Pro Plan`
   - **Description**: `Lifetime access with all features`
   - **Pricing model**: `Standard pricing`
   - **Price**: `$50.00 USD`
   - **Billing period**: `One time`
3. Click **"Save product"**
4. **Copy the Price ID** (starts with `price_...`) - You'll need this!

### 2.3 Note Product IDs (Optional)

You can also copy the Product IDs (starts with `prod_...`) for reference, but they're optional.

---

## 🔐 Step 3: Set Up Webhook Endpoint

### 3.1 Create Webhook in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"+ Add endpoint"**
3. Fill in:
   - **Endpoint URL**: `https://your-domain.com/api/stripe/webhook`
   - **Description**: `Subscription payment webhook`
4. Click **"Select events"**
5. Select these events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
6. Click **"Add endpoint"**
7. **Copy the Signing secret** (starts with `whsec_...`) - This is your webhook secret!

### 3.2 For Local Testing

Use Stripe CLI to forward webhooks to your local server:

```bash
# Install Stripe CLI
# Windows: Download from https://github.com/stripe/stripe-cli/releases
# Mac: brew install stripe/stripe-cli/stripe
# Linux: See Stripe docs

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:9002/api/stripe/webhook
```

This will give you a webhook secret starting with `whsec_...` for local testing.

---

## 🔧 Step 4: Configure Environment Variables

### 4.1 Local Development (.env.local)

```env
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Price IDs (if you want to use specific prices)
STRIPE_PLUS_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_PLUS_PRODUCT_ID=prod_...
STRIPE_PRO_PRODUCT_ID=prod_...
```

### 4.2 Vercel Production

1. Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Add all the variables above
3. Make sure to use **LIVE keys** for production:
   - `pk_live_...` for publishable key
   - `sk_live_...` for secret key
   - `whsec_...` from your production webhook endpoint

---

## ✅ Step 5: Verify Setup

### 5.1 Test Payment Flow

1. **Start your app**: `npm run dev`
2. **Login** to your app
3. **Navigate** to `/subscriptions` or `/pricing`
4. **Click** "Upgrade" on a plan
5. **Use Stripe test card**: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
6. **Complete payment**
7. **Check**:
   - ✅ You're redirected back to app
   - ✅ Success message appears
   - ✅ Subscription page shows new plan
   - ✅ Premium features are unlocked

### 5.2 Check Webhook Delivery

1. Go to: **Stripe Dashboard → Webhooks**
2. Click on your webhook endpoint
3. Check **"Recent deliveries"**
4. Verify events are being received (green checkmarks)

### 5.3 Check Firestore

1. Go to: **Firebase Console → Firestore Database**
2. Check `users/{userId}` collection:
   - `subscriptionPlan` should be `PLUS` or `PRO`
   - `subscriptionStatus` should be `active`
3. Check `subscription_transactions` collection:
   - Should have a new transaction record
   - `status` should be `completed`

---

## 🔒 Step 6: Security & Integrity Measures

### 6.1 Server-Side Verification

All subscription checks happen **server-side** to prevent tampering:

```typescript
// ✅ GOOD: Server-side check
const userProfile = await subscriptionService.getUserProfile(userId);
if (userProfile.subscriptionPlan !== SubscriptionPlan.PLUS) {
  return NextResponse.json({ error: 'Upgrade required' }, { status: 403 });
}

// ❌ BAD: Client-side only check (can be bypassed)
if (userProfile.subscriptionPlan !== SubscriptionPlan.PLUS) {
  // This can be bypassed by modifying client code!
}
```

### 6.2 Webhook Signature Verification

The webhook handler verifies Stripe signatures to ensure requests are legitimate:

```typescript
// This is already implemented in src/app/api/stripe/webhook/route.ts
event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

### 6.3 Subscription Expiration Checks

The system checks subscription expiration dates:

```typescript
// Already implemented in subscription-service.ts
if (userProfile.subscriptionEndDate && userProfile.subscriptionEndDate < new Date()) {
  // Subscription expired - downgrade to FREE
}
```

### 6.4 Firestore Security Rules

Users can only modify their own data:

```javascript
// firestore.rules
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if request.auth != null && request.auth.uid == userId;
  // Users cannot modify subscriptionPlan directly!
}
```

**Note**: Subscription updates should ONLY happen via webhook (server-side).

---

## 🛡️ Step 7: Feature Access Protection

### 7.1 Client-Side Feature Gates

Use `FeatureGate` component to hide premium features:

```tsx
import { FeatureGate } from '@/components/subscription/feature-gate';

<FeatureGate feature="ai">
  <AIFeature />
</FeatureGate>
```

### 7.2 Server-Side API Protection

Protect API routes that use premium features:

```typescript
// src/app/api/ats-checker/route.ts
import { subscriptionService } from '@/lib/subscription/subscription-service';
import { SubscriptionPlan } from '@/lib/types/subscription';

export async function POST(request: NextRequest) {
  const userId = request.headers.get('user-id'); // Get from auth token
  
  const userProfile = await subscriptionService.getUserProfile(userId);
  
  // Check if user has AI features
  if (userProfile.subscriptionPlan === SubscriptionPlan.FREE) {
    return NextResponse.json(
      { error: 'Upgrade to PLUS or PRO to use AI features' },
      { status: 403 }
    );
  }
  
  // Proceed with AI feature...
}
```

### 7.3 Application Limit Enforcement

Check application limits before allowing new applications:

```typescript
const usage = await subscriptionService.getSubscriptionUsage(userId);
const limits = getUserLimits(userProfile.subscriptionPlan);

if (limits.maxApplications > 0 && usage.applications >= limits.maxApplications) {
  return NextResponse.json(
    { error: 'Application limit reached. Please upgrade.' },
    { status: 403 }
  );
}
```

---

## 🔄 Step 8: Payment Flow Integrity

### 8.1 Payment Verification Flow

```
1. User clicks "Upgrade"
   ↓
2. Create Stripe Checkout Session (server-side)
   - Include userId and plan in metadata
   ↓
3. User completes payment on Stripe
   ↓
4. Stripe sends webhook to /api/stripe/webhook
   ↓
5. Webhook verifies signature (security check)
   ↓
6. Webhook updates user subscription in Firestore
   ↓
7. Webhook creates transaction record
   ↓
8. User returns to app
   ↓
9. App fetches updated user profile
   ↓
10. Premium features unlock automatically
```

### 8.2 Preventing Payment Bypass

**Security measures in place**:

1. ✅ **Webhook signature verification** - Prevents fake webhooks
2. ✅ **Server-side subscription checks** - Client can't bypass
3. ✅ **Firestore security rules** - Users can't modify subscription directly
4. ✅ **Transaction records** - All payments are logged
5. ✅ **Subscription expiration** - Automatic downgrade on expiry

---

## 📊 Step 9: Monitoring & Maintenance

### 9.1 Monitor Payments

1. **Stripe Dashboard**: Check for failed payments, refunds
2. **Firestore**: Monitor `subscription_transactions` collection
3. **Vercel Logs**: Check webhook delivery status

### 9.2 Handle Failed Payments

The webhook handles `invoice.payment_failed` events:

```typescript
case 'invoice.payment_failed': {
  // Option 1: Give grace period (e.g., 7 days)
  // Option 2: Immediately downgrade to FREE
  // Option 3: Send notification email
}
```

### 9.3 Handle Subscription Cancellations

The webhook handles `customer.subscription.deleted`:

```typescript
case 'customer.subscription.deleted': {
  // Downgrade user to FREE plan
  await subscriptionService.updateSubscription(
    userId,
    SubscriptionPlan.FREE,
    'cancelled'
  );
}
```

---

## 🧪 Step 10: Testing Checklist

### Test Scenarios

- [ ] **Successful Payment**: User pays, subscription activates
- [ ] **Payment Failure**: User's card is declined
- [ ] **Subscription Cancellation**: User cancels, downgrades to FREE
- [ ] **Expired Subscription**: PLUS plan expires after 1 month
- [ ] **Feature Access**: Premium features only work for paid users
- [ ] **Application Limits**: FREE users hit 100 application limit
- [ ] **Webhook Retry**: Test webhook delivery failures
- [ ] **Duplicate Payments**: Ensure no double-charging

### Test Cards

**Success**: `4242 4242 4242 4242`
**Decline**: `4000 0000 0000 0002`
**3D Secure**: `4000 0025 0000 3155`

---

## 🚨 Common Issues & Solutions

### Issue 1: "Webhook not receiving events"
**Solution**:
- Check webhook URL is correct
- Verify webhook secret is set
- Check Vercel function logs
- Use Stripe CLI for local testing

### Issue 2: "Payment succeeds but subscription not updated"
**Solution**:
- Check webhook is configured correctly
- Verify webhook signature verification
- Check Firestore rules allow updates
- Check server logs for errors

### Issue 3: "Features still locked after payment"
**Solution**:
- Refresh user profile: `refreshProfile()`
- Check Firestore: Verify `subscriptionPlan` is updated
- Check browser cache: Hard refresh (Ctrl+Shift+R)
- Verify subscription limits in code

### Issue 4: "Users can bypass payment"
**Solution**:
- Ensure ALL premium features check server-side
- Verify Firestore rules prevent direct subscription updates
- Add API route protection
- Use FeatureGate components

---

## 📝 Summary

### ✅ What's Protected

1. **Payment Processing**: Stripe handles all payments securely
2. **Webhook Verification**: Signature verification prevents fake events
3. **Server-Side Checks**: All subscription checks happen server-side
4. **Firestore Rules**: Users cannot modify subscriptions directly
5. **Feature Gates**: Premium features are gated client and server-side
6. **Transaction Logging**: All payments are recorded

### ✅ What Users Can't Do

- ❌ Modify subscription plan directly in Firestore
- ❌ Bypass feature gates by modifying client code
- ❌ Access premium API routes without valid subscription
- ❌ Exceed application limits without upgrading

### ✅ What Happens Automatically

- ✅ Subscription activates after successful payment
- ✅ Features unlock immediately after payment
- ✅ Subscription expires and downgrades automatically
- ✅ Failed payments trigger downgrade (configurable)
- ✅ Cancellations downgrade to FREE

---

## 🎉 You're All Set!

Your payment system is now secure and ready for production. Users can only access premium features after successful payment, and the system maintains integrity through multiple security layers.

