'use client';

import { Suspense, lazy } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { useAuth } from '@/hooks/use-optimized-auth';
import { usePreloadedData, usePreloadedApplications } from '@/hooks/use-preloaded-data';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy components
const KpiCards = lazy(() => import('./kpi-cards'));
const DashboardCharts = lazy(() => import('./dashboard-charts'));

export default function OptimizedDashboardPage() {
  const { user } = useAuth();
  const { preloaded } = usePreloadedData();
  const preloadedApplications = usePreloadedApplications();

  const displayName = user?.displayName?.split(' ')[0] || 'there';

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${displayName}!`}
        description="Here's a snapshot of your job search progress."
      />

      {/* Show preloaded data immediately if available */}
      {preloadedApplications ? (
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <KpiCards applications={preloadedApplications} />
        </Suspense>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {preloaded ? (
          <Suspense fallback={<Skeleton className="h-80 w-full" />}>
            <DashboardCharts applications={preloadedApplications || []} />
          </Suspense>
        ) : (
          <>
            <Skeleton className="h-80 lg:col-span-2" />
            <Skeleton className="h-80" />
          </>
        )}
      </div>
    </div>
  );
}
