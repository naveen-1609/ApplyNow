'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockTarget } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Minus, Plus } from 'lucide-react';

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

    const handleStep = (amount: number) => {
        setDailyTarget(prev => Math.max(0, prev + amount));
    }
  
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
            <div className="flex items-center gap-2">
                 <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => handleStep(-1)} disabled={dailyTarget <= 0}>
                    <Minus className="h-4 w-4" />
                    <span className="sr-only">Decrease</span>
                </Button>
                <Input
                    type="number"
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(Number(e.target.value))}
                    min="0"
                    className="w-20 text-center text-lg font-bold"
                />
                 <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => handleStep(1)}>
                    <Plus className="h-4 w-4" />
                     <span className="sr-only">Increase</span>
                </Button>
            </div>
             <span className="text-muted-foreground">applications per day</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save Target</Button>
      </CardFooter>
    </Card>
  );
}
