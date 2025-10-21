'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-optimized-auth';
import { Settings, Crown, Zap, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function SimpleSubscriptionStatus() {
  const { user } = useAuth();

  console.log('SimpleSubscriptionStatus - user:', user?.email);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please sign in to view your subscription.</p>
        </CardContent>
      </Card>
    );
  }

  // For now, show a simple status - we'll enhance this once the basic system works
  const isAdmin = user.email === 'naveenvenkat58@gmail.com';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isAdmin ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
              {isAdmin ? <Settings className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle className="text-lg">{isAdmin ? 'ADMIN' : 'FREE'} Plan</CardTitle>
              <CardDescription>Active</CardDescription>
            </div>
          </div>
          
          {isAdmin && (
            <Button asChild size="sm" variant="default">
              <Link href="/admin">
                <Settings className="h-4 w-4 mr-2" />
                Admin Dashboard
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Applications</span>
            <span className="text-sm text-muted-foreground">
              {isAdmin ? 'Unlimited' : '0 / 100'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Features</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs">AI Features</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs">Notifications</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs">Future Features</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs">Unlimited Access</span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 p-3 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Admin Plan Active</strong> - You have full access to all features and admin dashboard!
            </p>
          </div>
        )}

        {!isAdmin && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Upgrade to Plus</strong> to unlock AI features and increase your application limit to 1,000.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
