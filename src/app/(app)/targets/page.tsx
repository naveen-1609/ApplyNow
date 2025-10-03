import { PageHeader } from '@/components/shared/page-header';
import { TargetCalendar } from '@/components/targets/target-calendar';
import { SetTargetCard } from '@/components/targets/set-target-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { mockTarget } from '@/lib/mock-data';
import { format } from 'date-fns';

export default function TargetsPage() {
    const todayString = format(new Date(), 'yyyy-MM-dd');
    const todaysProgress = mockTarget.history.find(h => h.date === todayString)?.applications_done || 0;
    const progressPercentage = Math.min((todaysProgress / mockTarget.daily_target) * 100, 100);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Daily Targets"
        description="Set a daily goal and track your application consistency."
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Today's Progress</CardTitle>
                    <CardDescription>
                        You've applied to {todaysProgress} of your {mockTarget.daily_target} job target today.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Progress value={progressPercentage} className="h-4" />
                </CardContent>
            </Card>
            <SetTargetCard />
        </div>
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Legend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-green-500/80"></div>
                        <span>Target met or exceeded</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-yellow-500/80"></div>
                        <span>Partially met target</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-red-500/80"></div>
                        <span>No applications</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-muted"></div>
                        <span>Future date</span>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <TargetCalendar />
    </div>
  );
}
