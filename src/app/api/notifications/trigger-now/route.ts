import { NextRequest, NextResponse } from 'next/server';
import {
  getNotificationContextByEmail,
  normalizeNotificationType,
  sendNotificationsForContext,
} from '@/lib/services/notification-service';
import { logger } from '@/lib/utils/logger';

/**
 * Trigger emails NOW - bypasses time checks and sends emails immediately
 * This works locally and in production
 * 
 * Usage:
 * GET /api/notifications/trigger-now?email=naveenvenkat58@gmail.com&type=both
 * 
 * Parameters:
 * - email: User email (required)
 * - type: 'reminder', 'summary', or 'both' (default: 'both')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const type = normalizeNotificationType(searchParams.get('type'));

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const context = await getNotificationContextByEmail(email);
    if (!context) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!context.schedule) {
      return NextResponse.json({
        error: 'Schedule not found',
        fix: 'Set up schedule in Settings → Notifications',
      }, { status: 404 });
    }

    if (!context.schedule.email_enabled) {
      return NextResponse.json({
        error: 'Email notifications are disabled',
        fix: 'Enable email notifications in Settings → Notifications',
      }, { status: 400 });
    }

    if (!context.target) {
      return NextResponse.json({
        error: 'No target set for today',
        fix: 'Set a daily target in the Targets page',
      }, { status: 400 });
    }

    const emails = await sendNotificationsForContext(context, type);
    const allSent = Object.values(emails).every((entry) => entry.sent);

    return NextResponse.json({
      success: allSent,
      message: allSent ? 'Email(s) sent successfully' : 'Some emails failed to send',
      email: context.userEmail,
      timestamp: new Date().toISOString(),
      type,
      emails,
    });
  } catch (error: any) {
    logger.error('Trigger now error', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to trigger emails',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
