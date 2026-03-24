import { NextRequest, NextResponse } from 'next/server';
import { listPermissionRecords, upsertPermissionByEmail, verifyOwnerRequest } from '@/lib/services/permissions-server';
import type { PermissionLevel } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    await verifyOwnerRequest(request.headers.get('authorization'));
    const records = await listPermissionRecords();
    return NextResponse.json({ records });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load permissions' }, { status: error.message === 'Forbidden' ? 403 : 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyOwnerRequest(request.headers.get('authorization'));
    const body = await request.json();
    const permissions = (body.permissions || 'records_only') as PermissionLevel;
    const accessEnabled = body.access_enabled !== false;

    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const record = await upsertPermissionByEmail(body.email, permissions, accessEnabled, decoded.email || '');
    return NextResponse.json({ record });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save permission' }, { status: error.message === 'Forbidden' ? 403 : 400 });
  }
}
