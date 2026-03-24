import type { PermissionLevel } from '@/lib/types';
import { fetchJson } from '@/lib/network/http-client';
import { getAuthHeaders } from '@/lib/utils/api-auth';

export type PermissionRecord = {
  email: string;
  permissions: PermissionLevel;
  access_enabled: boolean;
  isAdmin: boolean;
  user_id?: string | null;
};

export async function getMyPermissions() {
  const headers = await getAuthHeaders();
  return fetchJson<{ access: PermissionRecord | null }>('/api/access/me', {
    headers,
    cache: 'no-store',
  });
}

export async function listAdminPermissions() {
  const headers = await getAuthHeaders();
  return fetchJson<{ records: PermissionRecord[] }>('/api/admin/permissions', {
    headers,
    cache: 'no-store',
  });
}

export async function saveAdminPermission(input: {
  email: string;
  permissions: PermissionLevel;
  access_enabled: boolean;
}) {
  const headers = await getAuthHeaders();
  return fetchJson<{ record: PermissionRecord }>('/api/admin/permissions', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
}

export async function checkEmailAccess(email: string) {
  return fetchJson<{ access: PermissionRecord | null }>('/api/access/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
}

export async function bootstrapAuthenticatedUser() {
  const headers = await getAuthHeaders();
  return fetchJson<{ access: PermissionRecord }>('/api/access/bootstrap', {
    method: 'POST',
    headers,
  });
}

export async function bootstrapAuthenticatedUserWithToken(token: string) {
  const headers = await getAuthHeaders(token);
  return fetchJson<{ access: PermissionRecord }>('/api/access/bootstrap', {
    method: 'POST',
    headers,
  });
}
