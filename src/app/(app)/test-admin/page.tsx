'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-optimized-auth';
import { testFirebaseConnection, testAdminUserCreation, testFirestoreAccess } from '@/lib/firebase-test-simple';
import { useToast } from '@/hooks/use-toast';

export default function TestAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runTests = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      // Test 1: Firebase Connection
      const connectionTest = await testFirebaseConnection();
      setResults(prev => [...prev, { name: 'Firebase Connection', ...connectionTest }]);
      
      // Test 2: Firestore Access
      const firestoreTest = await testFirestoreAccess();
      setResults(prev => [...prev, { name: 'Firestore Access', ...firestoreTest }]);
      
      // Test 3: Admin User (only if not already signed in)
      if (!user) {
        const adminTest = await testAdminUserCreation();
        setResults(prev => [...prev, { name: 'Admin User Setup', ...adminTest }]);
      } else {
        setResults(prev => [...prev, { 
          name: 'Admin User Setup', 
          success: true, 
          message: `Already signed in as ${user.email}` 
        }]);
      }
      
      toast({
        title: 'Tests Completed',
        description: 'Check the results below',
      });
      
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: 'Something went wrong during testing',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Setup Test</h1>
        <p className="text-muted-foreground">Test Firebase connection and admin user setup</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
          <CardDescription>Your current authentication status</CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-2">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>UID:</strong> {user.uid}</p>
              <p><strong>Is Admin:</strong> {user.email === 'naveenvenkat58@gmail.com' ? 'Yes' : 'No'}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">Not signed in</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Run Tests</CardTitle>
          <CardDescription>Test Firebase connection and admin user setup</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runTests} disabled={loading}>
            {loading ? 'Running Tests...' : 'Run Tests'}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Results of the Firebase tests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{result.name}</h4>
                    {result.message && (
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                    )}
                    {result.error && (
                      <p className="text-sm text-red-600">{result.error}</p>
                    )}
                  </div>
                  <div className={`px-2 py-1 rounded text-sm ${
                    result.success 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {result.success ? '✅ Success' : '❌ Failed'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>What to do after running the tests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>1. <strong>If tests pass:</strong> Go to <code>/admin</code> to access the admin dashboard</p>
            <p>2. <strong>If tests fail:</strong> Check the Firebase Console and follow the setup guide</p>
            <p>3. <strong>Check browser console:</strong> Look for detailed error messages</p>
            <p>4. <strong>Verify Firestore rules:</strong> Make sure they were deployed successfully</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
