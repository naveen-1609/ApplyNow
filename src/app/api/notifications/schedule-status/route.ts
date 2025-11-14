import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp } from '@/lib/firebase-admin';

/**
 * Check schedule status and when emails will trigger next
 * 
 * Usage:
 * GET /api/notifications/schedule-status?email=naveenvenkat58@gmail.com
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Find user
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

    const userId = emailQuery.docs[0].id;

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

    // Get target
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetSnapshot = await adminDb.collection('targets')
      .where('user_id', '==', userId)
      .where('current_date', '==', Timestamp.fromDate(today))
      .limit(1)
      .get();

    const target = targetSnapshot.empty ? null : targetSnapshot.docs[0].data();

    // Current time
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMinute}`;

    // Parse scheduled times
    const [reminderHour, reminderMinute] = schedule.reminder_time.split(':').map(Number);
    const [summaryHour, summaryMinute] = schedule.summary_time.split(':').map(Number);

    // Calculate next trigger times
    const nextReminder = new Date();
    nextReminder.setHours(reminderHour, reminderMinute, 0, 0);
    if (nextReminder <= now) {
      nextReminder.setDate(nextReminder.getDate() + 1);
    }

    const nextSummary = new Date();
    nextSummary.setHours(summaryHour, summaryMinute, 0, 0);
    if (nextSummary <= now) {
      nextSummary.setDate(nextSummary.getDate() + 1);
    }

    // Check if times match now
    const reminderMatchesNow = schedule.reminder_time === currentTimeStr;
    const summaryMatchesNow = schedule.summary_time === currentTimeStr;

    return NextResponse.json({
      email,
      userId,
      currentTime: {
        utc: currentTimeStr,
        iso: now.toISOString(),
        timestamp: now.getTime(),
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
      nextTriggers: {
        reminder: {
          scheduledTime: schedule.reminder_time,
          nextOccurrence: nextReminder.toISOString(),
          nextOccurrenceUTC: `${nextReminder.getHours().toString().padStart(2, '0')}:${nextReminder.getMinutes().toString().padStart(2, '0')}`,
          matchesNow: reminderMatchesNow,
          willTriggerIn: Math.round((nextReminder.getTime() - now.getTime()) / 1000 / 60) + ' minutes',
        },
        summary: {
          scheduledTime: schedule.summary_time,
          nextOccurrence: nextSummary.toISOString(),
          nextOccurrenceUTC: `${nextSummary.getHours().toString().padStart(2, '0')}:${nextSummary.getMinutes().toString().padStart(2, '0')}`,
          matchesNow: summaryMatchesNow,
          willTriggerIn: Math.round((nextSummary.getTime() - now.getTime()) / 1000 / 60) + ' minutes',
        },
      },
      status: {
        emailEnabled: schedule.email_enabled,
        hasSchedule: true,
        hasTarget: !!target,
        willTriggerNow: reminderMatchesNow || summaryMatchesNow,
        cronWorksLocally: false,
        cronWorksOnVercel: true,
      },
      info: {
        localTesting: 'Use /api/notifications/trigger-now to send emails immediately',
        production: 'On Vercel, cron runs automatically every minute',
        manualTrigger: '/api/cron/notifications?local=true to simulate cron locally',
      },
    });

  } catch (error: any) {
    console.error('Schedule status error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to get schedule status',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

