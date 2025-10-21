# 🔧 Admin User Setup Guide

## Step 1: Create Firebase Auth User

1. **Go to Firebase Console**: https://console.firebase.google.com/project/applynow-e1239/authentication/users
2. **Click "Add User"**
3. **Enter the following**:
   - **Email**: `naveenvenkat58@gmail.com`
   - **Password**: `123123123`
4. **Click "Add User"**
5. **Copy the User UID** (you'll need this for Step 2)

## Step 2: Create User Profile in Firestore

1. **Go to Firestore Database**: https://console.firebase.google.com/project/applynow-e1239/firestore/data
2. **Navigate to the `users` collection**
3. **Click "Start collection"** (if it doesn't exist) or **"Add document"**
4. **Set Document ID** to the User UID from Step 1
5. **Add the following fields**:

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

## Step 3: Test the Setup

1. **Sign in** with your admin credentials
2. **Go to `/profile`** - you should see "ADMIN Plan Active"
3. **Go to `/admin`** - you should see the admin dashboard
4. **Check the sidebar** - you should see the red "Admin Dashboard" link

## Troubleshooting

### If you get "auth/invalid-credential":
- Make sure the user exists in Firebase Auth
- Check the email and password are correct

### If you get "Missing or insufficient permissions":
- The Firestore rules have been updated and deployed
- Make sure you're signed in with the correct account

### If the admin dashboard doesn't show:
- Check that `isAdmin: true` is set in the user document
- Make sure the email matches exactly: `naveenvenkat58@gmail.com`

## Quick Test Commands

After setup, you can test with these URLs:
- **Profile**: `http://localhost:3000/profile`
- **Admin Dashboard**: `http://localhost:3000/admin`
- **Pricing**: `http://localhost:3000/pricing`

## Admin Features Available

Once set up, you'll have:
- ✅ **Admin Dashboard**: Manage all users and subscriptions
- ✅ **Unlimited Access**: All features unlocked
- ✅ **User Management**: View and modify user subscriptions
- ✅ **Admin Controls**: Grant/revoke admin access

---

**Need Help?** Check the browser console for debugging logs that will show the authentication flow.
