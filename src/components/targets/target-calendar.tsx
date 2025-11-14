'use client';

import { memo, useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  addMonths,
  subMonths,
  isToday,
  isFuture
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import type { JobApplication } from '@/lib/types';

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type TargetCalendarProps = {
  applications: JobApplication[];
  dailyTarget: number;
};

export const TargetCalendar = memo(function TargetCalendar({ applications, dailyTarget }: TargetCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const applicationsByDate = useMemo(() => {
    return applications.reduce((acc, app) => {
      const date = format(app.applied_date, 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [applications]);

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  const startingDayIndex = getDay(firstDayOfMonth);

  const getDayStatus = (day: Date): 'green' | 'yellow' | 'red' | 'gray' => {
    if (isFuture(day) && !isToday(day)) return 'gray';
    
    const dayString = format(day, 'yyyy-MM-dd');
    const applicationsDone = applicationsByDate[dayString] || 0;
    
    if (applicationsDone === 0) {
        return isToday(day) ? 'gray' : 'red';
    }
    if (applicationsDone >= dailyTarget) return 'green';
    return 'yellow';
  };

  const getStatusColorClass = (status: 'green' | 'yellow' | 'red' | 'gray') => {
    switch (status) {
      case 'green':
        return 'bg-green-500/80 text-white';
      case 'yellow':
        return 'bg-yellow-500/80 text-background';
      case 'red':
        return 'bg-red-500/80 text-white';
      case 'gray':
        return 'bg-muted/50';
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-headline text-xl">{format(currentMonth, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {weekDays.map((day) => (
          <div key={day} className="font-medium text-muted-foreground">{day}</div>
        ))}
        {Array.from({ length: startingDayIndex }).map((_, index) => (
          <div key={`empty-${index}`} />
        ))}
        {daysInMonth.map((day) => {
            const status = getDayStatus(day);
            const dayString = format(day, 'yyyy-MM-dd');
            const applicationsDone = applicationsByDate[dayString] || 0;
            return (
              <div key={day.toString()} className={cn("relative h-20 rounded-md p-2 flex flex-col justify-between items-end", getStatusColorClass(status))}>
                <div className="font-bold self-start">{format(day, 'd')}</div>
                {applicationsDone > 0 && <Badge variant="secondary" className="font-mono">{`${applicationsDone}/${dailyTarget}`}</Badge>}
              </div>
            )
        })}
      </div>
    </div>
  );
});
