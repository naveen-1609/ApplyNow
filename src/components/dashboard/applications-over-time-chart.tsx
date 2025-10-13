'use client';

import { memo, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { subDays, format } from 'date-fns';
import type { JobApplication } from '@/lib/types';

const chartConfig = {
  applications: {
    label: 'Applications',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export const ApplicationsOverTimeChart = memo(function ApplicationsOverTimeChart({ 
  applications 
}: { 
  applications: JobApplication[] 
}) {
  const data = useMemo(() => {
    if (!applications || applications.length === 0) {
      return Array.from({ length: 30 }).map((_, i) => {
        const date = subDays(new Date(), 29 - i);
        return {
          date: format(date, 'MMM d'),
          applications: 0,
        };
      });
    }

    // Pre-calculate date strings for better performance
    const dateStrings = Array.from({ length: 30 }).map((_, i) => {
      const date = subDays(new Date(), 29 - i);
      return {
        date: format(date, 'MMM d'),
        dateString: format(date, 'yyyy-MM-dd'),
      };
    });

    // Create a map of applications by date for O(1) lookup
    const applicationsByDate = applications.reduce((acc, app) => {
      const dateString = format(app.applied_date, 'yyyy-MM-dd');
      acc[dateString] = (acc[dateString] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return dateStrings.map(({ date, dateString }) => ({
      date,
      applications: applicationsByDate[dateString] || 0,
    }));
  }, [applications]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications Overview</CardTitle>
        <CardDescription>Number of applications in the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 6)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="applications" fill="var(--color-applications)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
});
