'use server';

import { adminDb, Timestamp, getAdminAuth } from '@/lib/firebase-admin';
import type { PermissionLevel } from '@/lib/types';
import { OWNER_EMAIL, isOwnerEmail, normalizeEmail } from '@/lib/config/app-user';

const PERMISSIONS_COLLECTION = 'user_permissions';

export type PermissionRecord = {
  email: string;
  permissions: PermissionLevel;
  access_enabled: boolean;
  isAdmin: boolean;
  user_id?: string | null;
  invited_by?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
};

function getPermissionDocRef(email: string) {
  return adminDb.collection(PERMISSIONS_COLLECTION).doc(normalizeEmail(email));
}

function fromPermissionDoc(doc: FirebaseFirestore.DocumentSnapshot): PermissionRecord | null {
  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  if (!data) {
    return null;
  }

  return {
    email: data.email,
    permissions: data.permissions || 'records_only',
    access_enabled: data.access_enabled !== false,
    isAdmin: data.isAdmin === true,
    user_id: data.user_id || null,
    invited_by: data.invited_by || null,
    created_at: data.created_at?.toDate?.() || null,
    updated_at: data.updated_at?.toDate?.() || null,
  };
}

export async function verifyOwnerRequest(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.replace('Bearer ', '');
  const auth = await getAdminAuth();
  const decodedToken = await auth.verifyIdToken(token);

  if (!isOwnerEmail(decodedToken.email)) {
    throw new Error('Forbidden');
  }

  return decodedToken;
}

export async function getPermissionByEmail(email: string): Promise<PermissionRecord | null> {
  const normalizedEmail = normalizeEmail(email);

  if (isOwnerEmail(normalizedEmail)) {
    return {
      email: OWNER_EMAIL,
      permissions: 'ai_features',
      access_enabled: true,
      isAdmin: true,
      user_id: null,
      invited_by: OWNER_EMAIL,
      created_at: null,
      updated_at: null,
    };
  }

  const doc = await getPermissionDocRef(normalizedEmail).get();
  return fromPermissionDoc(doc);
}

export async function upsertPermissionByEmail(
  email: string,
  permissions: PermissionLevel,
  accessEnabled: boolean,
  actorEmail: string
) {
  const normalizedEmail = normalizeEmail(email);

  if (isOwnerEmail(normalizedEmail)) {
    throw new Error('Owner account is always admin and cannot be downgraded.');
  }

  const docRef = getPermissionDocRef(normalizedEmail);
  const existing = await docRef.get();

  await docRef.set(
    {
      email: normalizedEmail,
      permissions,
      access_enabled: accessEnabled,
      isAdmin: false,
      invited_by: normalizeEmail(actorEmail),
      user_id: existing.data()?.user_id || null,
      created_at: existing.exists ? existing.data()?.created_at || Timestamp.now() : Timestamp.now(),
      updated_at: Timestamp.now(),
    },
    { merge: true }
  );

  const updated = await docRef.get();
  return fromPermissionDoc(updated);
}

export async function listPermissionRecords(): Promise<PermissionRecord[]> {
  const snapshot = await adminDb.collection(PERMISSIONS_COLLECTION).orderBy('updated_at', 'desc').get();
  const records = snapshot.docs
    .map(fromPermissionDoc)
    .filter((record): record is PermissionRecord => record !== null);

  return [
    {
      email: OWNER_EMAIL,
      permissions: 'ai_features',
      access_enabled: true,
      isAdmin: true,
      invited_by: OWNER_EMAIL,
      user_id: null,
      created_at: null,
      updated_at: null,
    },
    ...records.filter((record) => !isOwnerEmail(record.email)),
  ];
}

export async function bootstrapUserPermissions(params: { uid: string; email: string; name?: string | null }) {
  const permission = await getPermissionByEmail(params.email);

  if (!permission || !permission.access_enabled) {
    throw new Error('This email address has not been approved yet.');
  }

  const normalizedEmail = normalizeEmail(params.email);
  const userRef = adminDb.collection('users').doc(params.uid);
  const existing = await userRef.get();

  await userRef.set(
    {
      email: normalizedEmail,
      name: params.name || existing.data()?.name || normalizedEmail.split('@')[0],
      permissions: permission.permissions,
      access_enabled: true,
      isAdmin: permission.isAdmin,
      role: permission.isAdmin ? 'owner' : permission.permissions === 'ai_features' ? 'ai_features' : 'records_only',
      last_login_at: Timestamp.now(),
      created_at: existing.exists ? existing.data()?.created_at || Timestamp.now() : Timestamp.now(),
      updated_at: Timestamp.now(),
    },
    { merge: true }
  );

  if (!permission.isAdmin) {
    await getPermissionDocRef(normalizedEmail).set(
      {
        user_id: params.uid,
        updated_at: Timestamp.now(),
      },
      { merge: true }
    );
  }

  return {
    ...permission,
    user_id: params.uid,
  };
}
