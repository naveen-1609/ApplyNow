import { PageHeader } from '@/components/shared/page-header';
import { mockJobApplications, mockUser } from '@/lib/mock-data';
import { KpiCard } from '@/components/dashboard/kpi-card';
import {
  Briefcase,
  ThumbsUp,
  ThumbsDown,
  FileText,
} from 'lucide-react';
import { ApplicationsOverTimeChart } from '@/components/dashboard/applications-over-time-chart';
import { StatusBreakdownChart } from '@/components/dashboard/status-breakdown-chart';
import { AiPredictionTool } from '@/components/dashboard/ai-prediction-tool';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const totalApplications = mockJobApplications.length;
  const totalInterviews = mockJobApplications.filter(
    (app) => app.status === 'Interviewing' || app.status === 'Offer'
  ).length;
  const totalOffers = mockJobApplications.filter(
    (app) => app.status === 'Offer'
  ).length;
  const totalRejections = mockJobApplications.filter(
    (app) => app.status === 'Rejected'
  ).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${mockUser.name.split(' ')[0]}!`}
        description="Here's a snapshot of your job search progress."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <ApplicationsOverTimeChart />
        </div>
        <StatusBreakdownChart />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AiPredictionTool />
      </div>
    </div>
  );
}
