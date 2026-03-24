import { initializeApp, getApps, cert, type ServiceAccount, type App } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import type { Auth } from 'firebase-admin/auth';
import { firebaseAdminAppName, firebaseEnvironment, getAdminFirebaseConfig } from '@/lib/firebase-config';

declare global {
  var __applyNowAdminApp__: App | undefined;
  var __applyNowAdminDb__: Firestore | undefined;
  var __applyNowAdminWarnedCredentials__: boolean | undefined;
}

function initializeAdminApp(): App {
  if (globalThis.__applyNowAdminApp__) {
    return globalThis.__applyNowAdminApp__;
  }

  const config = getAdminFirebaseConfig();
  if (!config.projectId) {
    throw new Error(
      `Missing Firebase Admin project ID for the ${firebaseEnvironment} environment. ` +
      'Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_PROJECT_ID, or the environment-scoped equivalent.'
    );
  }

  const existingApp = getApps().find((candidate) => candidate.name === firebaseAdminAppName);
  if (existingApp) {
    globalThis.__applyNowAdminApp__ = existingApp;
    return existingApp;
  }

  const hasServiceAccountCredentials = Boolean(config.privateKey && config.clientEmail);
  if (!hasServiceAccountCredentials && !globalThis.__applyNowAdminWarnedCredentials__) {
    console.warn(
      `Firebase Admin SDK for the ${firebaseEnvironment} environment is missing explicit service account credentials. ` +
      'Server-side Firestore operations require FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY ' +
      'or their environment-scoped equivalents.'
    );
    globalThis.__applyNowAdminWarnedCredentials__ = true;
  }

  const serviceAccount: ServiceAccount = {
    projectId: config.projectId,
    privateKey: config.privateKey,
    clientEmail: config.clientEmail,
  };

  const app = initializeApp(
    {
      projectId: config.projectId,
      ...(hasServiceAccountCredentials ? { credential: cert(serviceAccount) } : {}),
      ...(config.storageBucket ? { storageBucket: config.storageBucket } : {}),
    },
    firebaseAdminAppName
  );

  globalThis.__applyNowAdminApp__ = app;
  return app;
}

export const adminApp = initializeAdminApp();
export const adminDb = globalThis.__applyNowAdminDb__ ?? getFirestore(adminApp);
globalThis.__applyNowAdminDb__ = adminDb;
export const adminStorage = getStorage(adminApp);

export async function getAdminAuth(): Promise<Auth> {
  const { getAuth } = await import('firebase-admin/auth');
  return getAuth(adminApp);
}

export { Timestamp };
