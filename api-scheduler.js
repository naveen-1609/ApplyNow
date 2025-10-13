// API-based email scheduler - Uses your Application Console API endpoints
const sgMail = require('@sendgrid/mail');

// Set the API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'your_sendgrid_api_key_here');

// Mock applications for today (replace with actual API call)
function getApplicationsToday() {
  return [
    { job_title: 'Software Engineer', company: 'Tech Corp' },
    { job_title: 'Product Manager', company: 'Startup Inc' }
  ];
}

// Generate motivational message
function generateMotivationalMessage(applicationsCount, dailyTarget) {
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
function replaceTemplateVariables(template, variables) {
  return template
    .replace(/\{\{daily_target\}\}/g, variables.daily_target.toString())
    .replace(/\{\{applications_today\}\}/g, variables.applications_today.toString())
    .replace(/\{\{progress_percentage\}\}/g, Math.round(variables.progress_percentage).toString())
    .replace(/\{\{motivational_message\}\}/g, variables.motivational_message);
}

// Send email
async function sendEmail(to, subject, content) {
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
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    return false;
  }
}

// Send reminder email
async function sendReminderEmail(userEmail, schedule, target) {
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
async function sendSummaryEmail(userEmail, schedule, target) {
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

// Enhanced user settings with caching and non-blocking operations
const settingsCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Non-blocking fetch with retry logic
async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`🔄 Retry ${i + 1}/${retries} for ${url}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
    }
  }
}

// Get user settings from your Application Console API with caching
async function getUserSettings() {
  try {
    // ⚠️ IMPORTANT: Replace 'current-user' with your actual user ID from Firebase
    // You can find this in your browser's developer tools when logged into the app
    const userId = 'current-user'; // TODO: Replace with actual user ID
    const cacheKey = `settings_${userId}`;
    
    // Check cache first
    const cached = settingsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📋 Using cached settings');
      return cached.data;
    }
    
    console.log(`📡 Fetching settings from Application Console API for user: ${userId}`);
    
    const response = await fetchWithRetry(`http://localhost:9002/api/scheduler/settings?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`API error: ${result.error}`);
    }
    
    // Cache the result
    settingsCache.set(cacheKey, {
      data: result.data,
      timestamp: Date.now()
    });
    
    console.log('✅ Successfully fetched settings from Application Console');
    console.log(`📧 Email: ${result.data.email}`);
    console.log(`🌅 Reminder time: ${result.data.schedule.reminder_time}`);
    console.log(`🌙 Summary time: ${result.data.schedule.summary_time}`);
    console.log(`🎯 Daily target: ${result.data.target.daily_target}`);
    console.log(`📧 Email enabled: ${result.data.schedule.email_enabled}`);
    
    return result.data;
  } catch (error) {
    console.error('❌ Failed to get user settings from API:', error.message);
    console.log('💡 Falling back to mock data. To fix this:');
    console.log('   1. Make sure your Application Console app is running on http://localhost:9002');
    console.log('   2. Replace "current-user" with your actual Firebase user ID');
    console.log('   3. Check that the API endpoint is working');
    
    // Fallback to mock data if API fails
    const fallbackData = {
      userId: 'current-user',
      email: 'naveenvenkat58@gmail.com',
      schedule: {
        reminder_time: '07:55',
        summary_time: '20:01',
        email_enabled: true,
        reminder_email_template: `Good morning! 🌅

It's time to focus on your job search goals for today.

Your daily target: {{daily_target}} applications
Applications made today: {{applications_today}}

Remember: Consistency is key to landing your dream job. You've got this! 💪

Best regards,
Application Console`,
        summary_email_template: `Good evening! 🌙

Here's your daily job search summary:

📊 Today's Progress:
• Applications submitted: {{applications_today}}
• Daily target: {{daily_target}}
• Progress: {{progress_percentage}}%

{{motivational_message}}

Keep up the great work! Every application brings you closer to your goal. 🚀

Best regards,
Application Console`
      },
      target: {
        daily_target: 5
      }
    };
    
    // Cache fallback data to avoid repeated API calls
    settingsCache.set(`settings_${fallbackData.userId}`, {
      data: fallbackData,
      timestamp: Date.now()
    });
    
    return fallbackData;
  }
}
// Non-blocking email queue for processing emails in background
const emailQueue = [];
let isProcessingQueue = false;

