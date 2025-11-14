# Create User Document - Step by Step Guide

## 🔍 **Problem**

Your user document doesn't exist in Firestore. This is needed for the notification system to work.

## ✅ **Solution Options**

### **Option 1: Get Your Firebase Auth UID (Recommended)**

You need your Firebase Auth User ID. Here's how to get it:

**Method A: From Browser Console (Easiest)**
1. Open your app in browser
2. Sign in
3. Open browser console (F12)
4. Run this command:
   ```javascript
   firebase.auth().currentUser?.uid
   ```
5. Copy the UID that appears

**Method B: From Firebase Console**
1. Go to: https://console.firebase.google.com/project/applynow-e1239/authentication/users
2. Find your email: `naveenvenkat58@gmail.com`
3. Click on it
4. Copy the **User UID** (it's at the top)

### **Option 2: Create User Document with UID**

Once you have your Firebase Auth UID, use this endpoint:

```
GET /api/notifications/create-or-fix-user?email=naveenvenkat58@gmail.com&userId=YOUR_FIREBASE_AUTH_UID&name=Naveen Venkat
```

**Example:**
```
http://localhost:9002/api/notifications/create-or-fix-user?email=naveenvenkat58@gmail.com&userId=RLzGFDtmq8e6qXeJF85haAhb1Kr1&name=Naveen Venkat
```

This will:
- ✅ Create the user document in Firestore
- ✅ Set email, name, subscription plan
- ✅ Set admin status if email matches
- ✅ Create admin user record if admin

### **Option 3: Sign Up Through App**

If you haven't signed up yet:
1. Go to your app's signup page
2. Sign up with `naveenvenkat58@gmail.com`
3. This will automatically create the user document

### **Option 4: Manual Creation in Firestore**

1. Go to Firebase Console: https://console.firebase.google.com/project/applynow-e1239/firestore/data
2. Navigate to `users` collection
3. Click "Add document"
4. Set Document ID to your Firebase Auth UID
5. Add these fields:

```json
{
  "email": "naveenvenkat58@gmail.com",
  "name": "Naveen Venkat",
  "subscriptionPlan": "ADMIN",
  "subscriptionStatus": "active",
  "isAdmin": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

## 🚀 **Quick Steps**

### **Step 1: Get Your Firebase Auth UID**

**In Browser Console:**
```javascript
// If you're signed in, run this:
firebase.auth().currentUser?.uid

// Or check localStorage:
JSON.parse(localStorage.getItem('firebase:authUser:YOUR_API_KEY:[DEFAULT]'))?.uid
```

### **Step 2: Create User Document**

Use the endpoint with your UID:
```
GET /api/notifications/create-or-fix-user?email=naveenvenkat58@gmail.com&userId=YOUR_UID&name=Naveen Venkat
```

### **Step 3: Test**

After creating, test emails:
```
GET /api/notifications/test?email=naveenvenkat58@gmail.com&type=both&force=true
```

---

## 🔍 **Find Your User ID**

If you're already signed in to the app, your user ID is likely stored. Check:

1. **Browser Console:**
   ```javascript
   // Open console on your app page
   firebase.auth().currentUser?.uid
   ```

2. **Firebase Console:**
   - Go to Authentication → Users
   - Find your email
   - Copy the UID

3. **From Previous Error:**
   - The error showed: `userId: "RLzGFDtmq8e6qXeJF85haAhb1Kr1"`
   - This might be your UID! Try using it.

---

## ✅ **After Creating User Document**

1. ✅ User document exists in Firestore
2. ✅ Email field is set
3. ✅ Can receive test emails
4. ✅ Can receive scheduled emails
5. ✅ Notification system works

---

## 🎯 **Quick Command**

**If you know your UID (from error: `RLzGFDtmq8e6qXeJF85haAhb1Kr1`):**

```
GET /api/notifications/create-or-fix-user?email=naveenvenkat58@gmail.com&userId=RLzGFDtmq8e6qXeJF85haAhb1Kr1&name=Naveen Venkat
```

**Then test:**
```
GET /api/notifications/test?email=naveenvenkat58@gmail.com&type=both&force=true
```

---

**Try using the UID from the error message first - it might be your Firebase Auth UID!**

