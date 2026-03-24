import { NextRequest, NextResponse } from 'next/server';
import { normalizeNotificationType, processCronNotifications } from '@/lib/services/notification-service';
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
    const requestedType = normalizeNotificationType(searchParams.get('type'));

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

    const typesToProcess = requestedType === 'both' ? ['reminder', 'summary'] as const : [requestedType];
    const currentTime = new Date().toISOString();

    const processed = await Promise.all(typesToProcess.map((type) => processCronNotifications(type)));
    const combinedResults = processed.flatMap((item) => item.results);
    const usersChecked = Math.max(0, ...processed.map((item) => item.usersChecked));

    logger.info('Cron notifications completed', {
      local: isLocalTest,
      type: requestedType,
      usersChecked,
      emailsProcessed: combinedResults.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Cron job completed',
      timestamp: currentTime,
      type: requestedType,
      usersChecked,
      emailsProcessed: combinedResults.length,
      results: combinedResults,
    });
  } catch (error: any) {
    logger.error('Cron job failed', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Cron job failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
