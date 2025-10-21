'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown, Sparkles } from 'lucide-react';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/lib/types/subscription';
import { useAuth } from '@/hooks/use-optimized-auth';
import { useToast } from '@/hooks/use-toast';
import { PaymentModal } from '@/components/payment/payment-modal';
import Link from 'next/link';

export function PricingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

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
      // Redirect to dashboard for free plan
      window.location.href = '/dashboard';
      return;
    }
    
    // For paid plans, open payment modal
    setSelectedPlan(plan);
    setPaymentModalOpen(true);
  };

  const getPlanIcon = (plan: SubscriptionPlan) => {
    switch (plan) {
      case SubscriptionPlan.FREE:
        return <Sparkles className="h-6 w-6" />;
      case SubscriptionPlan.PLUS:
        return <Zap className="h-6 w-6" />;
      case SubscriptionPlan.PRO:
        return <Crown className="h-6 w-6" />;
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
    }
  };

  return (
    <div className="min-h-screen bg-background py-24">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="mb-6">
            <Badge variant="outline" className="mb-4">
              <Star className="h-4 w-4 mr-2" />
              Choose Your Plan
            </Badge>
          </div>
          
          <h1 className="font-headline text-5xl md:text-6xl font-bold text-foreground mb-6">
            Simple, Transparent
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 block">
              Pricing
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Start free and upgrade as you grow. No hidden fees, no surprises.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
                plan.isPopular 
                  ? 'border-primary shadow-lg scale-105' 
                  : 'border-border hover:border-primary/40'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${getPlanGradient(plan)} text-white mb-4 mx-auto`}>
                  {getPlanIcon(plan.id)}
                </div>
                
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {plan.description}
                </CardDescription>
                
                <div className="mt-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-foreground">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground ml-2">
                        /{plan.billingPeriod === 'one-time' ? 'lifetime' : plan.billingPeriod}
                      </span>
                    )}
                  </div>
                  {plan.price === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Forever free
                    </p>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="px-6">
                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mt-0.5">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter className="px-6 pt-6">
                <Button
                  className={`w-full ${
                    plan.isPopular 
                      ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70' 
                      : ''
                  }`}
                  variant={plan.buttonVariant as any}
                  size="lg"
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Can I change plans anytime?</h3>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-2">What happens to my data?</h3>
                <p className="text-muted-foreground">
                  Your data is always safe and accessible. Downgrading won't delete your existing applications.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Is there a free trial?</h3>
                <p className="text-muted-foreground">
                  The Free plan is available forever with no time limits. Try all features risk-free.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
                <p className="text-muted-foreground">
                  We accept all major credit cards, PayPal, and bank transfers for Pro plans.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4">
              Ready to accelerate your job search?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of job seekers who have found their dream jobs with ApplyNow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/signup">
                  Start Free Today
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
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
