'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionPlan } from '@/lib/types/subscription';
import { Loader2, AlertCircle } from 'lucide-react';

// Initialize Stripe with your publishable key from environment variables
// The key should be set in .env.local or production environment variables
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
}

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface EmbeddedCheckoutProps {
  plan: SubscriptionPlan;
  userId: string;
  userEmail: string;
  userName?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EmbeddedCheckout({ 
  plan, 
  userId, 
  userEmail, 
  userName,
  onSuccess, 
  onCancel 
}: EmbeddedCheckoutProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<any>(null);
  const [paymentElement, setPaymentElement] = useState<any>(null);
  const [checkoutActions, setCheckoutActions] = useState<any>(null);

  useEffect(() => {
    initializeCheckout();
  }, []);

  const initializeCheckout = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create embedded checkout session
      const response = await fetch('/api/stripe/create-embedded-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userEmail,
          userName,
          plan,
          returnUrl: `${window.location.origin}/subscriptions?success=true`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { clientSecret, sessionId } = await response.json();

      if (!clientSecret) {
        throw new Error('No client secret received');
      }

      // Initialize Stripe
      if (!stripePromise) {
        throw new Error('Stripe publishable key is not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment variables.');
      }
      
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize. Please check your publishable key.');
      }

      // Initialize Checkout
      const checkoutInstance = await stripe.initCheckout({
        clientSecret,
      });

      // Load actions
      const loadResult = await checkoutInstance.loadActions();
      
      if (loadResult.type === 'error') {
        throw new Error(loadResult.error.message);
      }

      // Get session data and store actions
      if (loadResult.type === 'success') {
        const session = loadResult.actions.getSession();
        console.log('Checkout session:', session);
        setCheckoutActions(loadResult.actions);
      } else {
        throw new Error(loadResult.error.message);
      }

      setCheckout(checkoutInstance);

      // Create Payment Element
      const element = checkoutInstance.createPaymentElement();
      element.mount('#payment-element');
      setPaymentElement(element);

      setLoading(false);
    } catch (err: any) {
      console.error('Error initializing checkout:', err);
      setError(err.message || 'Failed to initialize payment form');
      setLoading(false);
      toast({
        title: 'Payment Error',
        description: err.message || 'Failed to load payment form',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!checkout || !checkoutActions) return;

    try {
      setLoading(true);
      setError(null);

      // Confirm payment using stored actions
      const result = await checkoutActions.confirm();

      if (result.type === 'error') {
        throw new Error(result.error.message);
      }

      // Payment successful - redirect to return URL
      // The return URL will be handled by the success page
      window.location.href = `${window.location.origin}/subscriptions?success=true`;
    } catch (err: any) {
      console.error('Error confirming payment:', err);
      setError(err.message || 'Payment failed');
      setLoading(false);
      toast({
        title: 'Payment Failed',
        description: err.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading && !checkout) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading payment form...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !checkout) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Payment Error
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={initializeCheckout} variant="outline">
            Try Again
          </Button>
          <Button onClick={onCancel} variant="ghost" className="ml-2">
            Cancel
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Purchase</CardTitle>
        <CardDescription>
          {plan === 'PLUS' ? 'Plus Plan - $5/month' : 'Pro Plan - $50 one-time'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Element Container */}
        <div id="payment-element" className="min-h-[200px]">
          {/* Payment Element will be mounted here */}
        </div>

        {/* Security Notice */}
        <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            🔒 Your payment information is secure and encrypted
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={loading || !checkout || !checkoutActions}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ${plan === 'PLUS' ? '$5' : '$50'}`
            )}
          </Button>
          <Button onClick={onCancel} variant="outline" disabled={loading}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
