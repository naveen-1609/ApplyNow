import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSchedule } from '@/lib/services/schedules-server';

/**
 * Verify that schedule was saved correctly after Settings UI save
 * 
 * Usage:
 * GET /api/notifications/verify-save?email=naveenvenkat58@gmail.com
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');

    if (!email && !userId) {
      return NextResponse.json(
        { error: 'Email or userId parameter is required' },
        { status: 400 }
      );
    }

    let targetUserId = userId;

    // Find user by email if needed
    if (email && !targetUserId) {
      const emailQuery = await adminDb.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (!emailQuery.empty) {
        targetUserId = emailQuery.docs[0].id;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get schedule using the same function the cron job uses
    const schedule = await getSchedule(targetUserId);

    // Get raw schedule from Firestore
    const scheduleSnapshot = await adminDb.collection('schedules')
      .where('user_id', '==', targetUserId)
      .limit(1)
      .get();

    const rawSchedule = scheduleSnapshot.empty ? null : scheduleSnapshot.docs[0].data();

    // Current time for comparison
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMinute}`;

    return NextResponse.json({
      userId: targetUserId,
      email: email || 'unknown',
      schedule: schedule ? {
        schedule_id: schedule.schedule_id,
        reminder_time: schedule.reminder_time,
        summary_time: schedule.summary_time,
        email_enabled: schedule.email_enabled,
      } : null,
      rawSchedule: rawSchedule ? {
        reminder_time: rawSchedule.reminder_time,
        summary_time: rawSchedule.summary_time,
        email_enabled: rawSchedule.email_enabled,
        reminder_time_type: typeof rawSchedule.reminder_time,
        summary_time_type: typeof rawSchedule.summary_time,
      } : null,
      currentTime: {
        utc: currentTimeStr,
        iso: now.toISOString(),
      },
      timeChecks: {
        reminderMatch: schedule?.reminder_time === currentTimeStr,
        summaryMatch: schedule?.summary_time === currentTimeStr,
        reminderTimeFormat: schedule?.reminder_time ? /^\d{2}:\d{2}$/.test(schedule.reminder_time) : false,
        summaryTimeFormat: schedule?.summary_time ? /^\d{2}:\d{2}$/.test(schedule.summary_time) : false,
      },
      verification: {
        scheduleExists: !!schedule,
        emailEnabled: schedule?.email_enabled || false,
        timesValid: schedule ? 
          /^\d{2}:\d{2}$/.test(schedule.reminder_time) && /^\d{2}:\d{2}$/.test(schedule.summary_time) : false,
        willTrigger: schedule ? 
          (schedule.reminder_time === currentTimeStr || schedule.summary_time === currentTimeStr) : false,
      },
    });

  } catch (error: any) {
    console.error('Verify save error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to verify save',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

