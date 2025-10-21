'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-optimized-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { paymentService } from '@/lib/payment/payment-service';
import { SubscriptionPlan, SUBSCRIPTION_PLANS } from '@/lib/types/subscription';
import { CreditCard, Lock, CheckCircle, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan;
}

export function PaymentModal({ isOpen, onClose, plan }: PaymentModalProps) {
  const { user } = useAuth();
  const { refreshProfile } = useSubscription();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  });

  const planDetails = SUBSCRIPTION_PLANS.find(p => p.id === plan);

  const handlePayment = async () => {
    if (!user || !planDetails) return;

    setLoading(true);
    try {
      // Create payment intent
      const paymentIntent = await paymentService.createPaymentIntent(plan, user.uid);
      
      // For demo purposes, simulate successful payment
      // In production, you would integrate with Stripe or another payment processor
      const success = await paymentService.simulatePayment(paymentIntent.id, user.uid, true);
      
      if (success) {
        toast({
          title: 'Payment Successful!',
          description: `You've been upgraded to ${planDetails.name} plan.`,
        });
        
        await refreshProfile();
        onClose();
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (!planDetails) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
          <DialogDescription>
            Upgrade to {planDetails.name} plan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{planDetails.name} Plan</h3>
                <Badge variant="outline">{planDetails.billingPeriod}</Badge>
              </div>
              <div className="text-2xl font-bold">
                ${planDetails.price}
                {planDetails.price > 0 && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    /{planDetails.billingPeriod === 'one-time' ? 'lifetime' : planDetails.billingPeriod}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {planDetails.description}
              </p>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <div className="space-y-4">
            <div>
              <Label>Payment Method</Label>
              <div className="flex items-center gap-2 mt-2">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm">Credit Card</span>
                <Lock className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="card-name">Cardholder Name</Label>
                <Input
                  id="card-name"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label htmlFor="card-number">Card Number</Label>
                <Input
                  id="card-number"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails(prev => ({ 
                    ...prev, 
                    number: formatCardNumber(e.target.value) 
                  }))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="card-expiry">Expiry Date</Label>
                  <Input
                    id="card-expiry"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails(prev => ({ 
                      ...prev, 
                      expiry: formatExpiry(e.target.value) 
                    }))}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label htmlFor="card-cvv">CVV</Label>
                  <Input
                    id="card-cvv"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails(prev => ({ 
                      ...prev, 
                      cvv: e.target.value.replace(/\D/g, '') 
                    }))}
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
              <CheckCircle className="h-4 w-4" />
              <span>Your payment information is secure and encrypted</span>
            </div>
          </div>

          {/* Demo Notice */}
          <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
              <AlertCircle className="h-4 w-4" />
              <span>This is a demo. No real payment will be processed.</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              `Pay $${planDetails.price}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
