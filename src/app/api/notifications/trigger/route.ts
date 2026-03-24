import { NextRequest, NextResponse } from 'next/server';
import {
  getNotificationContextByEmail,
  normalizeNotificationType,
  sendNotificationsForContext,
} from '@/lib/services/notification-service';
import { logger } from '@/lib/utils/logger';

/**
 * Manual trigger endpoint for email notifications
 * 
 * Query parameters:
 * - email: (required) Email address of the user
 * - type: 'reminder' | 'summary' | 'both' (default: 'both')
 * 
 * Example usage:
 * GET /api/notifications/trigger?email=naveenvenkat58@gmail.com&type=both
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const emailType = normalizeNotificationType(searchParams.get('type'));

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required. Example: /api/notifications/trigger?email=your@email.com&type=both' },
        { status: 400 }
      );
    }

    const context = await getNotificationContextByEmail(email);
    if (!context) {
      return NextResponse.json(
        { error: `User with email ${email} not found` },
        { status: 404 }
      );
    }

    if (!context.schedule) {
      return NextResponse.json(
        { error: 'No schedule found for this user. Please set up email notifications in Settings.' },
        { status: 404 }
      );
    }
    
    if (!context.schedule.email_enabled) {
      return NextResponse.json(
        { error: 'Email notifications are not enabled for this user. Please enable them in Settings.' },
        { status: 400 }
      );
    }

    if (!context.target) {
      return NextResponse.json(
        { error: 'No target found for today. Please set a daily target.' },
        { status: 404 }
      );
    }

    const results = await sendNotificationsForContext(context, emailType);

    const success = 
      (emailType === 'reminder' && results.reminder?.sent) ||
      (emailType === 'summary' && results.summary?.sent) ||
      (emailType === 'both' && results.reminder?.sent && results.summary?.sent);

    return NextResponse.json({
      success,
      message: success 
        ? `Email(s) sent successfully to ${email}` 
        : 'Some emails failed to send. Check errors below.',
      timestamp: new Date().toISOString(),
      email: context.userEmail,
      type: emailType,
      results,
      schedule: {
        reminder_time: context.schedule.reminder_time,
        summary_time: context.schedule.summary_time,
        email_enabled: context.schedule.email_enabled,
      },
      target: {
        daily_target: context.target.daily_target,
        applications_done: context.target.applications_done || 0,
      },
    });

  } catch (error: any) {
    logger.error('Error in trigger endpoint', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to trigger emails',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
