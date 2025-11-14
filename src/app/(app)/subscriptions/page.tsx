'use client';

import { useState, useEffect, Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-optimized-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { SubscriptionPlan, SUBSCRIPTION_PLANS } from '@/lib/types/subscription';
import { subscriptionService, SubscriptionTransaction } from '@/lib/subscription/subscription-service';
import { Crown, Zap, Sparkles, Settings, TrendingUp, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import { PaymentModal } from '@/components/payment/payment-modal';

function SubscriptionsContent() {
  const { user } = useAuth();
  const { userProfile, loading, refreshProfile } = useSubscription();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<SubscriptionTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Show success message if returning from Stripe checkout
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast({
        title: 'Payment Successful!',
        description: 'Your subscription has been activated. Welcome!',
      });
      refreshProfile();
      // Remove query parameter
      window.history.replaceState({}, '', '/subscriptions');
    }
  }, [searchParams, toast, refreshProfile]);

  useEffect(() => {
    if (user && userProfile) {
      loadTransactions();
    }
  }, [user, userProfile]);

  const loadTransactions = async () => {
    if (!user) return;
    
    try {
      setLoadingTransactions(true);
      const userTransactions = await subscriptionService.getUserTransactions(user.uid);
      setTransactions(userTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const getPlanIcon = (plan: SubscriptionPlan) => {
    switch (plan) {
      case SubscriptionPlan.FREE:
        return <Sparkles className="h-6 w-6" />;
      case SubscriptionPlan.PLUS:
        return <Zap className="h-6 w-6" />;
      case SubscriptionPlan.PRO:
        return <Crown className="h-6 w-6" />;
      case SubscriptionPlan.ADMIN:
        return <Settings className="h-6 w-6" />;
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

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to upgrade your subscription.',
        variant: 'destructive'
      });
      return;
    }

    if (plan === SubscriptionPlan.FREE) {
      window.location.href = '/pricing';
      return;
    }

    // Open embedded payment modal
    setSelectedPlan(plan);
    setPaymentModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Subscriptions" description="Manage your subscription and billing" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading subscription...</p>
          </div>
        </div>
      </div>
    );
  }

  // Get effective plan for checking - check admin email first
  const isAdminEmailForCheck = user?.email?.toLowerCase() === 'naveenvenkat58@gmail.com';
  const effectivePlanForCheck = isAdminEmailForCheck 
    ? SubscriptionPlan.ADMIN 
    : (userProfile?.subscriptionPlan || SubscriptionPlan.FREE);
  
  // If user is on FREE plan, show pricing page content
  if (effectivePlanForCheck === SubscriptionPlan.FREE) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Upgrade Your Subscription"
          description="Choose a plan that fits your needs"
        />
        
        <Card>
          <CardHeader>
            <CardTitle>Current Plan: Free</CardTitle>
            <CardDescription>
              You're currently on the free plan. Upgrade to unlock more features!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                    Upgrade to unlock more features
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Upgrade to Plus or Pro to access AI features, increase your application limits, and get priority support.
                  </p>
                </div>
              </div>
            </div>
            
            <Button asChild size="lg" className="w-full">
              <Link href="/pricing">View Pricing Plans</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Show available plans */}
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>
              Choose the plan that best fits your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SUBSCRIPTION_PLANS.filter(p => p.id !== SubscriptionPlan.FREE && p.id !== SubscriptionPlan.ADMIN).map((plan) => (
                <Card key={plan.id} className={plan.isPopular ? 'border-primary' : ''}>
                  <CardHeader>
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getPlanColor(plan.id)} mb-2`}>
                      {getPlanIcon(plan.id)}
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-2">
                      <span className="text-2xl font-bold">${plan.price}</span>
                      {plan.price > 0 && (
                        <span className="text-sm text-muted-foreground ml-1">
                          /{plan.billingPeriod === 'one-time' ? 'lifetime' : plan.billingPeriod}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardContent className="pt-0">
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get effective plan - check if admin email first, then use profile plan
  const isAdminEmail = user?.email?.toLowerCase() === 'naveenvenkat58@gmail.com';
  const effectivePlan = isAdminEmail 
    ? SubscriptionPlan.ADMIN 
    : (userProfile?.subscriptionPlan || SubscriptionPlan.FREE);
  
  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === effectivePlan);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Subscriptions"
        description="Manage your subscription plan and view billing history"
      />

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>
                Your active subscription plan and status
              </CardDescription>
            </div>
            <Badge variant={userProfile?.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
              {userProfile?.subscriptionStatus || 'active'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentPlan && (
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-lg ${getPlanColor(currentPlan.id)}`}>
                {getPlanIcon(currentPlan.id)}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{currentPlan.name} Plan</h3>
                <p className="text-muted-foreground">{currentPlan.description}</p>
                <div className="mt-2">
                  <span className="text-3xl font-bold">${currentPlan.price}</span>
                  {currentPlan.price > 0 && (
                    <span className="text-muted-foreground ml-2">
                      /{currentPlan.billingPeriod === 'one-time' ? 'lifetime' : currentPlan.billingPeriod}
                    </span>
                  )}
                </div>
              </div>
              {currentPlan.id !== SubscriptionPlan.PRO && currentPlan.id !== SubscriptionPlan.ADMIN && (
                <Button onClick={() => handleUpgrade(SubscriptionPlan.PRO)}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Upgrade
                </Button>
              )}
            </div>
          )}

          {/* Subscription Dates */}
          {userProfile && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">
                  {userProfile.subscriptionStartDate 
                    ? format(userProfile.subscriptionStartDate, 'MMM dd, yyyy')
                    : 'N/A'}
                </p>
              </div>
              {userProfile.subscriptionEndDate && (
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">
                    {format(userProfile.subscriptionEndDate, 'MMM dd, yyyy')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Free Plan Upgrade Prompt */}
          {effectivePlan === SubscriptionPlan.FREE && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                    Upgrade to unlock more features
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Upgrade to Plus or Pro to access AI features, increase your application limits, and get priority support.
                  </p>
                  <Button asChild className="mt-3" size="sm">
                    <Link href="/pricing">View Plans</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Billing History</TabsTrigger>
          <TabsTrigger value="plans">Available Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View your past subscription payments and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTransactions ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No transactions found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your payment history will appear here once you make a purchase.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${getPlanColor(transaction.plan)}`}>
                          {getPlanIcon(transaction.plan)}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.plan} Plan</p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.completedAt 
                              ? format(transaction.completedAt, 'MMM dd, yyyy')
                              : 'Pending'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${transaction.amount}</p>
                        <Badge variant={
                          transaction.status === 'completed' ? 'default' :
                          transaction.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
              <CardDescription>
                Choose the plan that best fits your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <Card key={plan.id} className={plan.isPopular ? 'border-primary' : ''}>
                    <CardHeader>
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getPlanColor(plan.id)} mb-2`}>
                        {getPlanIcon(plan.id)}
                      </div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-2">
                        <span className="text-2xl font-bold">${plan.price}</span>
                        {plan.price > 0 && (
                          <span className="text-sm text-muted-foreground ml-1">
                            /{plan.billingPeriod === 'one-time' ? 'lifetime' : plan.billingPeriod}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardContent className="pt-0">
                      <Button
                        variant={plan.id === effectivePlan ? 'outline' : 'default'}
                        className="w-full"
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={plan.id === effectivePlan || plan.id === SubscriptionPlan.ADMIN}
                      >
                        {plan.id === effectivePlan ? 'Current Plan' : plan.id === SubscriptionPlan.ADMIN ? 'Admin Only' : plan.buttonText}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Embedded Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedPlan(null);
          }}
          plan={selectedPlan}
        />
      )}
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-8">
        <PageHeader title="Subscriptions" description="Manage your subscription and billing" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <SubscriptionsContent />
    </Suspense>
  );
}
