# Stripe Payment Setup - Quick Start Guide

## 🚀 5-Minute Setup

### **Step 1: Get Stripe Keys** (2 minutes)

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy **Publishable key**: `pk_test_...`
3. Click "Reveal test key" → Copy **Secret key**: `sk_test_...`

### **Step 2: Create Products** (2 minutes)

1. Go to: https://dashboard.stripe.com/products
2. Click **"+ Add product"**
3. **Plus Plan**:
   - Name: `Plus Plan`
   - Price: `$5.00`
   - Billing: `Monthly (recurring)`
   - Copy Price ID: `price_...`
4. Click **"+ Add product"** again
5. **Pro Plan**:
   - Name: `Pro Plan`
   - Price: `$50.00`
   - Billing: `One time`
   - Copy Price ID: `price_...`

### **Step 3: Set Up Webhook** (1 minute)

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"+ Add endpoint"**
3. URL: `https://your-domain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy **Signing secret**: `whsec_...`

### **Step 4: Add to Environment Variables**

**Local (.env.local)**:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLUS_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
```

**Vercel**:
1. Go to: Vercel Dashboard → Project → Settings → Environment Variables
2. Add all variables above
3. Click **Redeploy**

---

## ✅ Test Payment

1. Start app: `npm run dev`
2. Login and go to `/subscriptions`
3. Click "Upgrade" on a plan
4. Use test card: `4242 4242 4242 4242`
5. Complete payment
6. ✅ Subscription should activate automatically!

---

## 🔒 Security Features

✅ **Webhook signature verification** - Prevents fake payments
✅ **Server-side subscription checks** - Cannot be bypassed
✅ **Firestore rules protection** - Users can't modify subscriptions
✅ **Automatic expiration** - Subscriptions expire and downgrade
✅ **Transaction logging** - Complete audit trail

---

## 📚 Full Documentation

See `STRIPE_COMPLETE_SETUP_GUIDE.md` for detailed setup instructions.

See `PAYMENT_INTEGRITY_GUIDE.md` for security and integrity details.

---

**That's it! Your payment system is ready!** 🎉