// Process email queue without blocking
async function processEmailQueue() {
  if (isProcessingQueue || emailQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (emailQueue.length > 0) {
    const emailTask = emailQueue.shift();
    try {
      await emailTask();
    } catch (error) {
      console.error('❌ Error processing email task:', error);
    }
  }
  
  isProcessingQueue = false;
}

// Add email task to queue
function queueEmailTask(emailTask) {
  emailQueue.push(emailTask);
  // Process queue in background without blocking
  setImmediate(processEmailQueue);
}

// Check and send emails based on user settings (non-blocking)
async function checkAndSendEmails() {
  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, '0');
  const currentMinute = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${currentHour}:${currentMinute}`;
  console.log(`🕰️  Checking emails at ${currentTime}`);
  
  try {
    // Get user settings asynchronously without blocking
    const user = await getUserSettings();
    if (!user || !user.schedule.email_enabled) {
      console.log('⚠️  No user found or email notifications disabled');
      return;
    }
    
    console.log(`👤 Checking user: reminder=${user.schedule.reminder_time}, summary=${user.schedule.summary_time}`);
    
    // Check if it's time for reminder email
    if (user.schedule.reminder_time === currentTime) {
      console.log(`📧 Time for reminder email! Queuing for ${user.email}...`);
      queueEmailTask(async () => {
        console.log(`📧 Sending reminder email to ${user.email}...`);
        await sendReminderEmail(user.email, user.schedule, user.target);
      });
    }
    
    // Check if it's time for summary email
    if (user.schedule.summary_time === currentTime) {
      console.log(`📧 Time for summary email! Queuing for ${user.email}...`);
      queueEmailTask(async () => {
        console.log(`📧 Sending summary email to ${user.email}...`);
        await sendSummaryEmail(user.email, user.schedule, user.target);
      });
    }
  } catch (error) {
    console.error('❌ Error checking scheduled emails:', error);
  }
}
// Start the API scheduler
console.log('🚀 Starting API Email Scheduler...');
console.log('==================================');
console.log('📊 Reading email settings from Application Console...');
console.log('⏰ Checking every minute for scheduled emails...');
console.log('');
// Get user settings to display current configuration
async function displayCurrentConfiguration() {
  try {
    const user = await getUserSettings();
    if (user) {
      console.log('✅ API email scheduler is running!');
      console.log('🔄 The system will read your settings from Application Console API');
      console.log('📧 Emails will be sent based on your Settings → Notifications times');
      console.log('📝 Email templates will be used from your Settings → Notifications form');
      console.log('');
      console.log('💡 TO UPDATE SETTINGS:');
      console.log('   1. Go to your Application Console app');
      console.log('   2. Go to Settings → Notifications');
      console.log('   3. Change the reminder and summary times');
      console.log('   4. Customize the email templates');
      console.log('   5. Save the settings');
      console.log('   6. The scheduler will automatically pick up your changes!');
      console.log('');
      console.log('🔧 CURRENT CONFIGURATION:');
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🌅 Reminder time: ${user.schedule.reminder_time}`);
      console.log(`   🌙 Summary time: ${user.schedule.summary_time}`);
      console.log(`   🎯 Daily target: ${user.target.daily_target}`);
      console.log('   📝 Using email templates from notifications form');
    } else {
      console.log('⚠️  Could not load user settings');
    }
  } catch (error) {
    console.error('❌ Error loading configuration:', error);
  }
}
// Run immediately to check current time
checkAndSendEmails();
// Display current configuration
displayCurrentConfiguration();
// Run every minute
setInterval(checkAndSendEmails, 60000); // 60 seconds = 1 minute