'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-optimized-auth';
import { useGlobalData } from '@/hooks/use-global-data';
import { getUserSettings, updateUserSettings } from '@/lib/services/users';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function TestFeaturesPage() {
  const { user } = useAuth();
  const { todayTarget, schedule, loading, refetch } = useGlobalData();
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runTests = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please sign in to test features',
        variant: 'destructive'
      });
      return;
    }

    setTesting(true);
    setResults([]);
    const testResults: any[] = [];

    try {
      // Test 1: Targets API
      try {
        const response = await fetch(`/api/targets?userId=${user.uid}&today=true`);
        const data = await response.json();
        testResults.push({
          name: 'Targets API',
          success: response.ok,
          message: data.target ? 'Target found' : 'No target found (will create default)',
          data: data.target
        });
      } catch (error: any) {
        testResults.push({
          name: 'Targets API',
          success: false,
          error: error.message
        });
      }

      // Test 2: Create/Update Target
      try {
        const testTarget = {
          userId: user.uid,
          daily_target: 5,
          current_date: new Date().toISOString(),
          applications_done: 0,
          status_color: 'Green'
        };

        const response = await fetch('/api/targets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testTarget)
        });

        const data = await response.json();
        testResults.push({
          name: 'Create Target',
          success: response.ok,
          message: response.ok ? 'Target created successfully' : data.error,
          data: data
        });
      } catch (error: any) {
        testResults.push({
          name: 'Create Target',
          success: false,
          error: error.message
        });
      }

      // Test 3: Get User Settings (includes schedule)
      try {
        const settings = await getUserSettings(user.uid);
        testResults.push({
          name: 'User Settings',
          success: true,
          message: settings.schedule ? 'Schedule found' : 'No schedule found (will create default)',
          data: settings
        });
      } catch (error: any) {
        testResults.push({
          name: 'User Settings',
          success: false,
          error: error.message
        });
      }

      // Test 4: Update Schedule
      try {
        const testSchedule = {
          user_id: user.uid,
          reminder_time: '07:00',
          summary_time: '20:00',
          email_enabled: true,
          reminder_email_template: 'Test template',
          summary_email_template: 'Test template'
        };

        await updateUserSettings(user.uid, { schedule: testSchedule });
        testResults.push({
          name: 'Update Schedule',
          success: true,
          message: 'Schedule updated successfully'
        });
      } catch (error: any) {
        testResults.push({
          name: 'Update Schedule',
          success: false,
          error: error.message
        });
      }

      // Test 5: Check Schedules API
      try {
        const response = await fetch(`/api/schedules?userId=${user.uid}`);
        const data = await response.json();
        testResults.push({
          name: 'Schedules API',
          success: response.ok,
          message: data.schedule ? 'Schedule found' : 'No schedule found',
          data: data.schedule
        });
      } catch (error: any) {
        testResults.push({
          name: 'Schedules API',
          success: false,
          error: error.message
        });
      }

      setResults(testResults);
      
      const allPassed = testResults.every(r => r.success);
      toast({
        title: allPassed ? 'All Tests Passed!' : 'Some Tests Failed',
        description: `${testResults.filter(r => r.success).length}/${testResults.length} tests passed`,
        variant: allPassed ? 'default' : 'destructive'
      });

      // Refetch data to update UI
      await refetch();

    } catch (error) {
      toast({
        title: 'Test Failed',
        description: 'Something went wrong during testing',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Features Test</h1>
        <p className="text-muted-foreground">Test targets and notifications functionality</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
            <CardDescription>Your current targets and notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium">Daily Target</p>
                  <p className="text-2xl font-bold">
                    {todayTarget?.daily_target || 3} applications
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <Badge variant={schedule?.email_enabled ? 'default' : 'outline'}>
                    {schedule?.email_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                {schedule && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Reminder Time</p>
                    <p className="text-lg">{schedule.reminder_time || 'Not set'}</p>
                    <p className="text-sm font-medium">Summary Time</p>
                    <p className="text-lg">{schedule.summary_time || 'Not set'}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Run Tests</CardTitle>
            <CardDescription>Test all features and APIs</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runTests} disabled={testing || !user} className="w-full">
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run All Tests'
              )}
            </Button>
            {!user && (
              <p className="text-sm text-muted-foreground mt-2">
                Please sign in to test features
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Results of the feature tests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <h4 className="font-medium">{result.name}</h4>
                    </div>
                    {result.message && (
                      <p className="text-sm text-muted-foreground mb-1">{result.message}</p>
                    )}
                    {result.error && (
                      <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
                    )}
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-sm cursor-pointer text-muted-foreground">
                          View Details
                        </summary>
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? 'Pass' : 'Fail'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Access features directly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild variant="outline">
              <a href="/targets">Go to Targets</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/settings">Go to Settings</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
