import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp } from '@/lib/firebase-admin';
import { sendReminderEmail, sendSummaryEmail } from '@/lib/services/email';

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
    const type = searchParams.get('type') || 'both';

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const emailQuery = await adminDb.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (emailQuery.empty) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userDoc = emailQuery.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    const userEmail = userData.email || email;

    // Get schedule
    const scheduleSnapshot = await adminDb.collection('schedules')
      .where('user_id', '==', userId)
      .limit(1)
      .get();

    if (scheduleSnapshot.empty) {
      return NextResponse.json({
        error: 'Schedule not found',
        fix: 'Set up schedule in Settings → Notifications',
      }, { status: 404 });
    }

    const schedule = scheduleSnapshot.docs[0].data();

    if (!schedule.email_enabled) {
      return NextResponse.json({
        error: 'Email notifications are disabled',
        fix: 'Enable email notifications in Settings → Notifications',
      }, { status: 400 });
    }

    // Get target for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetSnapshot = await adminDb.collection('targets')
      .where('user_id', '==', userId)
      .where('current_date', '==', Timestamp.fromDate(today))
      .limit(1)
      .get();

    const target = targetSnapshot.empty ? null : targetSnapshot.docs[0].data();

    if (!target) {
      return NextResponse.json({
        error: 'No target set for today',
        fix: 'Set a daily target in the Targets page',
      }, { status: 400 });
    }

    const results: any = {
      email: userEmail,
      timestamp: new Date().toISOString(),
      emails: {},
    };

    // Send reminder email
    if (type === 'reminder' || type === 'both') {
      try {
        const sent = await sendReminderEmail(
          userId,
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
          sent,
          message: sent ? 'Reminder email sent successfully' : 'Failed to send reminder email',
        };
      } catch (error: any) {
        results.emails.reminder = {
          sent: false,
          error: error.message || 'Unknown error',
        };
      }
    }

    // Send summary email
    if (type === 'summary' || type === 'both') {
      try {
        const sent = await sendSummaryEmail(
          userId,
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
          sent,
          message: sent ? 'Summary email sent successfully' : 'Failed to send summary email',
        };
      } catch (error: any) {
        results.emails.summary = {
          sent: false,
          error: error.message || 'Unknown error',
        };
      }
    }

    const allSent = Object.values(results.emails).every((e: any) => e.sent);
    
    return NextResponse.json({
      success: allSent,
      message: allSent 
        ? 'Email(s) sent successfully' 
        : 'Some emails failed to send',
      ...results,
    });

  } catch (error: any) {
    console.error('Trigger now error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to trigger emails',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

