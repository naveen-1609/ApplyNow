import { NextRequest, NextResponse } from 'next/server';
import { getUserSettings } from '@/lib/services/users';
import { getSchedule } from '@/lib/services/schedules';
import { getTodayTarget } from '@/lib/services/targets';
import { adminDb, Timestamp } from '@/lib/firebase-admin';
import sgMail from '@sendgrid/mail';
import { format } from 'date-fns';

// Initialize SendGrid - must have API key from environment
const sendGridApiKey = process.env.SENDGRID_API_KEY;

if (!sendGridApiKey) {
  console.error('⚠️ SENDGRID_API_KEY is not set in environment variables. Email notifications will not work.');
} else {
  sgMail.setApiKey(sendGridApiKey);
}

// Get real applications for today from Firestore
async function getApplicationsToday(userId: string) {
  try {
    // Use the correct collection name: 'job_applications' (not 'applications')
    const applicationsCol = adminDb.collection('job_applications');
    const snapshot = await applicationsCol
      .where('user_id', '==', userId)
      .get();
    
    const todayString = format(new Date(), 'yyyy-MM-dd');
    
    return snapshot.docs
      .map(doc => {
        const data = doc.data();
        // Handle both Timestamp and Date objects
        let appliedDate: Date;
        if (data.applied_date?.toDate) {
          appliedDate = data.applied_date.toDate();
        } else if (data.applied_date instanceof Date) {
          appliedDate = data.applied_date;
        } else if (data.applied_date) {
          appliedDate = new Date(data.applied_date);
        } else {
          // Fallback to last_updated if applied_date is missing
          appliedDate = data.last_updated?.toDate ? data.last_updated.toDate() : new Date();
        }
        
        return {
          job_title: data.job_title || '',
          company_name: data.company_name || '',
          applied_date: appliedDate,
        };
      })
      .filter(app => format(app.applied_date, 'yyyy-MM-dd') === todayString);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return [];
  }
}

// Generate motivational message
function generateMotivationalMessage(applicationsCount: number, dailyTarget: number) {
  const progressPercentage = (applicationsCount / dailyTarget) * 100;
  
  if (progressPercentage >= 100) {
    return "🎉 Excellent work! You've exceeded your daily target!";
  } else if (progressPercentage >= 80) {
    return "🚀 Great progress! You're almost at your goal!";
  } else if (progressPercentage >= 50) {
    return "💪 Good progress! Keep up the momentum!";
  } else {
    return "🌟 Every application counts! You're building momentum!";
  }
}

// Replace template variables with actual values
function replaceTemplateVariables(template: string, variables: any) {
  return template
    .replace(/\{\{daily_target\}\}/g, variables.daily_target.toString())
    .replace(/\{\{applications_today\}\}/g, variables.applications_today.toString())
    .replace(/\{\{progress_percentage\}\}/g, Math.round(variables.progress_percentage).toString())
    .replace(/\{\{motivational_message\}\}/g, variables.motivational_message);
}

// Send email using SendGrid
async function sendEmail(to: string, subject: string, content: string) {
  try {
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    
    if (!sendGridApiKey) {
      console.error('❌ SendGrid API key not configured. Email not sent.');
      return false;
    }

    const msg = {
      to,
      from: {
        email: 'info@appconsole.tech',
        name: 'Application Console'
      },
      subject,
      html: content,
    };

    await sgMail.send(msg);
    console.log(`✅ Email sent successfully to ${to}`);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send email:', error);
    
    // Check for specific SendGrid errors
    if (error.response?.body?.errors) {
      const sendGridError = error.response.body.errors[0];
      console.error('SendGrid error:', sendGridError.message);
      
      // Helpful error messages
      if (sendGridError.message?.includes('verified Sender Identity')) {
        console.error('💡 Fix: Authenticate your sender identity in SendGrid Dashboard → Settings → Sender Authentication');
      }
    }
    
    return false;
  }
}

