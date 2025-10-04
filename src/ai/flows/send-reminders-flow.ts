'use server';
/**
 * @fileOverview A flow to send daily email reminders and summaries.
 * This is designed to be triggered by a scheduled cron job.
 *
 * - sendReminders - A function that handles sending emails based on reminder type.
 * - ReminderInput - The input type for the sendReminders function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import type { JobApplication, User, Schedule } from '@/lib/types';
import { format } from 'date-fns';

// Ensure Firebase is initialized for server-side use.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (getApps().length === 0 && firebaseConfig.projectId) {
  initializeApp(firebaseConfig);
}

const db = getFirestore();

// Schemas
const ReminderInputSchema = z.object({
  reminderType: z.enum(['morning_reminder', 'evening_summary']).describe('The type of reminder to send.'),
});
export type ReminderInput = z.infer<typeof ReminderInputSchema>;

const ReminderOutputSchema = z.object({
  status: z.string(),
  emailsSent: z.number(),
  details: z.array(z.string()),
});

// Helper function to get applications for a specific user
async function getUserApplications(userId: string): Promise<JobApplication[]> {
  const q = query(collection(db, `users/${userId}/applications`));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      job_id: doc.id,
      applied_date: (data.applied_date as Timestamp).toDate(),
      last_updated: (data.last_updated as Timestamp).toDate(),
    } as JobApplication;
  });
}

// Main Flow
export const sendRemindersFlow = ai.defineFlow(
  {
    name: 'sendRemindersFlow',
    inputSchema: ReminderInputSchema,
    outputSchema: ReminderOutputSchema,
  },
  async ({ reminderType }) => {
    const output = { status: 'Failed', emailsSent: 0, details: [] as string[] };

    if (!db) {
      output.details.push('Firestore is not initialized.');
      return output;
    }
    
    // Get current time to match user's local time setting
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');

    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('schedule.email_enabled', '==', true)
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        output.status = 'Success';
        output.details.push('No users with email notifications enabled.');
        return output;
      }
      
      const emailPromises: Promise<void>[] = [];

      for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data() as { email?: string; schedule: Schedule, target: { daily_target: number } };
          const userEmail = userData.email; // Assuming email is stored at the root of the user doc
          const schedule = userData.schedule;

          if (!userEmail || !schedule) continue;

          const shouldSendMorningReminder =
            reminderType === 'morning_reminder' &&
            schedule.reminder_time.startsWith(currentHour);
          
          const shouldSendEveningSummary =
            reminderType === 'evening_summary' &&
            schedule.summary_time.startsWith(currentHour);

          if (shouldSendMorningReminder) {
            emailPromises.push((async () => {
              const target = userData.target?.daily_target || 3;
              // !! Placeholder for actual email sending logic !!
              console.log(`[EMAIL SIM] Sending MORNING REMINDER to ${userEmail}. Daily target: ${target}.`);
              output.details.push(`Sent morning reminder to ${userEmail}.`);
              output.emailsSent++;
            })());
          }

          if (shouldSendEveningSummary) {
             emailPromises.push((async () => {
                const applications = await getUserApplications(userDoc.id);
                const todayString = format(new Date(), 'yyyy-MM-dd');
                const todaysApps = applications.filter(app => format(app.applied_date, 'yyyy-MM-dd') === todayString);
                
                // !! Placeholder for actual email sending logic !!
                console.log(`[EMAIL SIM] Sending EVENING SUMMARY to ${userEmail}. You applied to ${todaysApps.length} jobs today.`);
                output.details.push(`Sent evening summary to ${userEmail} (${todaysApps.length} apps).`);
                output.emailsSent++;
            })());
          }
      }
      
      await Promise.all(emailPromises);
      output.status = 'Success';

    } catch (error: any) {
      output.details.push(`An error occurred: ${error.message}`);
    }
    
    return output;
  }
);

// This is the exported function you can call. In a real scenario, this would be an HTTP endpoint.
export async function sendReminders(input: ReminderInput) {
    return sendRemindersFlow(input);
}
