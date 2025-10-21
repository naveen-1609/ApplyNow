'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/hooks/use-subscription';
import { useFeatureAccess } from '@/hooks/use-subscription';
import { SubscriptionPlan } from '@/lib/types/subscription';
import { Crown, Zap, Sparkles, TrendingUp, AlertCircle, Settings } from 'lucide-react';
import Link from 'next/link';

export function SubscriptionStatus() {
  const { userProfile, loading } = useSubscription();
  const { maxApplications } = useFeatureAccess();

  console.log('SubscriptionStatus - userProfile:', userProfile);
  console.log('SubscriptionStatus - loading:', loading);

  if (loading || !userProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPlanIcon = (plan: SubscriptionPlan) => {
    switch (plan) {
      case SubscriptionPlan.FREE:
        return <Sparkles className="h-5 w-5" />;
      case SubscriptionPlan.PLUS:
        return <Zap className="h-5 w-5" />;
      case SubscriptionPlan.PRO:
        return <Crown className="h-5 w-5" />;
      case SubscriptionPlan.ADMIN:
        return <Settings className="h-5 w-5" />;
    }
  };

  const getPlanColor = (plan: SubscriptionPlan) => {
    switch (plan) {
      case SubscriptionPlan.FREE:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case SubscriptionPlan.PLUS:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
      case SubscriptionPlan.PRO:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200';
      case SubscriptionPlan.ADMIN:
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
    }
  };

  const getPlanGradient = (plan: SubscriptionPlan) => {
    switch (plan) {
      case SubscriptionPlan.FREE:
        return 'from-gray-500 to-gray-600';
      case SubscriptionPlan.PLUS:
        return 'from-blue-500 to-blue-600';
      case SubscriptionPlan.PRO:
        return 'from-purple-500 to-purple-600';
      case SubscriptionPlan.ADMIN:
        return 'from-red-500 to-red-600';
    }
  };

  const isNearLimit = (current: number, max: number) => {
    if (max === -1) return false; // Unlimited
    return current >= max * 0.8; // 80% of limit
  };

  const isAtLimit = (current: number, max: number) => {
    if (max === -1) return false; // Unlimited
    return current >= max;
  };

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-r ${getPlanGradient(userProfile.subscriptionPlan)} opacity-5`} />
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getPlanColor(userProfile.subscriptionPlan)}`}>
              {getPlanIcon(userProfile.subscriptionPlan)}
            </div>
            <div>
              <CardTitle className="text-lg">{userProfile.subscriptionPlan} Plan</CardTitle>
              <CardDescription>
                {userProfile.subscriptionStatus === 'active' ? 'Active' : 'Inactive'}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex gap-2">
            {userProfile.subscriptionPlan === SubscriptionPlan.ADMIN && (
              <Button asChild size="sm" variant="default">
                <Link href="/admin">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Dashboard
                </Link>
              </Button>
            )}
            {userProfile.subscriptionPlan !== SubscriptionPlan.PRO && userProfile.subscriptionPlan !== SubscriptionPlan.ADMIN && (
              <Button asChild size="sm" variant="outline">
                <Link href="/pricing">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Upgrade
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Application Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Applications</span>
            <span className="text-sm text-muted-foreground">
              {maxApplications === -1 ? 'Unlimited' : `0 / ${maxApplications}`}
            </span>
          </div>
          
          {maxApplications !== -1 && (
            <>
              <Progress 
                value={0} 
                className="h-2"
                // TODO: Get actual application count
              />
              {isNearLimit(0, maxApplications) && (
                <div className="flex items-center gap-2 mt-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  {isAtLimit(0, maxApplications) 
                    ? 'You\'ve reached your application limit' 
                    : 'You\'re approaching your application limit'
                  }
                </div>
              )}
            </>
          )}
        </div>

        {/* Features */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Features</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                userProfile.subscriptionPlan !== SubscriptionPlan.FREE ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-xs">AI Features</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs">Notifications</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                userProfile.subscriptionPlan === SubscriptionPlan.PRO ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-xs">Future Features</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                userProfile.subscriptionPlan === SubscriptionPlan.PRO ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-xs">Unlimited Access</span>
            </div>
          </div>
        </div>

        {/* Plan Benefits */}
        {userProfile.subscriptionPlan === SubscriptionPlan.FREE && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Upgrade to Plus</strong> to unlock AI features and increase your application limit to 1,000.
            </p>
          </div>
        )}

        {userProfile.subscriptionPlan === SubscriptionPlan.PLUS && (
          <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              <strong>Upgrade to Pro</strong> for unlimited applications and lifetime access to all features.
            </p>
          </div>
        )}

        {userProfile.subscriptionPlan === SubscriptionPlan.PRO && (
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 p-3 rounded-lg">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              <strong>Pro Plan Active</strong> - You have unlimited access to all features!
            </p>
          </div>
        )}

        {userProfile.subscriptionPlan === SubscriptionPlan.ADMIN && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 p-3 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Admin Plan Active</strong> - You have full access to all features and admin dashboard!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
