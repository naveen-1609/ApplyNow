'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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
            <Slider
                defaultValue={[dailyTarget]}
                value={[dailyTarget]}
                onValueChange={(value) => setDailyTarget(value[0])}
                max={10}
                step={1}
            />
            <span className="text-2xl font-bold text-primary w-12 text-center">{dailyTarget}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save Target</Button>
      </CardFooter>
    </Card>
  );
}