// Create beautiful HTML email template for reminder
function createReminderEmailHTML(variables: any, customTemplate?: string): string {
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
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
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
              <div style="margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <span style="font-size: 14px; font-weight: 600; color: #374151;">Progress</span>
                  <span style="font-size: 18px; font-weight: 700; color: ${progressColor};">${progressPercentage}%</span>
                </div>
                <div style="background-color: #e5e7eb; border-radius: 10px; height: 12px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                  <div style="background: linear-gradient(90deg, ${progressColor} 0%, ${progressColor}dd 100%); height: 100%; width: ${Math.min(progressPercentage, 100)}%; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                </div>
              </div>
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #F59E0B; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <p style="margin: 0; color: #92400E; font-size: 16px; line-height: 1.6; font-weight: 500;">
                  ${variables.motivational_message}
                </p>
              </div>
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
function createSummaryEmailHTML(variables: any, customTemplate?: string): string {
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
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: linear-gradient(135deg, ${progressColor} 0%, ${progressColor}dd 100%); border-radius: 50px; padding: 12px 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <span style="font-size: 24px; margin-right: 8px;">${statusEmoji}</span>
                  <span style="color: #ffffff; font-weight: 600; font-size: 16px;">${progressPercentage}% Complete</span>
                </div>
              </div>
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
              <div style="margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <span style="font-size: 14px; font-weight: 600; color: #374151;">Today's Progress</span>
                  <span style="font-size: 18px; font-weight: 700; color: ${progressColor};">${progressPercentage}%</span>
                </div>
                <div style="background-color: #e5e7eb; border-radius: 10px; height: 16px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                  <div style="background: linear-gradient(90deg, ${progressColor} 0%, ${progressColor}dd 100%); height: 100%; width: ${Math.min(progressPercentage, 100)}%; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                </div>
              </div>
              <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-left: 4px solid #3B82F6; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <p style="margin: 0; color: #1E40AF; font-size: 16px; line-height: 1.6; font-weight: 500;">
                  ${variables.motivational_message}
                </p>
              </div>
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
async function sendReminderEmail(userId: string, userEmail: string, schedule: any, target: any) {
  const applicationsToday = await getApplicationsToday(userId);
  const progressPercentage = (applicationsToday.length / target.daily_target) * 100;
  const motivationalMessage = generateMotivationalMessage(applicationsToday.length, target.daily_target);
  
  const variables = {
    daily_target: target.daily_target,
    applications_today: applicationsToday.length,
    progress_percentage: progressPercentage,
    motivational_message: motivationalMessage
  };

  const subject = `🌅 Daily Job Search Reminder - ${format(new Date(), 'MMM d, yyyy')}`;
  
  // Create beautiful HTML email
  const htmlContent = createReminderEmailHTML(variables, schedule.reminder_email_template);
  
  return await sendEmail(userEmail, subject, htmlContent);
}

// Send summary email
async function sendSummaryEmail(userId: string, userEmail: string, schedule: any, target: any) {
  const applicationsToday = await getApplicationsToday(userId);
  const progressPercentage = (applicationsToday.length / target.daily_target) * 100;
  const motivationalMessage = generateMotivationalMessage(applicationsToday.length, target.daily_target);
  
  const variables = {
    daily_target: target.daily_target,
    applications_today: applicationsToday.length,
    progress_percentage: progressPercentage,
    motivational_message: motivationalMessage
  };

  const subject = `🌙 Daily Job Search Summary - ${format(new Date(), 'MMM d, yyyy')}`;
  
  // Create beautiful HTML email
  const htmlContent = createSummaryEmailHTML(variables, schedule.summary_email_template);
  
  return await sendEmail(userEmail, subject, htmlContent);
}

// Get all users who have email notifications enabled
// This function now returns ALL users with email enabled, not filtered by time
// The time filtering happens in the main GET handler
async function getAllUsersWithEmailEnabled() {
  try {
    // Get all users from Firestore
    const usersSnapshot = await adminDb.collection('users').get();
    
    const users: Array<{
      userId: string;
      email: string;
      schedule: any;
      target: any;
    }> = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userEmail = userData.email || userDoc.data().email;
      if (!userEmail) continue;
      
      // Get schedule from schedules collection
      const scheduleSnapshot = await adminDb.collection('schedules')
        .where('user_id', '==', userDoc.id)
        .limit(1)
        .get();
      
      const schedule = scheduleSnapshot.empty ? null : scheduleSnapshot.docs[0].data();
      
      // Check if email is enabled
      if (!schedule || !schedule.email_enabled) continue;
      
      // Get target from targets collection for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetSnapshot = await adminDb.collection('targets')
        .where('user_id', '==', userDoc.id)
        .where('current_date', '==', Timestamp.fromDate(today))
        .limit(1)
        .get();
      
      const target = targetSnapshot.empty ? null : targetSnapshot.docs[0].data();
      if (!target) continue;
      
      // Add user with their schedule and target (time checking happens in main handler)
      users.push({
        userId: userDoc.id,
        email: userEmail,
        schedule: {
          schedule_id: scheduleSnapshot.docs[0].id,
          user_id: schedule.user_id,
          reminder_time: schedule.reminder_time || '07:00',
          summary_time: schedule.summary_time || '22:00',
          email_enabled: schedule.email_enabled || false,
          reminder_email_template: schedule.reminder_email_template,
          summary_email_template: schedule.summary_email_template
        },
        target: {
          target_id: targetSnapshot.docs[0].id,
          user_id: target.user_id,
          daily_target: target.daily_target || 3,
          current_date: target.current_date.toDate(),
          applications_done: target.applications_done || 0,
          status_color: target.status_color || 'Green',
        }
      });
    }
    
    return users;
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (allow local testing with ?local=true)
    const { searchParams } = new URL(request.url);
    const isLocalTest = searchParams.get('local') === 'true';
    const userAgent = request.headers.get('user-agent');
    
    // Allow local testing or Vercel cron
    if (!isLocalTest && !userAgent?.includes('vercel-cron')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - only Vercel cron jobs can access this endpoint',
        hint: 'Add ?local=true to test locally'
      }, { status: 401 });
    }
    
    if (isLocalTest) {
      console.log('🧪 Local test mode - cron job triggered manually');
    }
    
    const now = new Date();
    const currentTime = now.toISOString();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMinute}`;
    
    console.log(`🕰️  Cron job triggered at ${currentTime} (UTC: ${currentTimeStr}) - checking all users' individual times`);
    console.log(`📅 Current UTC time: ${currentTimeStr}, Date: ${now.toDateString()}`);
    
    // Get all users with email notifications enabled
    const users = await getAllUsersWithEmailEnabled();
    
    if (users.length === 0) {
      console.log('⚠️  No users found with email notifications enabled at this time');
      return NextResponse.json({ 
        success: true, 
        message: 'No users with email notifications enabled at this time',
        timestamp: currentTime,
        currentTime: currentTimeStr
      });
    }
    
    const results = [];
    
    // Process each user - check their individual reminder_time and summary_time
    for (const user of users) {
      const reminderMatch = user.schedule.reminder_time === currentTimeStr;
      const summaryMatch = user.schedule.summary_time === currentTimeStr;
      console.log(`👤 Checking user ${user.email}:`);
      console.log(`   - Reminder time: ${user.schedule.reminder_time} (${reminderMatch ? '✅ MATCH' : '❌ no match'})`);
      console.log(`   - Summary time: ${user.schedule.summary_time} (${summaryMatch ? '✅ MATCH' : '❌ no match'})`);
      console.log(`   - Current UTC time: ${currentTimeStr}`);
      console.log(`   - Email enabled: ${user.schedule.email_enabled}`);
      
      // Send reminder emails if current time matches user's reminder_time
      if (user.schedule.reminder_time === currentTimeStr) {
        console.log(`📧 Sending reminder email to ${user.email} at ${user.schedule.reminder_time}...`);
        try {
          const reminderResult = await sendReminderEmail(user.userId, user.email, user.schedule, user.target);
          results.push({
            user: user.email,
            type: 'reminder',
            success: reminderResult,
            scheduledTime: user.schedule.reminder_time,
            currentTime: currentTimeStr
          });
          if (reminderResult) {
            console.log(`✅ Reminder email sent successfully to ${user.email}`);
          } else {
            console.log(`❌ Failed to send reminder email to ${user.email}`);
          }
        } catch (error: any) {
          console.error(`❌ Error sending reminder to ${user.email}:`, error);
          results.push({
            user: user.email,
            type: 'reminder',
            success: false,
            error: error.message || 'Unknown error',
            scheduledTime: user.schedule.reminder_time,
            currentTime: currentTimeStr
          });
        }
      }
      
      // Send summary emails if current time matches user's summary_time
      if (user.schedule.summary_time === currentTimeStr) {
        console.log(`📧 Sending summary email to ${user.email} at ${user.schedule.summary_time}...`);
        try {
          const summaryResult = await sendSummaryEmail(user.userId, user.email, user.schedule, user.target);
          results.push({
            user: user.email,
            type: 'summary',
            success: summaryResult,
            scheduledTime: user.schedule.summary_time,
            currentTime: currentTimeStr
          });
          if (summaryResult) {
            console.log(`✅ Summary email sent successfully to ${user.email}`);
          } else {
            console.log(`❌ Failed to send summary email to ${user.email}`);
          }
        } catch (error: any) {
          console.error(`❌ Error sending summary to ${user.email}:`, error);
          results.push({
            user: user.email,
            type: 'summary',
            success: false,
            error: error.message || 'Unknown error',
            scheduledTime: user.schedule.summary_time,
            currentTime: currentTimeStr
          });
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cron job completed - checked all users for their individual email times',
      timestamp: currentTime,
      currentTime: currentTimeStr,
      usersChecked: users.length,
      emailsSent: results.length,
      results
    });
    
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Cron job failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
