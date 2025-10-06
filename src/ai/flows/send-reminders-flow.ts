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
import { getUsersForEmailReminder, sendReminderEmail, sendSummaryEmail } from '@/lib/services/email';

// Schemas
const ReminderInputSchema = z.object({
  reminderType: z.enum(['morning_reminder', 'evening_summary']).describe('The type of reminder to send.'),
});
export type ReminderInput = z.infer<typeof ReminderInputSchema>;

const ReminderOutputSchema = z.object({
  status: z.string().describe('The status of the email sending operation.'),
  emailsSent: z.number().describe('The number of emails sent.'),
  details: z.array(z.string()).describe('Details about the operation.'),
});
export type ReminderOutput = z.infer<typeof ReminderOutputSchema>;

// Main Flow
export const sendRemindersFlow = ai.defineFlow(
  {
    name: 'sendRemindersFlow',
    inputSchema: ReminderInputSchema,
    outputSchema: ReminderOutputSchema,
  },
  async ({ reminderType }) => {
    const output = { status: 'Failed', emailsSent: 0, details: [] as string[] };

    try {
      // Get users who should receive emails at this time
      const users = await getUsersForEmailReminder(reminderType);
      
      if (users.length === 0) {
        output.status = 'Success';
        output.details.push('No users scheduled for emails at this time.');
        return output;
      }

      const emailPromises: Promise<boolean>[] = [];

      for (const user of users) {
        if (reminderType === 'morning_reminder') {
          emailPromises.push(
            sendReminderEmail(user.userId, user.userEmail, user.schedule, user.target)
          );
        } else if (reminderType === 'evening_summary') {
          emailPromises.push(
            sendSummaryEmail(user.userId, user.userEmail, user.schedule, user.target)
          );
        }
      }

      const results = await Promise.all(emailPromises);
      const successfulEmails = results.filter(result => result).length;
      
      output.status = 'Success';
      output.emailsSent = successfulEmails;
      output.details.push(`Successfully sent ${successfulEmails} out of ${users.length} emails.`);

    } catch (error: any) {
      output.details.push(`Error: ${error.message}`);
    }
    
    return output;
  }
);

// This is the exported function you can call. In a real scenario, this would be an HTTP endpoint.
export async function sendReminders(input: ReminderInput) {
    return sendRemindersFlow(input);
}