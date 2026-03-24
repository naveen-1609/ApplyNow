import { initializeApp, getApps, cert, type ServiceAccount, type App } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import type { Auth } from 'firebase-admin/auth';

const firebaseProjectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  'applynow-e1239';
const firebaseAdminClientEmail =
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
  process.env.FIREBASE_CLIENT_EMAIL;
const firebaseAdminPrivateKey = (
  process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
  process.env.FIREBASE_PRIVATE_KEY
)?.replace(/\\n/g, '\n');

// Service account configuration
const serviceAccount: ServiceAccount = {
  projectId: firebaseProjectId,
  privateKey: firebaseAdminPrivateKey,
  clientEmail: firebaseAdminClientEmail,
};

// Initialize Firebase Admin SDK
let adminApp: App;
if (getApps().length === 0) {
  try {
    const hasServiceAccountCredentials = Boolean(
      serviceAccount.privateKey && serviceAccount.clientEmail
    );

    if (!hasServiceAccountCredentials) {
      console.warn('Firebase Admin SDK is missing explicit service account credentials. Firestore admin operations will fail until FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY or FIREBASE_ADMIN_CLIENT_EMAIL/FIREBASE_ADMIN_PRIVATE_KEY are set.');
    }

    adminApp = initializeApp({
      projectId: firebaseProjectId,
      ...(hasServiceAccountCredentials
        ? { credential: cert(serviceAccount) }
        : {}),
      storageBucket: `${firebaseProjectId}.firebasestorage.app`,
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

export async function getAdminAuth(): Promise<Auth> {
  const { getAuth } = await import('firebase-admin/auth');
  return getAuth(adminApp);
}

export { adminApp, Timestamp };
