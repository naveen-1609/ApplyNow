'use server';

import { getFirestore, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import type { JobApplication, Schedule, Target } from '@/lib/types';
import { format } from 'date-fns';
import sgMail from '@sendgrid/mail';

// Ensure Firebase is initialized for server-side use
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

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Email template variables
export interface EmailVariables {
  daily_target: number;
  applications_today: number;
  progress_percentage: number;
  motivational_message: string;
}

// Get user's applications for today
async function getUserApplicationsToday(userId: string): Promise<JobApplication[]> {
  if (!db) return [];
  
  const applicationsCol = collection(db, `users/${userId}/applications`);
  const snapshot = await getDocs(applicationsCol);
  
  const todayString = format(new Date(), 'yyyy-MM-dd');
  
  return snapshot.docs
    .map(doc => {
      const data = doc.data();
      return {
        job_id: doc.id,
        user_id: data.user_id,
        company_name: data.company_name,
        job_title: data.job_title,
        job_link: data.job_link,
        job_description: data.job_description,
        resume_id: data.resume_id,
        status: data.status,
        applied_date: data.applied_date.toDate(),
        last_updated: data.last_updated.toDate(),
      } as JobApplication;
    })
    .filter(app => format(app.applied_date, 'yyyy-MM-dd') === todayString);
}

// Generate motivational message based on progress
function generateMotivationalMessage(applicationsToday: number, dailyTarget: number): string {
  const progress = (applicationsToday / dailyTarget) * 100;
  
  if (progress >= 100) {
    return "🎉 Amazing! You've exceeded your daily target! You're on fire today!";
  } else if (progress >= 75) {
    return "🔥 Great progress! You're almost there. Just a few more applications to go!";
  } else if (progress >= 50) {
    return "💪 Good work so far! You're halfway to your goal. Keep pushing forward!";
  } else if (progress >= 25) {
    return "🚀 You've made a start! Every application counts. Keep the momentum going!";
  } else if (progress > 0) {
    return "🌟 Every journey begins with a single step. You've taken yours today!";
  } else {
    return "💡 Today is a fresh start! Your dream job is waiting for you. Let's make it happen!";
  }
}

// Replace template variables with actual values
function replaceTemplateVariables(template: string, variables: EmailVariables): string {
  return template
    .replace(/\{\{daily_target\}\}/g, variables.daily_target.toString())
    .replace(/\{\{applications_today\}\}/g, variables.applications_today.toString())
    .replace(/\{\{progress_percentage\}\}/g, Math.round(variables.progress_percentage).toString())
    .replace(/\{\{motivational_message\}\}/g, variables.motivational_message);
}

// Send email using SendGrid
async function sendEmail(to: string, subject: string, content: string): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured. Email not sent.');
      return false;
    }

    // Use domain email address
    const fromEmail = 'info@appconsole.tech';

    const msg = {
      to,
      from: {
        email: fromEmail,
        name: 'Application Console'
      },
      subject,
      html: content,
    };

    try {
      await sgMail.send(msg);
      console.log(`Email sent successfully to ${to} from ${fromEmail}`);
      return true;
    } catch (error) {
      // If verification error, provide helpful message
      if ((error as any).response?.body?.errors?.[0]?.message?.includes('verified Sender Identity')) {
        console.error('❌ Domain not authenticated. Please authenticate appconsole.tech in SendGrid Dashboard → Settings → Sender Authentication');
        return false;
      }
      throw error;
    }
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Send reminder email
export async function sendReminderEmail(userId: string, userEmail: string, schedule: Schedule, target: Target): Promise<boolean> {
  try {
    const applicationsToday = await getUserApplicationsToday(userId);
    const variables: EmailVariables = {
      daily_target: target.daily_target,
      applications_today: applicationsToday.length,
      progress_percentage: (applicationsToday.length / target.daily_target) * 100,
      motivational_message: generateMotivationalMessage(applicationsToday.length, target.daily_target),
    };

    const template = schedule.reminder_email_template || `Good morning! 🌅

It's time to focus on your job search goals for today.

Your daily target: {{daily_target}} applications
Applications made today: {{applications_today}}

Remember: Consistency is key to landing your dream job. You've got this! 💪

Best regards,
Application Console`;

    const content = replaceTemplateVariables(template, variables);
    const subject = `🌅 Daily Job Search Reminder - ${format(new Date(), 'MMM d, yyyy')}`;

    return await sendEmail(userEmail, subject, content);
  } catch (error) {
    console.error('Failed to send reminder email:', error);
    return false;
  }
}

// Send summary email
export async function sendSummaryEmail(userId: string, userEmail: string, schedule: Schedule, target: Target): Promise<boolean> {
  try {
    const applicationsToday = await getUserApplicationsToday(userId);
    const variables: EmailVariables = {
      daily_target: target.daily_target,
      applications_today: applicationsToday.length,
      progress_percentage: (applicationsToday.length / target.daily_target) * 100,
      motivational_message: generateMotivationalMessage(applicationsToday.length, target.daily_target),
    };

    const template = schedule.summary_email_template || `Good evening! 🌙

Here's your daily job search summary:

📊 Today's Progress:
• Applications submitted: {{applications_today}}
• Daily target: {{daily_target}}
• Progress: {{progress_percentage}}%

{{motivational_message}}

Keep up the great work! Every application brings you closer to your goal. 🚀

Best regards,
Application Console`;

    const content = replaceTemplateVariables(template, variables);
    const subject = `🌙 Daily Job Search Summary - ${format(new Date(), 'MMM d, yyyy')}`;

    return await sendEmail(userEmail, subject, content);
  } catch (error) {
    console.error('Failed to send summary email:', error);
    return false;
  }
}

// Get all users who should receive emails at the current time
export async function getUsersForEmailReminder(reminderType: 'morning_reminder' | 'evening_summary'): Promise<Array<{
  userId: string;
  userEmail: string;
  schedule: Schedule;
  target: Target;
}>> {
  if (!db) return [];

  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, '0');
  const currentMinute = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${currentHour}:${currentMinute}`;

  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('schedule.email_enabled', '==', true)
    );
    const usersSnapshot = await getDocs(usersQuery);

    const users: Array<{
      userId: string;
      userEmail: string;
      schedule: Schedule;
      target: Target;
    }> = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const schedule = userData.schedule as Schedule;
      const target = userData.target as Target;
      const userEmail = userData.email as string;

      if (!userEmail || !schedule || !target) continue;

      const shouldSendReminder = 
        reminderType === 'morning_reminder' && 
        schedule.reminder_time === currentTime;
      
      const shouldSendSummary = 
        reminderType === 'evening_summary' && 
        schedule.summary_time === currentTime;

      if (shouldSendReminder || shouldSendSummary) {
        users.push({
          userId: userDoc.id,
          userEmail,
          schedule,
          target,
        });
      }
    }

    return users;
  } catch (error) {
    console.error('Failed to get users for email reminder:', error);
    return [];
  }
}
