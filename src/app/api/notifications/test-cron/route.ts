import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp } from '@/lib/firebase-admin';
import { sendReminderEmail, sendSummaryEmail } from '@/lib/services/email';
import { format } from 'date-fns';

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

    console.log(`🧪 Test cron triggered at ${currentTime} (UTC: ${currentTimeStr})`);

    // Find user by email
    let targetUserId = null;
    let userEmail = email;

    if (email) {
      const emailQuery = await adminDb.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (!emailQuery.empty) {
        targetUserId = emailQuery.docs[0].id;
        const userData = emailQuery.docs[0].data();
        userEmail = userData.email || email;
      }
    }

    if (!targetUserId) {
      return NextResponse.json({
        error: 'User not found',
        email: email,
      }, { status: 404 });
    }

    // Get schedule
    const scheduleSnapshot = await adminDb.collection('schedules')
      .where('user_id', '==', targetUserId)
      .limit(1)
      .get();

    if (scheduleSnapshot.empty) {
      return NextResponse.json({
        error: 'Schedule not found',
        userId: targetUserId,
      }, { status: 404 });
    }

    const schedule = scheduleSnapshot.docs[0].data();

    // Get target for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetSnapshot = await adminDb.collection('targets')
      .where('user_id', '==', targetUserId)
      .where('current_date', '==', Timestamp.fromDate(today))
      .limit(1)
      .get();

    const target = targetSnapshot.empty ? null : targetSnapshot.docs[0].data();

    const results: any = {
      timestamp: currentTime,
      currentTime: currentTimeStr,
      user: {
        userId: targetUserId,
        email: userEmail,
      },
      schedule: {
        reminder_time: schedule.reminder_time,
        summary_time: schedule.summary_time,
        email_enabled: schedule.email_enabled,
      },
      target: target ? {
        daily_target: target.daily_target,
        applications_done: target.applications_done,
      } : null,
      checks: {
        hasSchedule: true,
        hasTarget: !!target,
        emailEnabled: schedule.email_enabled,
        reminderMatch: schedule.reminder_time === currentTimeStr,
        summaryMatch: schedule.summary_time === currentTimeStr,
      },
      emails: {
        reminder: null as any,
        summary: null as any,
      },
    };

    // Check if times match and send emails
    if (schedule.email_enabled) {
      // Always send both emails in test mode (ignore time matching)
      console.log(`📧 Test mode: Sending both reminder and summary emails...`);

      if (target) {
        try {
          const reminderSent = await sendReminderEmail(
            targetUserId,
            userEmail,
            {
              schedule_id: scheduleSnapshot.docs[0].id,
              user_id: schedule.user_id,
              reminder_time: schedule.reminder_time,
              summary_time: schedule.summary_time,
              email_enabled: schedule.email_enabled,
              reminder_email_template: schedule.reminder_email_template,
              summary_email_template: schedule.summary_email_template,
            },
            {
              target_id: targetSnapshot.docs[0].id,
              user_id: target.user_id,
              daily_target: target.daily_target || 3,
              current_date: target.current_date.toDate(),
              applications_done: target.applications_done || 0,
              status_color: target.status_color || 'Green',
            }
          );
          results.emails.reminder = {
            sent: reminderSent,
            scheduledTime: schedule.reminder_time,
            currentTime: currentTimeStr,
            match: schedule.reminder_time === currentTimeStr,
          };
        } catch (error: any) {
          results.emails.reminder = {
            sent: false,
            error: error.message,
          };
        }

        try {
          const summarySent = await sendSummaryEmail(
            targetUserId,
            userEmail,
            {
              schedule_id: scheduleSnapshot.docs[0].id,
              user_id: schedule.user_id,
              reminder_time: schedule.reminder_time,
              summary_time: schedule.summary_time,
              email_enabled: schedule.email_enabled,
              reminder_email_template: schedule.reminder_email_template,
              summary_email_template: schedule.summary_email_template,
            },
            {
              target_id: targetSnapshot.docs[0].id,
              user_id: target.user_id,
              daily_target: target.daily_target || 3,
              current_date: target.current_date.toDate(),
              applications_done: target.applications_done || 0,
              status_color: target.status_color || 'Green',
            }
          );
          results.emails.summary = {
            sent: summarySent,
            scheduledTime: schedule.summary_time,
            currentTime: currentTimeStr,
            match: schedule.summary_time === currentTimeStr,
          };
        } catch (error: any) {
          results.emails.summary = {
            sent: false,
            error: error.message,
          };
        }
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
    console.error('Test cron error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to test cron',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

