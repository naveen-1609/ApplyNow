'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { mockSchedule } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

export function NotificationsForm() {
    const { toast } = useToast();
    const [schedule, setSchedule] = useState(mockSchedule);

    const handleSave = () => {
        // Mock save
        console.log('Saving schedule:', schedule);
        toast({
            title: 'Settings Saved',
            description: 'Your notification preferences have been updated.',
        });
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>
          Configure your daily reminder and summary emails. These are sent via a scheduled cloud function.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="email-enabled">Enable Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive daily emails.
            </p>
          </div>
          <Switch
            id="email-enabled"
            checked={schedule.email_enabled}
            onCheckedChange={(checked) => setSchedule(s => ({ ...s, email_enabled: checked }))}
          />
        </div>
        <div className="space-y-2">
            <Label htmlFor="reminder-time">Daily Reminder Time</Label>
            <Input 
                id="reminder-time"
                type="time"
                value={schedule.reminder_time}
                onChange={(e) => setSchedule(s => ({ ...s, reminder_time: e.target.value }))}
                className="w-48"
                disabled={!schedule.email_enabled}
            />
            <p className="text-sm text-muted-foreground">
                Get a morning reminder about your daily target.
            </p>
        </div>
        <div className="space-y-2">
            <Label htmlFor="summary-time">Daily Summary Time</Label>
            <Input 
                id="summary-time"
                type="time"
                value={schedule.summary_time}
                onChange={(e) => setSchedule(s => ({ ...s, summary_time: e.target.value }))}
                className="w-48"
                disabled={!schedule.email_enabled}
            />
            <p className="text-sm text-muted-foreground">
                Receive an evening summary of your day's applications.
            </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save Preferences</Button>
      </CardFooter>
    </Card>
  );
}
