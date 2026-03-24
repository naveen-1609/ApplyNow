import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  CACHE_SIZE_UNLIMITED,
  getFirestore,
  initializeFirestore,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import {
  firebaseAppName,
  firebaseEnvironment,
  getClientFirebaseConfig,
  hasRequiredClientFirebaseConfig,
} from '@/lib/firebase-config';

type FirebaseClientServices = {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
};

declare global {
  var __applyNowFirebaseClient__: FirebaseClientServices | undefined;
  var __applyNowFirebaseWarnedConfig__: boolean | undefined;
}

function getFirebaseAppInstance(config: ReturnType<typeof getClientFirebaseConfig>) {
  const existingApp = getApps().find((candidate) => candidate.name === firebaseAppName);
  return existingApp ?? initializeApp(config, firebaseAppName);
}

function initializeFirebaseClient(): FirebaseClientServices {
  if (globalThis.__applyNowFirebaseClient__) {
    return globalThis.__applyNowFirebaseClient__;
  }

  const config = getClientFirebaseConfig();

  if (!hasRequiredClientFirebaseConfig(config)) {
    if (!globalThis.__applyNowFirebaseWarnedConfig__) {
      console.warn(
        `Firebase client configuration for the ${firebaseEnvironment} environment is incomplete. ` +
        'Set the NEXT_PUBLIC_FIREBASE_* environment variables before using Firestore.'
      );
      globalThis.__applyNowFirebaseWarnedConfig__ = true;
    }

    const emptyServices: FirebaseClientServices = {
      app: null,
      auth: null,
      db: null,
      storage: null,
    };

    globalThis.__applyNowFirebaseClient__ = emptyServices;
    return emptyServices;
  }

  const app = getFirebaseAppInstance(config);
  const auth = getAuth(app);

  let db: Firestore;
  try {
    db = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      ignoreUndefinedProperties: true,
    });
  } catch {
    db = getFirestore(app);
  }

  const bucketName = config.storageBucket?.trim();
  const storage = bucketName ? getStorage(app, `gs://${bucketName}`) : getStorage(app);

  const services: FirebaseClientServices = { app, auth, db, storage };
  globalThis.__applyNowFirebaseClient__ = services;

  return services;
}

const services = initializeFirebaseClient();

export const app = services.app;
export const auth = services.auth;
export const db = services.db;
export const storage = services.storage;
