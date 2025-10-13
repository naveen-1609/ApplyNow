import { memo, useMemo } from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Briefcase, ThumbsUp, ThumbsDown, FileText } from 'lucide-react';
import type { JobApplication } from '@/lib/types';

interface KpiCardsProps {
  applications: JobApplication[];
}

export default memo(function KpiCards({ applications }: KpiCardsProps) {
  const stats = useMemo(() => {
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

    return {
      totalApplications,
      totalInterviews,
      totalOffers,
      totalRejections
    };
  }, [applications]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
    </div>
  );
});
