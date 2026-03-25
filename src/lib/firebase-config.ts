import type { FirebaseOptions } from 'firebase/app';

export type FirebaseEnvironment = 'default';

function readEnv(candidates: string[]): string | undefined {
  for (const candidate of candidates) {
    const value = process.env[candidate]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

export const firebaseEnvironment: FirebaseEnvironment = 'default';
export const firebaseAppName = 'applynow';
export const firebaseAdminAppName = 'applynow-admin';

export function getClientFirebaseConfig(): FirebaseOptions {
  return {
    apiKey: readEnv(['NEXT_PUBLIC_FIREBASE_API_KEY']),
    authDomain: readEnv(['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN']),
    projectId: readEnv(['NEXT_PUBLIC_FIREBASE_PROJECT_ID']),
    storageBucket: readEnv(['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET']),
    messagingSenderId: readEnv(['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID']),
    appId: readEnv(['NEXT_PUBLIC_FIREBASE_APP_ID']),
  };
}

export function hasRequiredClientFirebaseConfig(config: FirebaseOptions): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
}

export function getAdminFirebaseConfig() {
  return {
    projectId: readEnv([
      'FIREBASE_ADMIN_PROJECT_ID',
      'FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    ]),
    clientEmail: readEnv([
      'FIREBASE_ADMIN_CLIENT_EMAIL',
      'FIREBASE_CLIENT_EMAIL',
    ]),
    privateKey: readEnv([
      'FIREBASE_ADMIN_PRIVATE_KEY',
      'FIREBASE_PRIVATE_KEY',
    ])?.replace(/\\n/g, '\n'),
    storageBucket: readEnv([
      'FIREBASE_ADMIN_STORAGE_BUCKET',
      'FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    ]),
  };
}
