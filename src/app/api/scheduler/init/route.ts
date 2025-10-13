import { NextRequest, NextResponse } from 'next/server';
import { checkAndSendScheduledEmails } from '@/lib/services/simple-scheduler';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Checking for scheduled emails...');
    
    const result = await checkAndSendScheduledEmails();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Scheduled email check completed',
      result: result
    });
  } catch (error) {
    console.error('Failed to check scheduled emails:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check scheduled emails' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Dynamic Email Scheduler API',
    endpoints: {
      'POST /api/scheduler/init': 'Initialize dynamic email scheduling',
      'POST /api/scheduler/trigger': 'Manually trigger email for testing'
    }
  });
}
