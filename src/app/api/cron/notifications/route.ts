import { NextRequest, NextResponse } from 'next/server';
import { getUserSettings } from '@/lib/services/users';
import { getSchedule } from '@/lib/services/schedules';
import { getTodayTarget } from '@/lib/services/targets';
import sgMail from '@sendgrid/mail';

// Set the API key - same as api-scheduler.js
sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'your_sendgrid_api_key_here');

// Mock applications for today (replace with actual API call)
function getApplicationsToday() {
  return [
    { job_title: 'Software Engineer', company: 'Tech Corp' },
    { job_title: 'Product Manager', company: 'Startup Inc' }
  ];
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

// Send email - exact same as api-scheduler.js
async function sendEmail(to: string, subject: string, content: string) {
  try {
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
    console.error('❌ Failed to send email:', error.message);
    return false;
  }
}

// Send reminder email
async function sendReminderEmail(userEmail: string, schedule: any, target: any) {
  const applicationsToday = getApplicationsToday();
  const progressPercentage = (applicationsToday.length / target.daily_target) * 100;
  const motivationalMessage = generateMotivationalMessage(applicationsToday.length, target.daily_target);
  
  // Use the actual email template from your notifications form
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

  // Convert plain text to HTML for better formatting
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
async function sendSummaryEmail(userEmail: string, schedule: any, target: any) {
  const applicationsToday = getApplicationsToday();
  const progressPercentage = (applicationsToday.length / target.daily_target) * 100;
  const motivationalMessage = generateMotivationalMessage(applicationsToday.length, target.daily_target);
  
  // Use the actual email template from your notifications form
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

  // Convert plain text to HTML for better formatting
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

// Get all users who have email notifications enabled
async function getAllUsersWithEmailEnabled() {
  try {
    // For now, we'll use a single user approach, but this can be extended
    // to fetch all users from your database
    const userId = process.env.USER_ID || 'current-user';
    
    // Get user settings (includes schedule and target)
    const settings = await getUserSettings(userId);
    
    if (!settings) {
      console.log('❌ User not found');
      return [];
    }
    
    // Get additional schedule details
    const schedule = await getSchedule(userId);
    const target = await getTodayTarget(userId);
    
    if (!schedule || !schedule.email_enabled) {
      console.log('❌ Email notifications not enabled for user');
      return [];
    }
    
    const user = {
      userId,
      email: (settings as any).email || 'naveenvenkat58@gmail.com',
      schedule: {
        reminder_time: schedule?.reminder_time || '07:55',
        summary_time: schedule?.summary_time || '20:01',
        email_enabled: schedule?.email_enabled || false,
        reminder_email_template: schedule?.reminder_email_template,
        summary_email_template: schedule?.summary_email_template
      },
      target: {
        daily_target: target?.daily_target || 5
      }
    };
    
    return [user];
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request
    const userAgent = request.headers.get('user-agent');
    if (!userAgent?.includes('vercel-cron')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - only Vercel cron jobs can access this endpoint' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const emailType = searchParams.get('type'); // 'reminder' or 'summary'
    
    const now = new Date();
    const currentTime = now.toISOString();
    
    console.log(`🕰️  Cron job triggered at ${currentTime} for type: ${emailType || 'all'}`);
    
    // Get all users with email notifications enabled
    const users = await getAllUsersWithEmailEnabled();
    
    if (users.length === 0) {
      console.log('⚠️  No users found with email notifications enabled');
      return NextResponse.json({ 
        success: true, 
        message: 'No users with email notifications enabled',
        timestamp: currentTime
      });
    }
    
    const results = [];
    
    // Process each user
    for (const user of users) {
      console.log(`👤 Processing user ${user.email}: reminder=${user.schedule.reminder_time}, summary=${user.schedule.summary_time}`);
      
      // Send reminder emails (morning)
      if (!emailType || emailType === 'reminder') {
        console.log(`📧 Sending reminder email to ${user.email}...`);
        const reminderResult = await sendReminderEmail(user.email, user.schedule, user.target);
        results.push({
          user: user.email,
          type: 'reminder',
          success: reminderResult,
          time: currentTime
        });
      }
      
      // Send summary emails (evening)
      if (!emailType || emailType === 'summary') {
        console.log(`📧 Sending summary email to ${user.email}...`);
        const summaryResult = await sendSummaryEmail(user.email, user.schedule, user.target);
        results.push({
          user: user.email,
          type: 'summary',
          success: summaryResult,
          time: currentTime
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cron job completed',
      timestamp: currentTime,
      emailType: emailType || 'all',
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
