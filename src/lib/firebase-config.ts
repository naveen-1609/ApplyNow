import type { FirebaseOptions } from 'firebase/app';

export type FirebaseEnvironment = 'production' | 'test';

function normalizeEnvironment(value: string | null | undefined): FirebaseEnvironment {
  return value?.trim().toLowerCase() === 'test' ? 'test' : 'production';
}

function readEnv(candidates: string[]): string | undefined {
  for (const candidate of candidates) {
    const value = process.env[candidate]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

export const firebaseEnvironment = normalizeEnvironment(
  process.env.NEXT_PUBLIC_FIREBASE_ENV ||
  process.env.FIREBASE_ENV ||
  process.env.NODE_ENV
);

export const firebaseAppName = `applynow-${firebaseEnvironment}`;
export const firebaseAdminAppName = `applynow-admin-${firebaseEnvironment}`;

export function getClientFirebaseConfig(): FirebaseOptions {
  const scope = firebaseEnvironment.toUpperCase();

  return {
    apiKey: readEnv([
      `NEXT_PUBLIC_FIREBASE_${scope}_API_KEY`,
      'NEXT_PUBLIC_FIREBASE_API_KEY',
    ]),
    authDomain: readEnv([
      `NEXT_PUBLIC_FIREBASE_${scope}_AUTH_DOMAIN`,
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    ]),
    projectId: readEnv([
      `NEXT_PUBLIC_FIREBASE_${scope}_PROJECT_ID`,
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    ]),
    storageBucket: readEnv([
      `NEXT_PUBLIC_FIREBASE_${scope}_STORAGE_BUCKET`,
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    ]),
    messagingSenderId: readEnv([
      `NEXT_PUBLIC_FIREBASE_${scope}_MESSAGING_SENDER_ID`,
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    ]),
    appId: readEnv([
      `NEXT_PUBLIC_FIREBASE_${scope}_APP_ID`,
      'NEXT_PUBLIC_FIREBASE_APP_ID',
    ]),
  };
}

export function hasRequiredClientFirebaseConfig(config: FirebaseOptions): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
}

export function getAdminFirebaseConfig() {
  const scope = firebaseEnvironment.toUpperCase();

  return {
    projectId: readEnv([
      `FIREBASE_ADMIN_${scope}_PROJECT_ID`,
      `FIREBASE_${scope}_PROJECT_ID`,
      'FIREBASE_ADMIN_PROJECT_ID',
      'FIREBASE_PROJECT_ID',
      `NEXT_PUBLIC_FIREBASE_${scope}_PROJECT_ID`,
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    ]),
    clientEmail: readEnv([
      `FIREBASE_ADMIN_${scope}_CLIENT_EMAIL`,
      `FIREBASE_${scope}_CLIENT_EMAIL`,
      'FIREBASE_ADMIN_CLIENT_EMAIL',
      'FIREBASE_CLIENT_EMAIL',
    ]),
    privateKey: readEnv([
      `FIREBASE_ADMIN_${scope}_PRIVATE_KEY`,
      `FIREBASE_${scope}_PRIVATE_KEY`,
      'FIREBASE_ADMIN_PRIVATE_KEY',
      'FIREBASE_PRIVATE_KEY',
    ])?.replace(/\\n/g, '\n'),
    storageBucket: readEnv([
      `FIREBASE_ADMIN_${scope}_STORAGE_BUCKET`,
      `FIREBASE_${scope}_STORAGE_BUCKET`,
      'FIREBASE_ADMIN_STORAGE_BUCKET',
      'FIREBASE_STORAGE_BUCKET',
      `NEXT_PUBLIC_FIREBASE_${scope}_STORAGE_BUCKET`,
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    ]),
  };
}
