import { NextRequest, NextResponse } from 'next/server';
import { processCronNotifications } from '@/lib/services/notification-service';
import { logger } from '@/lib/utils/logger';

function isAuthorizedCronRequest(request: NextRequest, isLocalTest: boolean) {
  if (isLocalTest) {
    return true;
  }

  const userAgent = request.headers.get('user-agent') || '';
  return userAgent.includes('vercel-cron');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isLocalTest = searchParams.get('local') === 'true';

    if (!isAuthorizedCronRequest(request, isLocalTest)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - only Vercel cron jobs can access this endpoint',
          hint: 'Add ?local=true to test locally',
        },
        { status: 401 }
      );
    }

    const currentTime = new Date().toISOString();
    const processed = await processCronNotifications('summary');

    logger.info('Summary cron completed', {
      local: isLocalTest,
      type: 'summary',
      usersChecked: processed.usersChecked,
      emailsProcessed: processed.results.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Summary cron completed',
      timestamp: currentTime,
      type: 'summary',
      usersChecked: processed.usersChecked,
      emailsProcessed: processed.results.length,
      results: processed.results,
    });
  } catch (error: any) {
    logger.error('Summary cron failed', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Summary cron failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
