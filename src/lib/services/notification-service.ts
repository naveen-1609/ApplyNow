import { adminDb } from '@/lib/firebase-admin';
import { runtimeTuning } from '@/lib/config/runtime-tuning';
import { normalizeEmail } from '@/lib/config/app-user';
import { getUsersForEmailReminder, sendReminderEmail, sendSummaryEmail } from '@/lib/services/email';
import { getSchedule } from '@/lib/services/schedules-server';
import { getTodayTarget } from '@/lib/services/targets-server';
import type { Schedule, Target } from '@/lib/types';
import { logger } from '@/lib/utils/logger';
import { runWithConcurrency } from '@/lib/utils/parallel';

export type NotificationEmailType = 'reminder' | 'summary' | 'both';

export type NotificationContext = {
  userId: string;
  userEmail: string;
  schedule: Schedule | null;
  target: Target | null;
};

type NotificationResultEntry = [
  'reminder' | 'summary',
  { sent: boolean; error?: string }
];

export function normalizeNotificationType(type: string | null | undefined): NotificationEmailType {
  if (type === 'reminder' || type === 'summary') {
    return type;
  }

  return 'both';
}

export async function getNotificationContextByUserId(userId: string): Promise<NotificationContext | null> {
  const userDoc = await adminDb.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    return null;
  }

  const userData = userDoc.data();
  const userEmail = normalizeEmail(userData?.email);

  if (!userEmail) {
    return null;
  }

  const [schedule, target] = await Promise.all([
    getSchedule(userId),
    getTodayTarget(userId),
  ]);

  return {
    userId,
    userEmail,
    schedule,
    target,
  };
}

export async function getNotificationContextByEmail(email: string): Promise<NotificationContext | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return null;
  }

  const snapshot = await adminDb
    .collection('users')
    .where('email', '==', normalized)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return getNotificationContextByUserId(snapshot.docs[0].id);
}

export async function sendNotificationsForContext(
  context: NotificationContext,
  type: NotificationEmailType
): Promise<{
  reminder?: { sent: boolean; error?: string };
  summary?: { sent: boolean; error?: string };
}> {
  if (!context.schedule) {
    throw new Error('Schedule not found.');
  }

  if (!context.schedule.email_enabled) {
    throw new Error('Email notifications are disabled.');
  }

  if (!context.target) {
    throw new Error('No target found for today.');
  }

  const tasks: Array<Promise<NotificationResultEntry>> = [];

  if (type === 'reminder' || type === 'both') {
    tasks.push(
      sendReminderEmail(context.userId, context.userEmail, context.schedule, context.target)
        .then((sent): NotificationResultEntry => ['reminder', { sent, error: sent ? undefined : 'Failed to send reminder email' }])
        .catch((error: any): NotificationResultEntry => ['reminder', { sent: false, error: error?.message || 'Unknown error' }])
    );
  }

  if (type === 'summary' || type === 'both') {
    tasks.push(
      sendSummaryEmail(context.userId, context.userEmail, context.schedule, context.target)
        .then((sent): NotificationResultEntry => ['summary', { sent, error: sent ? undefined : 'Failed to send summary email' }])
        .catch((error: any): NotificationResultEntry => ['summary', { sent: false, error: error?.message || 'Unknown error' }])
    );
  }

  const settled = await Promise.all(tasks);

  return settled.reduce<{
    reminder?: { sent: boolean; error?: string };
    summary?: { sent: boolean; error?: string };
  }>((accumulator, [key, result]) => {
    accumulator[key] = result;
    return accumulator;
  }, {});
}

export async function processCronNotifications(type: Exclude<NotificationEmailType, 'both'>) {
  const reminderType = type === 'reminder' ? 'morning_reminder' : 'evening_summary';
  const users = await getUsersForEmailReminder(reminderType);

  const results = await runWithConcurrency(
    users,
    runtimeTuning.performance.asyncProcessing.externalConcurrency,
    async (user) => {
      try {
        const sent = type === 'reminder'
          ? await sendReminderEmail(user.userId, user.userEmail, user.schedule, user.target)
          : await sendSummaryEmail(user.userId, user.userEmail, user.schedule, user.target);

        logger.info(`Processed ${type} notification for ${user.userEmail}`, {
          userId: user.userId,
          scheduledTime: type === 'reminder' ? user.schedule.reminder_time : user.schedule.summary_time,
          sent,
        });

        return {
          user: user.userEmail,
          type,
          success: sent,
          scheduledTime: type === 'reminder' ? user.schedule.reminder_time : user.schedule.summary_time,
        };
      } catch (error: any) {
        logger.error(`Failed to process ${type} notification for ${user.userEmail}`, error);
        return {
          user: user.userEmail,
          type,
          success: false,
          error: error?.message || 'Unknown error',
          scheduledTime: type === 'reminder' ? user.schedule.reminder_time : user.schedule.summary_time,
        };
      }
    }
  );

  return {
    usersChecked: users.length,
    results,
  };
}
