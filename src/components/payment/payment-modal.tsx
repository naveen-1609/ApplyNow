'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-optimized-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { EmbeddedCheckout } from '@/components/payment/embedded-checkout';
import { SubscriptionPlan, SUBSCRIPTION_PLANS } from '@/lib/types/subscription';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan;
}

export function PaymentModal({ isOpen, onClose, plan }: PaymentModalProps) {
  const { user } = useAuth();
  const { refreshProfile } = useSubscription();
  const { toast } = useToast();

  const planDetails = SUBSCRIPTION_PLANS.find(p => p.id === plan);

  const handleSuccess = async () => {
    await refreshProfile();
    onClose();
    toast({
      title: 'Payment Successful!',
      description: `You've been upgraded to ${planDetails?.name} plan.`,
    });
  };

  const handleCancel = () => {
    onClose();
  };

  if (!planDetails || !user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
          <DialogDescription>
            Upgrade to {planDetails.name} plan
          </DialogDescription>
        </DialogHeader>

        <EmbeddedCheckout
          plan={plan}
          userId={user.uid}
          userEmail={user.email || ''}
          userName={user.displayName || undefined}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
