import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import {
  getNotificationContextByEmail,
  getNotificationContextByUserId,
  normalizeNotificationType,
  sendNotificationsForContext,
} from '@/lib/services/notification-service';
import { logger } from '@/lib/utils/logger';

/**
 * Test endpoint for notifications
 * 
 * Query parameters:
 * - userId: (optional) Specific user ID to test
 * - type: 'reminder' | 'summary' | 'both' (default: 'both')
 * - force: 'true' to send regardless of time matching (default: 'false')
 * 
 * Example usage:
 * GET /api/notifications/test?userId=abc123&type=reminder&force=true
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const emailType = normalizeNotificationType(searchParams.get('type'));
    const force = searchParams.get('force') === 'true';

    // Get all users or specific user
    let usersSnapshot;
    if (email) {
      // Find user by email
      const emailQuery = await adminDb.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (emailQuery.empty) {
        return NextResponse.json({
          success: false,
          error: `User with email ${email} not found`,
        }, { status: 404 });
      }
      usersSnapshot = emailQuery;
    } else if (userId) {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return NextResponse.json({
          success: false,
          error: `User ${userId} not found`,
        }, { status: 404 });
      }
      usersSnapshot = { docs: [userDoc] };
    } else {
      usersSnapshot = await adminDb.collection('users').get();
    }

    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;

    const results: Array<{
      userId: string;
      email: string;
      schedule?: any;
      target?: any;
      reminder?: { sent: boolean; error?: string };
      summary?: { sent: boolean; error?: string };
    }> = [];

    for (const userDoc of usersSnapshot.docs) {
      const context = email
        ? await getNotificationContextByEmail(email)
        : await getNotificationContextByUserId(userDoc.id);
      
      if (!context?.userEmail) {
        logger.warn(`User ${userDoc.id} has no email address.`);
        results.push({
          userId: userDoc.id,
          email: 'No email',
          reminder: { sent: false, error: 'No email address found in user document' },
          summary: { sent: false, error: 'No email address found in user document' },
        });
        continue;
      }

      const result: any = {
        userId: context.userId,
        email: context.userEmail,
        schedule: context.schedule ? {
          reminder_time: context.schedule.reminder_time,
          summary_time: context.schedule.summary_time,
          email_enabled: context.schedule.email_enabled,
        } : null,
        target: context.target ? {
          daily_target: context.target.daily_target,
        } : null,
      };

      // Check if email is enabled
      if (!context.schedule || !context.schedule.email_enabled) {
        result.reminder = { sent: false, error: 'Email notifications not enabled' };
        result.summary = { sent: false, error: 'Email notifications not enabled' };
        results.push(result);
        continue;
      }

      if (!context.target) {
        result.reminder = { sent: false, error: 'No target found for today' };
        result.summary = { sent: false, error: 'No target found for today' };
        results.push(result);
        continue;
      }

      // Send reminder email
      if (emailType === 'reminder' || emailType === 'both') {
        const shouldSend = force || context.schedule.reminder_time === currentTime;
        if (shouldSend) {
          const sendResults = await sendNotificationsForContext(context, 'reminder');
          result.reminder = sendResults.reminder;
        } else {
          result.reminder = { sent: false, error: `Time mismatch (current: ${currentTime}, scheduled: ${context.schedule.reminder_time}). Use ?force=true to override.` };
        }
      }

      // Send summary email
      if (emailType === 'summary' || emailType === 'both') {
        const shouldSend = force || context.schedule.summary_time === currentTime;
        if (shouldSend) {
          const sendResults = await sendNotificationsForContext(context, 'summary');
          result.summary = sendResults.summary;
        } else {
          result.summary = { sent: false, error: `Time mismatch (current: ${currentTime}, scheduled: ${context.schedule.summary_time}). Use ?force=true to override.` };
        }
      }

      results.push(result);
    }

    const summary = {
      total: results.length,
      remindersSent: results.filter(r => r.reminder?.sent).length,
      summariesSent: results.filter(r => r.summary?.sent).length,
      remindersFailed: results.filter(r => r.reminder && !r.reminder.sent).length,
      summariesFailed: results.filter(r => r.summary && !r.summary.sent).length,
    };

    return NextResponse.json({
      success: true,
      message: 'Test completed',
      timestamp: new Date().toISOString(),
      currentTime,
      summary,
      results,
      instructions: {
        testByEmail: '/api/notifications/test?email=your@email.com&type=both&force=true',
        testByUserId: '/api/notifications/test?userId=USER_ID&type=reminder&force=true',
        testAllUsers: '/api/notifications/test?type=both&force=true',
        testReminderOnly: '/api/notifications/test?email=your@email.com&type=reminder&force=true',
        testSummaryOnly: '/api/notifications/test?email=your@email.com&type=summary&force=true',
        fixUserEmail: '/api/notifications/fix-user-email?email=your@email.com',
        checkSchedule: '/api/notifications/check-schedule?email=your@email.com',
      },
    });

  } catch (error: any) {
    logger.error('Test endpoint error', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Test failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
