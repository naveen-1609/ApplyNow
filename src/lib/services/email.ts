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

// Initialize SendGrid - must have API key from environment
const sendGridApiKey = process.env.SENDGRID_API_KEY;

if (!sendGridApiKey) {
  console.error('⚠️ SENDGRID_API_KEY is not set in environment variables. Email notifications will not work.');
} else {
  sgMail.setApiKey(sendGridApiKey);
  console.log('✅ SendGrid initialized successfully');
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
  if (!db) {
    console.warn('Firestore not initialized, cannot fetch applications');
    return [];
  }
  
  try {
    // Get from applications collection (new structure)
    const applicationsCol = collection(db, 'applications');
    const applicationsQuery = query(
      applicationsCol,
      where('user_id', '==', userId)
    );
    const snapshot = await getDocs(applicationsQuery);
    
    const todayString = format(new Date(), 'yyyy-MM-dd');
    
    const applications = snapshot.docs
      .map(doc => {
        const data = doc.data();
        const appliedDate = data.applied_date?.toDate ? data.applied_date.toDate() : new Date(data.applied_date);
        const lastUpdated = data.last_updated?.toDate ? data.last_updated.toDate() : new Date();
        
        return {
          job_id: doc.id,
          user_id: data.user_id || userId,
          company_name: data.company_name || '',
          job_title: data.job_title || '',
          job_link: data.job_link || '',
          job_description: data.job_description || '',
          resume_id: data.resume_id || null,
          status: data.status || 'Applied',
          applied_date: appliedDate,
          last_updated: lastUpdated,
        } as JobApplication;
      })
      .filter(app => format(app.applied_date, 'yyyy-MM-dd') === todayString);
    
    return applications;
  } catch (error) {
    console.error('Error fetching applications for email:', error);
    return [];
  }
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
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    
    if (!sendGridApiKey) {
      console.error('❌ SendGrid API key not configured. Email not sent.');
      return false;
    }

    // Ensure SendGrid is initialized
    if (!sgMail) {
      console.error('❌ SendGrid not initialized');
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

// Create beautiful HTML email template for reminder
function createReminderEmailHTML(variables: EmailVariables, customTemplate?: string): string {
  const progressPercentage = Math.round(variables.progress_percentage);
  const progressColor = progressPercentage >= 100 ? '#10B981' : progressPercentage >= 75 ? '#3B82F6' : progressPercentage >= 50 ? '#F59E0B' : '#EF4444';
  
  // If custom template provided, use it but wrap in HTML
  if (customTemplate && customTemplate.trim() !== '') {
    const textContent = replaceTemplateVariables(customTemplate, variables);
    return createHTMLWrapper(textContent, 'reminder');
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Job Search Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF9900 0%, #E65C00 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                🌅 Good Morning!
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.95); font-size: 16px; font-weight: 400;">
                Time to Focus on Your Job Search Goals
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              <!-- Stats Cards -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="width: 50%; padding-right: 10px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 25px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <div style="font-size: 36px; font-weight: 700; color: #ffffff; margin-bottom: 5px;">
                        ${variables.applications_today}
                      </div>
                      <div style="font-size: 14px; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 0.5px;">
                        Applications Today
                      </div>
                    </div>
                  </td>
                  <td style="width: 50%; padding-left: 10px;">
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; padding: 25px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <div style="font-size: 36px; font-weight: 700; color: #ffffff; margin-bottom: 5px;">
                        ${variables.daily_target}
                      </div>
                      <div style="font-size: 14px; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 0.5px;">
                        Daily Target
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Progress Bar -->
              <div style="margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <span style="font-size: 14px; font-weight: 600; color: #374151;">Progress</span>
                  <span style="font-size: 18px; font-weight: 700; color: ${progressColor};">${progressPercentage}%</span>
                </div>
                <div style="background-color: #e5e7eb; border-radius: 10px; height: 12px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                  <div style="background: linear-gradient(90deg, ${progressColor} 0%, ${progressColor}dd 100%); height: 100%; width: ${Math.min(progressPercentage, 100)}%; border-radius: 10px; transition: width 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                </div>
              </div>
              
              <!-- Motivational Message -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #F59E0B; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <p style="margin: 0; color: #92400E; font-size: 16px; line-height: 1.6; font-weight: 500;">
                  ${variables.motivational_message}
                </p>
              </div>
              
              <!-- Call to Action -->
              <div style="text-align: center; margin-top: 30px;">
                <p style="margin: 0 0 15px 0; color: #6B7280; font-size: 15px; line-height: 1.6;">
                  Remember: Consistency is key to landing your dream job. You've got this! 💪
                </p>
                <div style="display: inline-block; background: linear-gradient(135deg, #FF9900 0%, #E65C00 100%); border-radius: 8px; padding: 14px 28px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <a href="https://appconsole.tech/dashboard" style="color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                    🚀 Start Applying Now
                  </a>
                </div>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9CA3AF; font-size: 13px; line-height: 1.5;">
                Sent from <strong style="color: #FF9900;">Application Console</strong><br>
                Your personal job search assistant
              </p>
              <p style="margin: 10px 0 0 0; color: #D1D5DB; font-size: 12px;">
                ${format(new Date(), 'MMMM d, yyyy')} • appconsole.tech
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Create beautiful HTML email template for summary
function createSummaryEmailHTML(variables: EmailVariables, customTemplate?: string): string {
  const progressPercentage = Math.round(variables.progress_percentage);
  const progressColor = progressPercentage >= 100 ? '#10B981' : progressPercentage >= 75 ? '#3B82F6' : progressPercentage >= 50 ? '#F59E0B' : '#EF4444';
  const statusEmoji = progressPercentage >= 100 ? '🎉' : progressPercentage >= 75 ? '🔥' : progressPercentage >= 50 ? '💪' : '🚀';
  
  // If custom template provided, use it but wrap in HTML
  if (customTemplate && customTemplate.trim() !== '') {
    const textContent = replaceTemplateVariables(customTemplate, variables);
    return createHTMLWrapper(textContent, 'summary');
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Job Search Summary</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                🌙 Good Evening!
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.95); font-size: 16px; font-weight: 400;">
                Your Daily Job Search Summary
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              <!-- Status Badge -->
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: linear-gradient(135deg, ${progressColor} 0%, ${progressColor}dd 100%); border-radius: 50px; padding: 12px 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <span style="font-size: 24px; margin-right: 8px;">${statusEmoji}</span>
                  <span style="color: #ffffff; font-weight: 600; font-size: 16px;">${progressPercentage}% Complete</span>
                </div>
              </div>
              
              <!-- Stats Grid -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="width: 33.33%; padding: 0 5px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <div style="font-size: 32px; font-weight: 700; color: #ffffff; margin-bottom: 5px;">
                        ${variables.applications_today}
                      </div>
                      <div style="font-size: 12px; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 0.5px;">
                        Submitted
                      </div>
                    </div>
                  </td>
                  <td style="width: 33.33%; padding: 0 5px;">
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <div style="font-size: 32px; font-weight: 700; color: #ffffff; margin-bottom: 5px;">
                        ${variables.daily_target}
                      </div>
                      <div style="font-size: 12px; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 0.5px;">
                        Target
                      </div>
                    </div>
                  </td>
                  <td style="width: 33.33%; padding: 0 5px;">
                    <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <div style="font-size: 32px; font-weight: 700; color: #ffffff; margin-bottom: 5px;">
                        ${Math.max(0, variables.daily_target - variables.applications_today)}
                      </div>
                      <div style="font-size: 12px; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 0.5px;">
                        Remaining
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Progress Bar -->
              <div style="margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <span style="font-size: 14px; font-weight: 600; color: #374151;">Today's Progress</span>
                  <span style="font-size: 18px; font-weight: 700; color: ${progressColor};">${progressPercentage}%</span>
                </div>
                <div style="background-color: #e5e7eb; border-radius: 10px; height: 16px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                  <div style="background: linear-gradient(90deg, ${progressColor} 0%, ${progressColor}dd 100%); height: 100%; width: ${Math.min(progressPercentage, 100)}%; border-radius: 10px; transition: width 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                </div>
              </div>
              
              <!-- Motivational Message -->
              <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-left: 4px solid #3B82F6; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <p style="margin: 0; color: #1E40AF; font-size: 16px; line-height: 1.6; font-weight: 500;">
                  ${variables.motivational_message}
                </p>
              </div>
              
              <!-- Call to Action -->
              <div style="text-align: center; margin-top: 30px;">
                <p style="margin: 0 0 15px 0; color: #6B7280; font-size: 15px; line-height: 1.6;">
                  Keep up the great work! Every application brings you closer to your goal. 🚀
                </p>
                <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 14px 28px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <a href="https://appconsole.tech/dashboard" style="color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                    📊 View Dashboard
                  </a>
                </div>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9CA3AF; font-size: 13px; line-height: 1.5;">
                Sent from <strong style="color: #667eea;">Application Console</strong><br>
                Your personal job search assistant
              </p>
              <p style="margin: 10px 0 0 0; color: #D1D5DB; font-size: 12px;">
                ${format(new Date(), 'MMMM d, yyyy')} • appconsole.tech
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Helper function to wrap custom template text in HTML
function createHTMLWrapper(textContent: string, type: 'reminder' | 'summary'): string {
  const headerColor = type === 'reminder' 
    ? 'linear-gradient(135deg, #FF9900 0%, #E65C00 100%)'
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  const headerEmoji = type === 'reminder' ? '🌅' : '🌙';
  const headerText = type === 'reminder' ? 'Daily Job Search Reminder' : 'Daily Job Search Summary';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerText}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: ${headerColor}; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                ${headerEmoji} ${headerText}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              <div style="color: #374151; font-size: 16px; line-height: 1.8; white-space: pre-line;">
                ${textContent.replace(/\n/g, '<br>')}
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9CA3AF; font-size: 13px; line-height: 1.5;">
                Sent from <strong style="color: #FF9900;">Application Console</strong><br>
                ${format(new Date(), 'MMMM d, yyyy')} • appconsole.tech
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
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

    const subject = `🌅 Daily Job Search Reminder - ${format(new Date(), 'MMM d, yyyy')}`;
    
    // Create beautiful HTML email
    const htmlContent = createReminderEmailHTML(variables, schedule.reminder_email_template);

    return await sendEmail(userEmail, subject, htmlContent);
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

    const subject = `🌙 Daily Job Search Summary - ${format(new Date(), 'MMM d, yyyy')}`;
    
    // Create beautiful HTML email
    const htmlContent = createSummaryEmailHTML(variables, schedule.summary_email_template);

    return await sendEmail(userEmail, subject, htmlContent);
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
  if (!db) {
    console.warn('Firestore not initialized, cannot fetch users');
    return [];
  }

  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, '0');
  const currentMinute = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${currentHour}:${currentMinute}`;

  try {
    // Get all users from users collection
    const usersCol = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCol);

    const users: Array<{
      userId: string;
      userEmail: string;
      schedule: Schedule;
      target: Target;
    }> = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userEmail = userData.email as string;
      
      if (!userEmail) continue;

      // Get schedule from schedules collection
      const schedulesCol = collection(db, 'schedules');
      const scheduleQuery = query(
        schedulesCol,
        where('user_id', '==', userDoc.id)
      );
      const scheduleSnapshot = await getDocs(scheduleQuery);
      
      if (scheduleSnapshot.empty) continue;
      
      const scheduleData = scheduleSnapshot.docs[0].data();
      const schedule = {
        schedule_id: scheduleSnapshot.docs[0].id,
        user_id: scheduleData.user_id,
        reminder_time: scheduleData.reminder_time,
        summary_time: scheduleData.summary_time,
        email_enabled: scheduleData.email_enabled,
        reminder_email_template: scheduleData.reminder_email_template,
        summary_email_template: scheduleData.summary_email_template,
      } as Schedule;

      if (!schedule.email_enabled) continue;

      // Get target from targets collection for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetsCol = collection(db, 'targets');
      const targetQuery = query(
        targetsCol,
        where('user_id', '==', userDoc.id),
        where('current_date', '==', Timestamp.fromDate(today))
      );
      const targetSnapshot = await getDocs(targetQuery);
      
      if (targetSnapshot.empty) continue;
      
      const targetData = targetSnapshot.docs[0].data();
      const target = {
        target_id: targetSnapshot.docs[0].id,
        user_id: targetData.user_id,
        daily_target: targetData.daily_target,
        current_date: targetData.current_date.toDate(),
        applications_done: targetData.applications_done || 0,
        status_color: targetData.status_color || 'Green',
      } as Target;

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
