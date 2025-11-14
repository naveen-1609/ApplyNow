import { initializeApp, getApps, cert, type ServiceAccount, type App } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

// Service account configuration
const serviceAccount: ServiceAccount = {
  projectId: "applynow-e1239",
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
};

// Initialize Firebase Admin SDK
let adminApp: App;
if (getApps().length === 0) {
  try {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: "applynow-e1239.firebasestorage.app",
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    throw error;
  }
} else {
  adminApp = getApps()[0];
}

// Export admin services
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
export { adminApp, Timestamp, getAuth };
