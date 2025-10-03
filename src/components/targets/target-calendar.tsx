'use client';

import { useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockTarget } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TargetCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  const startingDayIndex = getDay(firstDayOfMonth);

  const getDayStatus = (day: Date): 'green' | 'yellow' | 'red' | 'gray' => {
    const today = new Date();
    if (day > today) return 'gray';
    
    const dayString = format(day, 'yyyy-MM-dd');
    const record = mockTarget.history.find(h => h.date === dayString);
    const applicationsDone = record ? record.applications_done : 0;
    
    if (applicationsDone === 0) return 'red';
    if (applicationsDone >= mockTarget.daily_target) return 'green';
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
            const record = mockTarget.history.find(h => h.date === format(day, 'yyyy-MM-dd'));
            return (
          <div key={day.toString()} className={cn("relative h-20 rounded-md p-2 flex flex-col justify-between items-end", getStatusColorClass(status))}>
            <div className="font-bold self-start">{format(day, 'd')}</div>
            {record && <Badge variant="secondary" className="font-mono">{`${record.applications_done}/${mockTarget.daily_target}`}</Badge>}
          </div>
        )})}
      </div>
    </div>
  );
}
