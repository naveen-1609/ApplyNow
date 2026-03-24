import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { bootstrapUserPermissions } from '@/lib/services/permissions-server';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      logger.warn('Access bootstrap rejected: missing bearer token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const auth = await getAdminAuth();
    const decoded = await auth.verifyIdToken(token);

    if (!decoded.email) {
      logger.warn('Access bootstrap rejected: decoded token missing email', { uid: decoded.uid });
      return NextResponse.json({ error: 'Authenticated user email is missing' }, { status: 400 });
    }

    const access = await bootstrapUserPermissions({
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
    });

    return NextResponse.json({ access });
  } catch (error: any) {
    logger.error('Failed to bootstrap user access', error);
    const message = error?.message || 'Failed to bootstrap user access';
    const status =
      message === 'Unauthorized' ? 401 :
      message === 'Forbidden' ? 403 :
      message.includes('approved') || message.includes('enabled') ? 403 :
      400;

    return NextResponse.json({ error: message }, { status });
  }
}
