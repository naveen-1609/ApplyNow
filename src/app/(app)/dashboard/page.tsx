'use client';

import { PageHeader } from '@/components/shared/page-header';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Briefcase, ThumbsUp, ThumbsDown, FileText } from 'lucide-react';
import { ApplicationsOverTimeChart } from '@/components/dashboard/applications-over-time-chart';
import { StatusBreakdownChart } from '@/components/dashboard/status-breakdown-chart';
import { useAuth } from '@/hooks/use-optimized-auth';
import { useOptimizedParallelData } from '@/hooks/use-optimized-parallel-data';
import { Skeleton } from '@/components/ui/skeleton';
import { CompactInstantLoader } from '@/components/ui/instant-loader';
import { LoadingMonitor } from '@/components/performance/loading-monitor';

export default function DashboardPage() {
  const { user } = useAuth();
  const { applications, loading, stats } = useOptimizedParallelData();

  const displayName = user?.displayName?.split(' ')[0] || 'there';

  return (
    <div className="space-y-8">
      <LoadingMonitor loading={loading} pageName="Dashboard" />
      <PageHeader
        title={`Welcome back, ${displayName}!`}
        description="Here's a snapshot of your job search progress."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
            <div className="col-span-full flex justify-center py-8">
              <CompactInstantLoader />
            </div>
        ) : (
            <>
            <KpiCard
              title="Total Applications"
              value={stats.totalApplications}
              description="Total jobs you've applied to"
              Icon={Briefcase}
            />
            <KpiCard
              title="Interviews"
              value={stats.totalInterviews}
              description="Includes initial and follow-up interviews"
              Icon={ThumbsUp}
            />
            <KpiCard
              title="Offers"
              value={stats.totalOffers}
              description="Congratulations on your offers!"
              Icon={FileText}
            />
            <KpiCard
              title="Rejections"
              value={stats.totalRejections}
              description="Don't worry, keep trying!"
              Icon={ThumbsDown}
            />
            </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {loading ? (
            <div className="col-span-full flex justify-center py-8">
              <CompactInstantLoader />
            </div>
        ) : (
            <>
                <div className="lg:col-span-2">
                    <ApplicationsOverTimeChart applications={applications} />
                </div>
                <StatusBreakdownChart applications={applications} />
            </>
        )}
      </div>
    </div>
  );
}
