'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockTarget } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

export function SetTargetCard() {
    const { toast } = useToast();
    const [dailyTarget, setDailyTarget] = useState(mockTarget.daily_target);

    const handleSave = () => {
        // Mock save
        mockTarget.daily_target = dailyTarget;
        toast({
            title: 'Target Updated',
            description: `Your daily application target is now ${dailyTarget}.`,
        });
    };
  
    return (
    <Card>
      <CardHeader>
        <CardTitle>Set Daily Target</CardTitle>
        <CardDescription>
          Choose how many jobs you want to apply for each day.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
            <Input
                type="number"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(Number(e.target.value))}
                min="0"
                className="w-24"
            />
             <span className="text-muted-foreground">applications per day</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save Target</Button>
      </CardFooter>
    </Card>
  );
}
