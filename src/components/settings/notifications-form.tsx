'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getUserSettings, updateUserSettings } from '@/lib/services/users';
import type { Schedule } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

const defaultSchedule: Schedule = {
  schedule_id: '',
  user_id: '',
  reminder_time: '06:00',
  summary_time: '22:00',
  email_enabled: false,
};

export function NotificationsForm() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [schedule, setSchedule] = useState<Schedule>(defaultSchedule);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const settings = await getUserSettings(user.uid);
                if (settings.schedule) {
                    setSchedule(settings.schedule);
                } else {
                    // Set default schedule for new users
                    setSchedule({ ...defaultSchedule, user_id: user.uid });
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not load your settings.',
                });
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [user, toast]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await updateUserSettings(user.uid, { schedule });
            toast({
                title: 'Settings Saved',
                description: 'Your notification preferences have been updated.',
            });
        } catch (error) {
            console.error("Failed to save settings", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not save your settings.',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-28" />
                </CardFooter>
            </Card>
        )
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>
          Configure your daily reminder and summary emails. This requires setting up scheduled functions in your cloud environment.
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
            disabled={saving}
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
                disabled={!schedule.email_enabled || saving}
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
                disabled={!schedule.email_enabled || saving}
            />
            <p className="text-sm text-muted-foreground">
                Receive an evening summary of your day's applications.
            </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardFooter>
    </Card>
  );
}
