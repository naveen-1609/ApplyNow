/**
 * Utility to get Firebase auth token for API requests
 */

import { auth } from '@/lib/firebase';
import { logger } from '@/lib/utils/logger';

/**
 * Get the current user's Firebase auth token
 * Returns null if user is not authenticated
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    if (!auth) {
      return null;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return null;
    }
    const token = await currentUser.getIdToken();
    return token;
  } catch (error) {
    logger.error('Error getting auth token', error);
    return null;
  }
}

/**
 * Create headers with auth token for API requests
 */
export async function getAuthHeaders(tokenOverride?: string | null): Promise<HeadersInit> {
  const token = tokenOverride ?? await getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}
