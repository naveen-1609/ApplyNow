# Vercel Environment Variables Checklist

## ⚠️ CRITICAL: Set These in Vercel Dashboard

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

### ✅ Required for Subscriptions to Work

#### 1. Stripe Keys (MOST IMPORTANT)
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Without these, subscription features will NOT work!**

#### 2. Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### 3. Firebase Admin (Server-Side)
```
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
```

#### 4. Optional (But Recommended)
```
STRIPE_PLUS_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_PLUS_PRODUCT_ID=prod_...
STRIPE_PRO_PRODUCT_ID=prod_...
```

### ✅ Required for Other Features

#### Email Notifications
```
SENDGRID_API_KEY=SG.your_sendgrid_api_key
```

#### AI Features
```
OPENAI_API_KEY=sk-...
```

## 🔍 How to Verify

### Step 1: Check Vercel Dashboard
1. Go to your project in Vercel
2. Click **Settings** → **Environment Variables**
3. Verify all variables above are listed
4. Check that they're enabled for **Production**, **Preview**, and **Development**

### Step 2: Redeploy
After adding variables, Vercel will prompt to redeploy. Click **Redeploy**.

### Step 3: Test in Browser
1. Open your deployed site
2. Open Browser DevTools (F12)
3. Go to **Console** tab
4. Look for errors like:
   - "Firebase configuration is missing"
   - "Stripe not initialized"
   - Any red errors

### Step 4: Check Network Tab
1. Open DevTools → **Network** tab
2. Navigate to `/subscriptions` page
3. Look for failed requests (red status codes)
4. Check if API calls to `/api/stripe/*` are working

## 🚨 Common Mistakes

### ❌ Wrong: Using local `.env.local` values
- Local environment variables don't work on Vercel
- You MUST set them in Vercel Dashboard

### ❌ Wrong: Missing `NEXT_PUBLIC_` prefix
- Client-side variables MUST have `NEXT_PUBLIC_` prefix
- Server-side variables (like `STRIPE_SECRET_KEY`) should NOT have the prefix

### ❌ Wrong: Not redeploying after adding variables
- Variables are only available after redeployment
- Always redeploy after adding/changing variables

### ❌ Wrong: Using test keys in production
- Make sure you're using the right keys for your environment
- Test keys start with `pk_test_` and `sk_test_`
- Live keys start with `pk_live_` and `sk_live_`

## ✅ Quick Test

After setting variables and redeploying:

1. **Login** to your app
2. **Navigate** to `/subscriptions`
3. **Check** if you see:
   - Your current plan
   - Upgrade buttons
   - Billing history section

If you see "Free Plan" and upgrade options, it's working!

## 🔧 Still Not Working?

1. **Check Build Logs**: Vercel Dashboard → Deployments → Latest → Build Logs
2. **Check Function Logs**: Vercel Dashboard → Functions tab
3. **Check Browser Console**: Look for specific error messages
4. **Verify Firestore Rules**: Make sure rules allow reading user documents

## 📝 Quick Copy-Paste for Vercel

Copy these variable names and add your values:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_ADMIN_PRIVATE_KEY
FIREBASE_ADMIN_CLIENT_EMAIL
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
SENDGRID_API_KEY
OPENAI_API_KEY
```

**Remember**: After adding, click **Redeploy**!

