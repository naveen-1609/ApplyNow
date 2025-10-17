import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'all'; // 'reminder', 'summary', or 'all'
    
    // This is a test endpoint to manually trigger the cron job
    const cronUrl = `${request.nextUrl.origin}/api/cron/notifications${testType !== 'all' ? `?type=${testType}` : ''}`;
    
    console.log(`🧪 Testing cron job manually for type: ${testType}...`);
    
    const response = await fetch(cronUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'vercel-cron/1.0' // Simulate Vercel cron user agent
      }
    });
    
    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: `Test cron job triggered for type: ${testType}`,
      cronResult: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test cron job failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Test cron job failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
