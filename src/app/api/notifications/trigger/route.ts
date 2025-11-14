import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp } from '@/lib/firebase-admin';
import sgMail from '@sendgrid/mail';
import { format } from 'date-fns';

// Initialize SendGrid
const sendGridApiKey = process.env.SENDGRID_API_KEY;
if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
}

// Get applications for today
async function getApplicationsToday(userId: string) {
  try {
    const applicationsCol = adminDb.collection('job_applications');
    const snapshot = await applicationsCol
      .where('user_id', '==', userId)
      .get();
    
    const todayString = format(new Date(), 'yyyy-MM-dd');
    
    return snapshot.docs
      .map(doc => {
        const data = doc.data();
        let appliedDate: Date;
        if (data.applied_date?.toDate) {
          appliedDate = data.applied_date.toDate();
        } else if (data.applied_date instanceof Date) {
          appliedDate = data.applied_date;
        } else if (data.applied_date) {
          appliedDate = new Date(data.applied_date);
        } else {
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

// Replace template variables
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
    
    if (error.response?.body?.errors) {
      const sendGridError = error.response.body.errors[0];
      console.error('SendGrid error:', sendGridError.message);
    }
    
    return false;
  }
}

// Send reminder email
async function sendReminderEmail(userId: string, userEmail: string, schedule: any, target: any) {
  const applicationsToday = await getApplicationsToday(userId);
  const progressPercentage = (applicationsToday.length / target.daily_target) * 100;
  const motivationalMessage = generateMotivationalMessage(applicationsToday.length, target.daily_target);
  
  const template = schedule.reminder_email_template || `Good morning! 🌅

It's time to focus on your job search goals for today.

Your daily target: {{daily_target}} applications
Applications made today: {{applications_today}}

Remember: Consistency is key to landing your dream job. You've got this! 💪

Best regards,
Application Console`;

  const variables = {
    daily_target: target.daily_target,
    applications_today: applicationsToday.length,
    progress_percentage: progressPercentage,
    motivational_message: motivationalMessage
  };

  const content = replaceTemplateVariables(template, variables);
  const subject = `🌅 Daily Job Search Reminder - ${new Date().toLocaleDateString()}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #FF9900, #E65C00); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🌅 Application Console</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Daily Job Search Reminder</p>
      </div>
      
      <div style="background: #f5f1ec; padding: 30px; border-radius: 0 0 10px 10px;">
        <div style="white-space: pre-line; color: #333; line-height: 1.6; font-size: 16px;">
          ${content}
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; padding: 20px; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          Sent from Application Console via SendGrid<br>
          Domain: appconsole.tech
        </p>
      </div>
    </div>
  `;
  
  return await sendEmail(userEmail, subject, htmlContent);
}

// Send summary email
async function sendSummaryEmail(userId: string, userEmail: string, schedule: any, target: any) {
  const applicationsToday = await getApplicationsToday(userId);
  const progressPercentage = (applicationsToday.length / target.daily_target) * 100;
  const motivationalMessage = generateMotivationalMessage(applicationsToday.length, target.daily_target);
  
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

  const variables = {
    daily_target: target.daily_target,
    applications_today: applicationsToday.length,
    progress_percentage: progressPercentage,
    motivational_message: motivationalMessage
  };

  const content = replaceTemplateVariables(template, variables);
  const subject = `🌙 Daily Job Search Summary - ${new Date().toLocaleDateString()}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #FF9900, #E65C00); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🌙 Application Console</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Daily Job Search Summary</p>
      </div>
      
      <div style="background: #f5f1ec; padding: 30px; border-radius: 0 0 10px 10px;">
        <div style="white-space: pre-line; color: #333; line-height: 1.6; font-size: 16px;">
          ${content}
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; padding: 20px; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          Sent from Application Console via SendGrid<br>
          Domain: appconsole.tech
        </p>
      </div>
    </div>
  `;
  
  return await sendEmail(userEmail, subject, htmlContent);
}

/**
 * Manual trigger endpoint for email notifications
 * 
 * Query parameters:
 * - email: (required) Email address of the user
 * - type: 'reminder' | 'summary' | 'both' (default: 'both')
 * 
 * Example usage:
 * GET /api/notifications/trigger?email=naveenvenkat58@gmail.com&type=both
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const emailType = searchParams.get('type') || 'both';

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required. Example: /api/notifications/trigger?email=your@email.com&type=both' },
        { status: 400 }
      );
    }

    // Find user by email
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

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    // Get schedule
    const scheduleSnapshot = await adminDb.collection('schedules')
      .where('user_id', '==', userId)
      .limit(1)
      .get();

    if (scheduleSnapshot.empty) {
      return NextResponse.json(
        { error: 'No schedule found for this user. Please set up email notifications in Settings.' },
        { status: 404 }
      );
    }

    const schedule = scheduleSnapshot.docs[0].data();
    
    if (!schedule.email_enabled) {
      return NextResponse.json(
        { error: 'Email notifications are not enabled for this user. Please enable them in Settings.' },
        { status: 400 }
      );
    }

    // Get today's target
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetSnapshot = await adminDb.collection('targets')
      .where('user_id', '==', userId)
      .where('current_date', '==', Timestamp.fromDate(today))
      .limit(1)
      .get();

    if (targetSnapshot.empty) {
      return NextResponse.json(
        { error: 'No target found for today. Please set a daily target.' },
        { status: 404 }
      );
    }

    const target = targetSnapshot.docs[0].data();

    const results: {
      reminder?: { sent: boolean; error?: string };
      summary?: { sent: boolean; error?: string };
    } = {};

    // Send reminder email
    if (emailType === 'reminder' || emailType === 'both') {
      try {
        console.log(`📧 Manually triggering reminder email to ${email}...`);
        const sent = await sendReminderEmail(
          userId,
          email,
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
            daily_target: target.daily_target,
            current_date: target.current_date.toDate(),
            applications_done: target.applications_done || 0,
            status_color: target.status_color || 'Green',
          }
        );
        results.reminder = { sent, error: sent ? undefined : 'Failed to send' };
        if (sent) {
          console.log(`✅ Reminder email sent successfully to ${email}`);
        }
      } catch (error: any) {
        console.error(`❌ Error sending reminder to ${email}:`, error);
        results.reminder = { sent: false, error: error.message || 'Unknown error' };
      }
    }

    // Send summary email
    if (emailType === 'summary' || emailType === 'both') {
      try {
        console.log(`📧 Manually triggering summary email to ${email}...`);
        const sent = await sendSummaryEmail(
          userId,
          email,
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
            daily_target: target.daily_target,
            current_date: target.current_date.toDate(),
            applications_done: target.applications_done || 0,
            status_color: target.status_color || 'Green',
          }
        );
        results.summary = { sent, error: sent ? undefined : 'Failed to send' };
        if (sent) {
          console.log(`✅ Summary email sent successfully to ${email}`);
        }
      } catch (error: any) {
        console.error(`❌ Error sending summary to ${email}:`, error);
        results.summary = { sent: false, error: error.message || 'Unknown error' };
      }
    }

    const success = 
      (emailType === 'reminder' && results.reminder?.sent) ||
      (emailType === 'summary' && results.summary?.sent) ||
      (emailType === 'both' && results.reminder?.sent && results.summary?.sent);

    return NextResponse.json({
      success,
      message: success 
        ? `Email(s) sent successfully to ${email}` 
        : 'Some emails failed to send. Check errors below.',
      timestamp: new Date().toISOString(),
      email,
      type: emailType,
      results,
      schedule: {
        reminder_time: schedule.reminder_time,
        summary_time: schedule.summary_time,
        email_enabled: schedule.email_enabled,
      },
      target: {
        daily_target: target.daily_target,
        applications_done: target.applications_done || 0,
      },
    });

  } catch (error: any) {
    console.error('Error in trigger endpoint:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to trigger emails',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

