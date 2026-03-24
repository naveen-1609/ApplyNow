'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-optimized-auth';
import { Shield, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { OWNER_EMAIL, isOwnerEmail } from '@/lib/config/app-user';
import { useSubscription } from '@/hooks/use-subscription';

export function SimpleSubscriptionStatus() {
  const { user } = useAuth();
  const { userProfile, canUseAIFeatures } = useSubscription();

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Access</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please sign in to view account access details.</p>
        </CardContent>
      </Card>
    );
  }

  const isAdmin = isOwnerEmail(user.email);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${isAdmin ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
              {isAdmin ? <Shield className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle className="text-lg">{isAdmin ? 'Owner Account' : 'Restricted Account'}</CardTitle>
              <CardDescription>Access is now controlled by approved email permissions.</CardDescription>
            </div>
          </div>
          {isAdmin && (
            <Button asChild size="sm">
              <Link href="/admin">
                <Shield className="mr-2 h-4 w-4" />
                Workspace Admin
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p><strong className="text-foreground">Owner email:</strong> {OWNER_EMAIL}</p>
        <p><strong className="text-foreground">Permission level:</strong> {isAdmin ? 'ai_features (admin)' : userProfile?.permissions || 'records_only'}</p>
        <p><strong className="text-foreground">AI access:</strong> {canUseAIFeatures ? 'Enabled' : 'Disabled for this account'}</p>
      </CardContent>
    </Card>
  );
}
