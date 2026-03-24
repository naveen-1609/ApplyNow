import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { getPermissionByEmail } from '@/lib/services/permissions-server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ access: null });
    }

    const token = authHeader.replace('Bearer ', '');
    const auth = await getAdminAuth();
    const decoded = await auth.verifyIdToken(token);

    if (!decoded.email) {
      return NextResponse.json({ access: null });
    }

    const access = await getPermissionByEmail(decoded.email);
    return NextResponse.json({ access });
  } catch (error: any) {
    return NextResponse.json({ access: null, error: error.message || 'Failed to fetch access' });
  }
}
