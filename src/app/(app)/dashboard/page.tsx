'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Briefcase, ThumbsUp, ThumbsDown, FileText } from 'lucide-react';
import { ApplicationsOverTimeChart } from '@/components/dashboard/applications-over-time-chart';
import { StatusBreakdownChart } from '@/components/dashboard/status-breakdown-chart';
import { useAuth } from '@/hooks/use-auth';
import type { JobApplication } from '@/lib/types';
import { getApplications } from '@/lib/services/applications';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const userApplications = await getApplications(user.uid);
        setApplications(userApplications);
      } catch (error) {
        console.error("Failed to fetch applications", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  const totalApplications = applications.length;
  const totalInterviews = applications.filter(
    (app) => app.status === 'Interviewing' || app.status === 'Offer'
  ).length;
  const totalOffers = applications.filter(
    (app) => app.status === 'Offer'
  ).length;
  const totalRejections = applications.filter(
    (app) => app.status === 'Rejected'
  ).length;

  const displayName = user?.displayName?.split(' ')[0] || 'there';

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${displayName}!`}
        description="Here's a snapshot of your job search progress."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
            <>
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </>
        ) : (
            <>
            <KpiCard
              title="Total Applications"
              value={totalApplications}
              description="Total jobs you've applied to"
              Icon={Briefcase}
            />
            <KpiCard
              title="Interviews"
              value={totalInterviews}
              description="Includes initial and follow-up interviews"
              Icon={ThumbsUp}
            />
            <KpiCard
              title="Offers"
              value={totalOffers}
              description="Congratulations on your offers!"
              Icon={FileText}
            />
            <KpiCard
              title="Rejections"
              value={totalRejections}
              description="Don't worry, keep trying!"
              Icon={ThumbsDown}
            />
            </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {loading ? (
            <>
                <Skeleton className="h-80 lg:col-span-2" />
                <Skeleton className="h-80" />
            </>
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
