import { NextRequest, NextResponse } from 'next/server';
import {
  getNotificationContextByEmail,
  sendNotificationsForContext,
} from '@/lib/services/notification-service';
import { logger } from '@/lib/utils/logger';

/**
 * Test cron endpoint - manually triggers the cron job logic (bypasses Vercel cron check)
 * This allows testing the email sending logic without waiting for the actual cron job
 * 
 * Usage:
 * GET /api/notifications/test-cron?email=naveenvenkat58@gmail.com
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    const now = new Date();
    const currentTime = now.toISOString();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMinute}`;

    logger.info('Test cron triggered', { timestamp: currentTime, currentTime: currentTimeStr, email });

    if (!email) {
      return NextResponse.json({
        error: 'Email parameter is required',
      }, { status: 400 });
    }

    const context = await getNotificationContextByEmail(email);
    if (!context) {
      return NextResponse.json({
        error: 'User not found',
        email,
      }, { status: 404 });
    }

    if (!context.schedule) {
      return NextResponse.json({
        error: 'Schedule not found',
        userId: context.userId,
      }, { status: 404 });
    }

    const results: any = {
      timestamp: currentTime,
      currentTime: currentTimeStr,
      user: {
        userId: context.userId,
        email: context.userEmail,
      },
      schedule: {
        reminder_time: context.schedule.reminder_time,
        summary_time: context.schedule.summary_time,
        email_enabled: context.schedule.email_enabled,
      },
      target: context.target ? {
        daily_target: context.target.daily_target,
        applications_done: context.target.applications_done,
      } : null,
      checks: {
        hasSchedule: true,
        hasTarget: !!context.target,
        emailEnabled: context.schedule.email_enabled,
        reminderMatch: context.schedule.reminder_time === currentTimeStr,
        summaryMatch: context.schedule.summary_time === currentTimeStr,
      },
      emails: {
        reminder: null as any,
        summary: null as any,
      },
    };

    // Check if times match and send emails
    if (context.schedule.email_enabled) {
      if (context.target) {
        const emailResults = await sendNotificationsForContext(context, 'both');
        results.emails.reminder = emailResults.reminder
          ? {
              ...emailResults.reminder,
              scheduledTime: context.schedule.reminder_time,
              currentTime: currentTimeStr,
              match: context.schedule.reminder_time === currentTimeStr,
            }
          : null;
        results.emails.summary = emailResults.summary
          ? {
              ...emailResults.summary,
              scheduledTime: context.schedule.summary_time,
              currentTime: currentTimeStr,
              match: context.schedule.summary_time === currentTimeStr,
            }
          : null;
      } else {
        results.error = 'No target found for today - emails require a target to be set';
        results.fix = 'Set a daily target in the Targets page';
      }
    } else {
      results.error = 'Email notifications are disabled';
      results.fix = 'Enable email notifications in Settings → Notifications';
    }

    return NextResponse.json(results);

  } catch (error: any) {
    logger.error('Test cron error', error);
    return NextResponse.json({
      error: error.message || 'Failed to test cron',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
