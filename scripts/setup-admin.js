const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, Timestamp } = require('firebase/firestore');

// Firebase configuration - you'll need to add your actual config
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function setupAdmin() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Admin user data
    const adminEmail = 'naveenvenkat58@gmail.com';
    const adminName = 'Naveen Venkat';
    const adminUserId = 'admin-user-id'; // You'll need to get the actual Firebase Auth UID

    const adminUserData = {
      email: adminEmail,
      name: adminName,
      subscriptionPlan: 'PRO',
      subscriptionStatus: 'active',
      subscriptionStartDate: Timestamp.fromDate(new Date()),
      subscriptionEndDate: null, // Pro is lifetime
      isAdmin: true,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    };

    // Create admin user document
    await setDoc(doc(db, 'users', adminUserId), adminUserData);

    // Create admin user in admin_users collection
    const adminUserRecord = {
      email: adminEmail,
      name: adminName,
      role: 'admin',
      isActive: true,
      createdBy: 'system',
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    };

    await setDoc(doc(db, 'admin_users', adminUserId), adminUserRecord);

    console.log('✅ Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password: 123123123');
    console.log('User ID:', adminUserId);
    console.log('\nTo get the actual Firebase Auth UID, you can:');
    console.log('1. Create the user in Firebase Auth console');
    console.log('2. Or use the Firebase Admin SDK to create the user');
    console.log('3. Then update the adminUserId in this script');

  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
  }
}

// Run the setup
setupAdmin();
