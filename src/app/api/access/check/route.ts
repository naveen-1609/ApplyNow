import { NextRequest, NextResponse } from 'next/server';
import { getPermissionByEmail } from '@/lib/services/permissions-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const access = await getPermissionByEmail(body.email);
    return NextResponse.json({ access });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to check access' }, { status: 500 });
  }
}
