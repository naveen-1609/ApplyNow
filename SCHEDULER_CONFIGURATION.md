# Scheduler Configuration Guide

Your scheduler is deployed at: `https://applynow-m73o.onrender.com`

## 🔧 **Configuration Steps**

### **Step 1: Update Environment Variables in Render**

1. **Go to your Render dashboard**: [dashboard.render.com](https://dashboard.render.com)
2. **Find your scheduler service**: `applynow-m73o`
3. **Click on the service** → **Environment** tab
4. **Add/Update these environment variables:**

```
APP_URL=https://your-main-app-url.vercel.app
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

### **Step 2: Get Your Main App URL**

You need to deploy your main app first to get the URL. Here are your options:

#### **Option A: Deploy to Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from your project root
vercel

# Your app will be available at: https://your-project-name.vercel.app
```

#### **Option B: Deploy to Netlify**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy from your project root
netlify deploy --prod

# Your app will be available at: https://your-project-name.netlify.app
```

#### **Option C: Deploy to Render**
```bash
# Connect your GitHub repo to Render
# Your app will be available at: https://your-project-name.onrender.com
```

### **Step 3: Update Scheduler Environment Variables**

Once you have your main app URL, update the scheduler:

1. **In Render Dashboard:**
   - Go to your scheduler service
   - Environment tab
   - Update `APP_URL` to your main app URL
   - Example: `APP_URL=https://applynow-app.vercel.app`

2. **Redeploy the scheduler:**
   - Click "Manual Deploy" → "Deploy latest commit"

### **Step 4: Test the Connection**

1. **Check scheduler logs:**
   ```bash
   # In Render dashboard, go to Logs tab
   # Look for: "📡 Fetching settings from Application Console API"
   ```

2. **Test the API endpoint:**
   ```bash
   curl "https://your-main-app-url.vercel.app/api/scheduler/settings?userId=test"
   ```

## 🔄 **How It Works**

```
Scheduler (Render) → Main App (Vercel/Netlify) → Firebase
     ↓                      ↓                      ↓
  Runs every minute    Provides user settings   Stores data
```

### **Data Flow:**
1. **Scheduler** runs every minute on Render
2. **Scheduler** calls your main app's API: `/api/scheduler/settings?userId=<userId>`
3. **Main app** fetches user settings from Firebase
4. **Main app** returns settings to scheduler
5. **Scheduler** sends emails based on the settings

## 🚨 **Important Notes**

### **User ID Configuration:**
The scheduler currently uses `'current-user'` as a placeholder. You need to:

1. **Get your actual Firebase user ID:**
   - Open your app in browser
   - Open Developer Tools (F12)
   - Go to Console
   - Type: `firebase.auth().currentUser.uid`
   - Copy the result

2. **Update the scheduler code:**
   ```javascript
   // In scheduler/api-scheduler.js, line 208
   const userId = 'your-actual-firebase-user-id-here';
   ```

### **Environment Variables Required:**

**In Main App (Vercel/Netlify):**
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
SENDGRID_API_KEY=your_sendgrid_api_key
```

**In Scheduler (Render):**
```
APP_URL=https://your-main-app-url.vercel.app
SENDGRID_API_KEY=your_sendgrid_api_key
```

## 🧪 **Testing**

### **Test Scheduler Connection:**
```bash
# Test if scheduler can reach your main app
curl "https://applynow-m73o.onrender.com/"

# Check scheduler logs in Render dashboard
```

### **Test Email Sending:**
1. **Set up email notifications** in your main app
2. **Set reminder time** to current time + 1 minute
3. **Wait and check** if email is sent

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"API request failed"**
   - Check if main app is deployed and accessible
   - Verify APP_URL environment variable
   - Check main app's API endpoint

2. **"User not found"**
   - Update userId in scheduler code
   - Verify user exists in Firebase

3. **"Email not sent"**
   - Check SendGrid API key
   - Verify domain authentication in SendGrid

### **Debug Steps:**
1. **Check scheduler logs** in Render dashboard
2. **Test API endpoint** manually
3. **Verify environment variables**
4. **Check Firebase user data**

## 📱 **Next Steps**

1. **Deploy your main app** to get the URL
2. **Update scheduler environment variables**
3. **Update userId in scheduler code**
4. **Test the complete flow**
5. **Set up your email notifications**

Your scheduler is ready to work with your main app once you complete these steps! 🚀
