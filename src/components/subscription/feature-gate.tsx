'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFeatureAccess } from '@/hooks/use-subscription';
import { SubscriptionPlan } from '@/lib/types/subscription';
import { Lock, Crown, Zap, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface FeatureGateProps {
  children: ReactNode;
  feature: 'ai' | 'notifications' | 'unlimited' | 'future';
  fallback?: ReactNode;
  showUpgrade?: boolean;
}

export function FeatureGate({ 
  children, 
  feature, 
  fallback, 
  showUpgrade = true 
}: FeatureGateProps) {
  const { 
    canUseAIFeatures, 
    canUseNotifications, 
    hasUnlimitedAccess, 
    hasFutureFeatures,
    maxApplications 
  } = useFeatureAccess();

  const canUse = (() => {
    switch (feature) {
      case 'ai':
        return canUseAIFeatures;
      case 'notifications':
        return canUseNotifications;
      case 'unlimited':
        return hasUnlimitedAccess;
      case 'future':
        return hasFutureFeatures;
      default:
        return false;
    }
  })();

  if (canUse) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const getFeatureInfo = () => {
    switch (feature) {
      case 'ai':
        return {
          title: 'AI Features Locked',
          description: 'Unlock AI-powered resume optimization, job matching, and application insights.',
          icon: <Zap className="h-6 w-6" />,
          requiredPlan: SubscriptionPlan.PLUS,
          gradient: 'from-blue-500 to-blue-600'
        };
      case 'notifications':
        return {
          title: 'Notifications Unavailable',
          description: 'Enable notifications to stay updated on your job applications.',
          icon: <Lock className="h-6 w-6" />,
          requiredPlan: SubscriptionPlan.FREE,
          gradient: 'from-gray-500 to-gray-600'
        };
      case 'unlimited':
        return {
          title: 'Application Limit Reached',
          description: 'You\'ve reached your application limit. Upgrade for unlimited applications.',
          icon: <Crown className="h-6 w-6" />,
          requiredPlan: SubscriptionPlan.PRO,
          gradient: 'from-purple-500 to-purple-600'
        };
      case 'future':
        return {
          title: 'Future Features',
          description: 'Get early access to new features and updates.',
          icon: <Sparkles className="h-6 w-6" />,
          requiredPlan: SubscriptionPlan.PRO,
          gradient: 'from-purple-500 to-purple-600'
        };
    }
  };

  const featureInfo = getFeatureInfo();

  if (!showUpgrade) {
    return null;
  }

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-r ${featureInfo.gradient} opacity-5`} />
      
      <CardHeader className="text-center">
        <div className={`mx-auto mb-4 w-12 h-12 bg-gradient-to-r ${featureInfo.gradient} rounded-full flex items-center justify-center text-white`}>
          {featureInfo.icon}
        </div>
        <CardTitle>{featureInfo.title}</CardTitle>
        <CardDescription className="max-w-md mx-auto">
          {featureInfo.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline">
            {featureInfo.requiredPlan} Plan Required
          </Badge>
        </div>

        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/pricing">
              Upgrade to {featureInfo.requiredPlan}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
            <Link href="/pricing">
              View All Plans
            </Link>
          </Button>
        </div>

        {feature === 'unlimited' && (
          <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Current limit: {maxApplications} applications
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Convenience components for specific features
export function AIFeatureGate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <FeatureGate feature="ai" fallback={fallback}>
      {children}
    </FeatureGate>
  );
}

export function UnlimitedFeatureGate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <FeatureGate feature="unlimited" fallback={fallback}>
      {children}
    </FeatureGate>
  );
}

export function FutureFeatureGate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <FeatureGate feature="future" fallback={fallback}>
      {children}
    </FeatureGate>
  );
}
