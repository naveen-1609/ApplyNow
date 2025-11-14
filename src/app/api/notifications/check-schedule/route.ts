import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Please provide either userId or email parameter' },
        { status: 400 }
      );
    }

    // Get user by email if provided
    let targetUserId = userId;
    if (email && !userId) {
      const usersSnapshot = await adminDb.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (usersSnapshot.empty) {
        return NextResponse.json(
          { error: `User with email ${email} not found` },
          { status: 404 }
        );
      }
      targetUserId = usersSnapshot.docs[0].id;
    }

    // Get user data
    const userDoc = await adminDb.collection('users').doc(targetUserId!).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const userEmail = userData?.email || email;

    // Get schedule
    const scheduleSnapshot = await adminDb.collection('schedules')
      .where('user_id', '==', targetUserId)
      .limit(1)
      .get();

    const schedule = scheduleSnapshot.empty ? null : scheduleSnapshot.docs[0].data();

    // Get today's target
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetSnapshot = await adminDb.collection('targets')
      .where('user_id', '==', targetUserId)
      .where('current_date', '==', Timestamp.fromDate(today))
      .limit(1)
      .get();

    const target = targetSnapshot.empty ? null : targetSnapshot.docs[0].data();

    // Current time info
    const now = new Date();
    const currentUTC = now.toISOString();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMinute}`;

    // Calculate next reminder and summary times
    const reminderTime = schedule?.reminder_time || '07:00';
    const summaryTime = schedule?.summary_time || '22:00';
    
    const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number);
    const [summaryHour, summaryMinute] = summaryTime.split(':').map(Number);

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

    return NextResponse.json({
      user: {
        id: targetUserId,
        email: userEmail,
      },
      schedule: schedule ? {
        reminder_time: schedule.reminder_time,
        summary_time: schedule.summary_time,
        email_enabled: schedule.email_enabled,
      } : null,
      target: target ? {
        daily_target: target.daily_target,
        applications_done: target.applications_done,
      } : null,
      currentTime: {
        utc: currentUTC,
        timeString: currentTimeStr,
        hour: currentHour,
        minute: currentMinute,
      },
      nextEmails: {
        reminder: {
          scheduledTime: reminderTime,
          nextOccurrence: nextReminder.toISOString(),
          willTriggerAt: `${reminderHour.toString().padStart(2, '0')}:${reminderMinute.toString().padStart(2, '0')}`,
          isNow: reminderTime === currentTimeStr,
        },
        summary: {
          scheduledTime: summaryTime,
          nextOccurrence: nextSummary.toISOString(),
          willTriggerAt: `${summaryHour.toString().padStart(2, '0')}:${summaryMinute.toString().padStart(2, '0')}`,
          isNow: summaryTime === currentTimeStr,
        },
      },
      status: {
        emailEnabled: schedule?.email_enabled || false,
        hasSchedule: !!schedule,
        hasTarget: !!target,
        willSendReminder: schedule?.email_enabled && reminderTime === currentTimeStr,
        willSendSummary: schedule?.email_enabled && summaryTime === currentTimeStr,
      },
      cronInfo: {
        runsEvery: '1 minute',
        timezone: 'UTC',
        note: 'Times are compared in UTC. If you set times in your local timezone, convert them to UTC.',
      },
    });
  } catch (error: any) {
    console.error('Error checking schedule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check schedule' },
      { status: 500 }
    );
  }
}

