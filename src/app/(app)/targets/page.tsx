'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { TargetCalendar } from '@/components/targets/target-calendar';
import { SetTargetCard } from '@/components/targets/set-target-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import type { JobApplication, Target } from '@/lib/types';
import { getApplications } from '@/lib/services/applications';
import { getUserSettings } from '@/lib/services/users';
import { Skeleton } from '@/components/ui/skeleton';

export default function TargetsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [target, setTarget] = useState<Target>({ daily_target: 3 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [apps, settings] = await Promise.all([
        getApplications(user.uid),
        getUserSettings(user.uid),
      ]);
      setApplications(apps);
      if (settings.target) {
        setTarget(settings.target);
      }
    } catch (error) {
      console.error("Failed to fetch target data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);
  
  const handleTargetSaved = () => {
    // Refetch data when target is updated
    fetchData();
  };

  const todayString = format(new Date(), 'yyyy-MM-dd');
  const todaysProgress = applications.filter(app => format(app.applied_date, 'yyyy-MM-dd') === todayString).length;
  const progressPercentage = Math.min((todaysProgress / target.daily_target) * 100, 100);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Daily Targets"
        description="Set a daily goal and track your application consistency."
      />
      
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Skeleton className="h-40" />
                <Skeleton className="h-44" />
            </div>
            <div className="lg:col-span-1">
                <Skeleton className="h-52" />
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Today's Progress</CardTitle>
                <CardDescription>
                  You've completed {todaysProgress} of your {target.daily_target} application target today.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={progressPercentage} className="h-4" />
              </CardContent>
            </Card>
            <SetTargetCard currentTarget={target.daily_target} onTargetSaved={handleTargetSaved} />
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
                  <span>No applications on this day</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-muted"></div>
                  <span>Future date / Today</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {loading ? (
          <Skeleton className="h-[400px]" />
      ) : (
        <TargetCalendar applications={applications} dailyTarget={target.daily_target} />
      )}
    </div>
  );
}
