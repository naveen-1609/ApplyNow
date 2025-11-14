# Deployment Subscription Features Fix

## Issue
After deployment to Vercel, subscription features and add-ons are not showing up.

## Root Causes

### 1. **Environment Variables Not Set in Vercel**
The most common issue is missing environment variables in Vercel dashboard.

### 2. **Client-Side Environment Variables**
Some environment variables need the `NEXT_PUBLIC_` prefix to be accessible in the browser.

### 3. **Build-Time vs Runtime**
Some features might be hidden during build if environment variables are not available.

## Solution

### Step 1: Set All Environment Variables in Vercel

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables** and add:

#### **Firebase Configuration** (Required)
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### **Firebase Admin** (Required for Server-Side)
```
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
```

#### **Stripe** (Required for Subscriptions)
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLUS_PRICE_ID=price_... (Optional - system can auto-create)
STRIPE_PRO_PRICE_ID=price_... (Optional - system can auto-create)
STRIPE_PLUS_PRODUCT_ID=prod_... (Optional)
STRIPE_PRO_PRODUCT_ID=prod_... (Optional)
```

#### **SendGrid** (Required for Email)
```
SENDGRID_API_KEY=SG.your_sendgrid_api_key
```

#### **OpenAI** (Required for AI Features)
```
OPENAI_API_KEY=sk-...
```

### Step 2: Redeploy After Setting Variables

1. **Option A: Automatic Redeploy**
   - After adding environment variables, Vercel will prompt to redeploy
   - Click "Redeploy" button

2. **Option B: Manual Redeploy**
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

### Step 3: Verify Features Are Showing

After redeployment, check:

1. **Subscriptions Page**: Navigate to `/subscriptions`
   - Should show current plan
   - Should show upgrade options
   - Should show billing history

2. **Sidebar Navigation**: Check if "Subscriptions" link is visible
   - Should be in the sidebar menu

3. **Feature Gates**: Check if premium features are accessible
   - ATS Checker should work
   - Cover letter generation should work
   - Email notifications should work

### Step 4: Check Browser Console

Open browser DevTools (F12) and check:
- No errors related to Firebase
- No errors related to Stripe
- No errors related to environment variables
- Check Network tab for failed API calls

### Step 5: Verify User Profile

The subscription features depend on the user profile being loaded:

1. **Check Firestore**: Verify user document exists in `users` collection
2. **Check Profile Loading**: The `useSubscription` hook should load the profile
3. **Check Admin Email**: If using `naveenvenkat58@gmail.com`, it should auto-upgrade to ADMIN

## Common Issues

### Issue 1: "Subscription page shows 'Free Plan' but should show current plan"
**Solution**: 
- Check if user document exists in Firestore
- Check if `subscriptionPlan` field is set correctly
- Verify Firebase rules allow reading user document

### Issue 2: "Stripe checkout not working"
**Solution**:
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Verify `STRIPE_SECRET_KEY` is set
- Check Stripe dashboard for webhook configuration
- Verify webhook endpoint is accessible: `https://your-domain.com/api/stripe/webhook`

### Issue 3: "Features are hidden even with subscription"
**Solution**:
- Check `useFeatureAccess()` hook is working
- Verify `getUserLimits()` returns correct limits
- Check browser console for errors
- Verify subscription plan is correctly set in user profile

### Issue 4: "Admin features not showing"
**Solution**:
- Verify email is exactly `naveenvenkat58@gmail.com` (case-sensitive check)
- Check if `isAdmin` flag is set in user document
- Verify `SubscriptionService.getUserProfile()` is upgrading admin email

## Debugging Steps

### 1. Check Environment Variables in Vercel
```bash
# In Vercel Dashboard, go to:
# Project → Settings → Environment Variables
# Verify all variables are set for Production, Preview, and Development
```

### 2. Check Build Logs
```bash
# In Vercel Dashboard, go to:
# Deployments → Latest Deployment → Build Logs
# Look for warnings about missing environment variables
```

### 3. Add Debug Logging
Temporarily add to `src/hooks/use-subscription.tsx`:
```typescript
useEffect(() => {
  console.log('🔍 Subscription Debug:', {
    user: user?.email,
    userProfile,
    effectivePlan,
    limits
  });
}, [user, userProfile, effectivePlan, limits]);
```

### 4. Check Network Requests
- Open DevTools → Network tab
- Filter by "subscription" or "stripe"
- Check if API calls are failing
- Check response status codes

## Verification Checklist

After fixing, verify:

- [ ] All environment variables set in Vercel
- [ ] Redeployed after setting variables
- [ ] Subscriptions page loads (`/subscriptions`)
- [ ] Current plan displays correctly
- [ ] Upgrade buttons work
- [ ] Stripe checkout opens
- [ ] Payment processing works
- [ ] Webhook updates subscription
- [ ] Features unlock after payment
- [ ] Admin email shows ADMIN plan
- [ ] No console errors
- [ ] No network errors

## Quick Fix Script

If you need to quickly verify environment variables are accessible:

1. Create a test page: `src/app/(app)/test-env/page.tsx`
2. Add:
```typescript
'use client';

export default function TestEnvPage() {
  return (
    <div className="p-8">
      <h1>Environment Variables Test</h1>
      <pre>
        {JSON.stringify({
          firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Set' : 'Missing',
          // Don't expose secret keys!
        }, null, 2)}
      </pre>
    </div>
  );
}
```

3. Navigate to `/test-env` to check if variables are accessible
4. **Delete this page after testing** (security)

## Still Not Working?

If features still don't show after following these steps:

1. **Check Vercel Function Logs**:
   - Vercel Dashboard → Project → Functions
   - Look for errors in API routes

2. **Check Firestore Rules**:
   - Verify rules allow reading user documents
   - Deploy rules: `firebase deploy --only firestore:rules`

3. **Check Browser Cache**:
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clear browser cache
   - Try incognito mode

4. **Check User Authentication**:
   - Verify user is logged in
   - Check Firebase Auth is working
   - Verify user document exists in Firestore

## Summary

The most common cause is **missing environment variables in Vercel**. Make sure all variables are set and the project is redeployed after adding them.

