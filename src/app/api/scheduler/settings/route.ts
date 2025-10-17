import { NextRequest, NextResponse } from 'next/server';
import { getUserSettings } from '@/lib/services/users';
import { getSchedule } from '@/lib/services/schedules';
import { getTodayTarget } from '@/lib/services/targets';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'userId is required' 
      }, { status: 400 });
    }
    
    console.log(`📋 Fetching settings for user: ${userId}`);
    
    // Get user settings (includes schedule and target)
    const settings = await getUserSettings(userId);
    
    if (!settings) {
      console.log(`⚠️  User ${userId} not found, using fallback settings`);
      // Don't return 404, use fallback settings instead
    }
    
    // Get additional schedule details
    const schedule = await getSchedule(userId);
    const target = await getTodayTarget(userId);
    
    const response = {
      success: true,
      data: {
        userId,
        email: (settings as any).email || 'naveenvenkat58@gmail.com', // Fallback email
        schedule: {
          reminder_time: schedule?.reminder_time || '07:55',
          summary_time: schedule?.summary_time || '20:01',
          email_enabled: schedule?.email_enabled !== undefined ? schedule.email_enabled : true, // Default to true if no schedule found
          reminder_email_template: schedule?.reminder_email_template || `Good morning! 🌅

It's time to focus on your job search goals for today.

Your daily target: {{daily_target}} applications
Applications made today: {{applications_today}}

Remember: Consistency is key to landing your dream job. You've got this! 💪

Best regards,
Application Console`,
          summary_email_template: schedule?.summary_email_template || `Good evening! 🌙

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
          daily_target: target?.daily_target || 5
        }
      }
    };
    
    console.log(`✅ Settings fetched successfully for user: ${userId}`);
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Failed to fetch user settings:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch user settings' 
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ 
    message: 'Scheduler Settings API',
    endpoints: {
      'GET /api/scheduler/settings?userId=<userId>': 'Get user settings for email scheduler'
    }
  });
}
