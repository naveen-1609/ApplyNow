import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp } from '@/lib/firebase-admin';
import { sendReminderEmail, sendSummaryEmail } from '@/lib/services/email';
import { format } from 'date-fns';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
const sendGridApiKey = process.env.SENDGRID_API_KEY;
if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
}

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
    const emailType = searchParams.get('type') || 'both';
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
      const userData = userDoc.data();
      // Try multiple ways to get email
      const userEmail = userData.email || userData.Email || email || null;
      
      if (!userEmail) {
        console.warn(`⚠️ User ${userDoc.id} has no email address. User data:`, {
          userId: userDoc.id,
          hasEmail: !!userData.email,
          hasEmailCapital: !!userData.Email,
          allKeys: Object.keys(userData)
        });
        results.push({
          userId: userDoc.id,
          email: 'No email',
          reminder: { sent: false, error: 'No email address found in user document' },
          summary: { sent: false, error: 'No email address found in user document' },
        });
        continue;
      }

      // Get schedule from schedules collection
      const scheduleSnapshot = await adminDb.collection('schedules')
        .where('user_id', '==', userDoc.id)
        .limit(1)
        .get();
      
      const schedule = scheduleSnapshot.empty ? null : scheduleSnapshot.docs[0].data();

      // Get target from targets collection for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetSnapshot = await adminDb.collection('targets')
        .where('user_id', '==', userDoc.id)
        .where('current_date', '==', Timestamp.fromDate(today))
        .limit(1)
        .get();
      
      const target = targetSnapshot.empty ? null : targetSnapshot.docs[0].data();

      const result: any = {
        userId: userDoc.id,
        email: userEmail,
        schedule: schedule ? {
          reminder_time: schedule.reminder_time,
          summary_time: schedule.summary_time,
          email_enabled: schedule.email_enabled,
        } : null,
        target: target ? {
          daily_target: target.daily_target,
        } : null,
      };

      // Check if email is enabled
      if (!schedule || !schedule.email_enabled) {
        result.reminder = { sent: false, error: 'Email notifications not enabled' };
        result.summary = { sent: false, error: 'Email notifications not enabled' };
        results.push(result);
        continue;
      }

      if (!target) {
        result.reminder = { sent: false, error: 'No target found for today' };
        result.summary = { sent: false, error: 'No target found for today' };
        results.push(result);
        continue;
      }

      // Send reminder email
      if (emailType === 'reminder' || emailType === 'both') {
        const shouldSend = force || schedule.reminder_time === currentTime;
        if (shouldSend) {
          try {
            const sent = await sendReminderEmail(
              userDoc.id,
              userEmail,
              {
                schedule_id: scheduleSnapshot.docs[0].id,
                user_id: schedule.user_id,
                reminder_time: schedule.reminder_time,
                summary_time: schedule.summary_time,
                email_enabled: schedule.email_enabled,
                reminder_email_template: schedule.reminder_email_template,
                summary_email_template: schedule.summary_email_template,
              } as any,
              {
                target_id: targetSnapshot.docs[0].id,
                user_id: target.user_id,
                daily_target: target.daily_target,
                current_date: target.current_date.toDate(),
                applications_done: target.applications_done || 0,
                status_color: target.status_color || 'Green',
              } as any
            );
            result.reminder = { sent, error: sent ? undefined : 'Failed to send' };
          } catch (error: any) {
            result.reminder = { sent: false, error: error.message || 'Unknown error' };
          }
        } else {
          result.reminder = { sent: false, error: `Time mismatch (current: ${currentTime}, scheduled: ${schedule.reminder_time}). Use ?force=true to override.` };
        }
      }

      // Send summary email
      if (emailType === 'summary' || emailType === 'both') {
        const shouldSend = force || schedule.summary_time === currentTime;
        if (shouldSend) {
          try {
            const sent = await sendSummaryEmail(
              userDoc.id,
              userEmail,
              {
                schedule_id: scheduleSnapshot.docs[0].id,
                user_id: schedule.user_id,
                reminder_time: schedule.reminder_time,
                summary_time: schedule.summary_time,
                email_enabled: schedule.email_enabled,
                reminder_email_template: schedule.reminder_email_template,
                summary_email_template: schedule.summary_email_template,
              } as any,
              {
                target_id: targetSnapshot.docs[0].id,
                user_id: target.user_id,
                daily_target: target.daily_target,
                current_date: target.current_date.toDate(),
                applications_done: target.applications_done || 0,
                status_color: target.status_color || 'Green',
              } as any
            );
            result.summary = { sent, error: sent ? undefined : 'Failed to send' };
          } catch (error: any) {
            result.summary = { sent: false, error: error.message || 'Unknown error' };
          }
        } else {
          result.summary = { sent: false, error: `Time mismatch (current: ${currentTime}, scheduled: ${schedule.summary_time}). Use ?force=true to override.` };
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
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Test failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

