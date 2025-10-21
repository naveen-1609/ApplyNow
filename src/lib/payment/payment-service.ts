import { SubscriptionPlan } from '@/lib/types/subscription';
import { subscriptionService } from '@/lib/subscription/subscription-service';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  plan: SubscriptionPlan;
  status: 'pending' | 'succeeded' | 'failed';
}

export class PaymentService {
  private static instance: PaymentService;

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async createPaymentIntent(plan: SubscriptionPlan, userId: string): Promise<PaymentIntent> {
    // TODO: Integrate with Stripe or other payment processor
    // For now, return a mock payment intent
    
    const planPrices = {
      [SubscriptionPlan.FREE]: 0,
      [SubscriptionPlan.PLUS]: 5,
      [SubscriptionPlan.PRO]: 50,
    };

    const mockPaymentIntent: PaymentIntent = {
      id: `pi_mock_${Date.now()}`,
      amount: planPrices[plan] * 100, // Convert to cents
      currency: 'usd',
      plan,
      status: 'pending',
    };

    // Create transaction record
    await subscriptionService.createTransaction({
      userId,
      plan,
      amount: planPrices[plan],
      currency: 'USD',
      paymentMethod: 'mock',
      transactionId: mockPaymentIntent.id,
      status: 'pending',
    });

    return mockPaymentIntent;
  }

  async confirmPayment(paymentIntentId: string, userId: string): Promise<boolean> {
    try {
      // TODO: Verify payment with Stripe or other payment processor
      // For now, simulate successful payment
      
      // Update transaction status
      await subscriptionService.updateTransactionStatus(
        paymentIntentId,
        'completed',
        new Date()
      );

      // Get the transaction to find the plan
      const transactions = await subscriptionService.getUserTransactions(userId);
      const transaction = transactions.find(t => t.transactionId === paymentIntentId);
      
      if (transaction) {
        // Update user subscription
        const startDate = new Date();
        let endDate: Date | undefined;

        if (transaction.plan === SubscriptionPlan.PLUS) {
          endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 1);
        }
        // Pro is one-time, no end date

        await subscriptionService.updateSubscription(
          userId,
          transaction.plan,
          'active',
          startDate,
          endDate
        );
      }

      return true;
    } catch (error) {
      console.error('Error confirming payment:', error);
      return false;
    }
  }

  async cancelSubscription(userId: string): Promise<boolean> {
    try {
      // TODO: Cancel subscription with payment processor
      // For now, just update the status
      
      await subscriptionService.updateSubscription(
        userId,
        SubscriptionPlan.FREE,
        'cancelled'
      );

      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  }

  // Mock payment methods for development
  async simulatePayment(paymentIntentId: string, userId: string, success: boolean = true): Promise<boolean> {
    if (success) {
      return this.confirmPayment(paymentIntentId, userId);
    } else {
      await subscriptionService.updateTransactionStatus(
        paymentIntentId,
        'failed'
      );
      return false;
    }
  }
}

export const paymentService = PaymentService.getInstance();
