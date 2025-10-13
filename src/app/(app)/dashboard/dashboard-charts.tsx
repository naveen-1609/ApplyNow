import { memo } from 'react';
import { ApplicationsOverTimeChart } from '@/components/dashboard/applications-over-time-chart';
import { StatusBreakdownChart } from '@/components/dashboard/status-breakdown-chart';
import type { JobApplication } from '@/lib/types';

interface DashboardChartsProps {
  applications: JobApplication[];
}

export default memo(function DashboardCharts({ applications }: DashboardChartsProps) {
  return (
    <>
      <div className="lg:col-span-2">
        <ApplicationsOverTimeChart applications={applications} />
      </div>
      <StatusBreakdownChart applications={applications} />
    </>
  );
});
