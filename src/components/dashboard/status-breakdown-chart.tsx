'use client';

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
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import { Pie, PieChart, Cell } from 'recharts';
import { mockJobApplications } from '@/lib/mock-data';
import type { JobApplicationStatus } from '@/lib/types';
import { useMemo } from 'react';

const statusColors: Record<JobApplicationStatus, string> = {
    Applied: 'hsl(var(--chart-1))',
    Interviewing: 'hsl(var(--chart-2))',
    Offer: 'hsl(var(--chart-3))',
    Rejected: 'hsl(var(--chart-4))',
    Ghosted: 'hsl(var(--chart-5))',
};

export function StatusBreakdownChart() {
  const data = useMemo(() => {
    const statusCounts = mockJobApplications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<JobApplicationStatus, number>);

    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
      fill: statusColors[name as JobApplicationStatus],
    }));
  }, []);
  
  const chartConfig = useMemo(() => Object.fromEntries(
    data.map(item => [item.name, { label: item.name, color: item.fill }])
  ), [data]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Breakdown</CardTitle>
        <CardDescription>Distribution of application statuses</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-64"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} cx="50%" cy="50%">
              {data.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
