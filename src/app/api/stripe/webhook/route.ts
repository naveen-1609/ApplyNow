import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { subscriptionService } from '@/lib/subscription/subscription-service';
import { SubscriptionPlan } from '@/lib/types/subscription';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

const stripe = stripeSecretKey.startsWith('sk_')
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-10-29.clover' })
  : null;

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not initialized' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as SubscriptionPlan;

        if (userId && plan) {
          const startDate = new Date();
          let endDate: Date | undefined;

          if (plan === SubscriptionPlan.PLUS) {
            endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);
          }
          // PRO is one-time, no end date

          await subscriptionService.updateSubscription(
            userId,
            plan,
            'active',
            startDate,
            endDate
          );

          // Create transaction record
          await subscriptionService.createTransaction({
            userId,
            plan,
            amount: plan === SubscriptionPlan.PLUS ? 5 : 50,
            currency: 'USD',
            paymentMethod: 'stripe',
            transactionId: session.id,
            status: 'completed',
            completedAt: new Date(),
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        // Handle subscription cancellation - downgrade to FREE
        try {
          // Find user by Stripe customer ID
          const customerId = subscription.customer as string;
          const customer = await stripe.customers.retrieve(customerId);
          
          if (typeof customer !== 'string' && customer.email) {
            // Find user by email in Firestore
            const { adminDb } = await import('@/lib/firebase-admin');
            const usersSnapshot = await adminDb
              .collection('users')
              .where('email', '==', customer.email)
              .limit(1)
              .get();
            
            if (!usersSnapshot.empty) {
              const userId = usersSnapshot.docs[0].id;
              await subscriptionService.updateSubscription(
                userId,
                SubscriptionPlan.FREE,
                'cancelled'
              );
              console.log(`✅ Downgraded user ${userId} to FREE after subscription cancellation`);
            }
          }
        } catch (error) {
          console.error('Error handling subscription deletion:', error);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // Handle recurring payment success for PLUS plan
        if (invoice.subscription) {
          try {
            const subscription = await stripe.subscriptions.retrieve(
              invoice.subscription as string
            );
            const customerId = subscription.customer as string;
            const customer = await stripe.customers.retrieve(customerId);
            
            if (typeof customer !== 'string' && customer.email) {
              // Find user and extend subscription
              const { adminDb } = await import('@/lib/firebase-admin');
              const usersSnapshot = await adminDb
                .collection('users')
                .where('email', '==', customer.email)
                .limit(1)
                .get();
              
              if (!usersSnapshot.empty) {
                const userId = usersSnapshot.docs[0].id;
                const startDate = new Date();
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + 1); // Extend by 1 month
                
                await subscriptionService.updateSubscription(
                  userId,
                  SubscriptionPlan.PLUS,
                  'active',
                  startDate,
                  endDate
                );
                console.log(`✅ Extended PLUS subscription for user ${userId}`);
              }
            }
          } catch (error) {
            console.error('Error handling payment success:', error);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        // Handle payment failure - give grace period or downgrade
        if (invoice.subscription) {
          try {
            const subscription = await stripe.subscriptions.retrieve(
              invoice.subscription as string
            );
            const customerId = subscription.customer as string;
            const customer = await stripe.customers.retrieve(customerId);
            
            if (typeof customer !== 'string' && customer.email) {
              // Find user
              const { adminDb } = await import('@/lib/firebase-admin');
              const usersSnapshot = await adminDb
                .collection('users')
                .where('email', '==', customer.email)
                .limit(1)
                .get();
              
              if (!usersSnapshot.empty) {
                const userId = usersSnapshot.docs[0].id;
                // Option 1: Give grace period (7 days)
                // Option 2: Immediately downgrade (current implementation)
                // You can customize this behavior
                const gracePeriodEnd = new Date();
                gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
                
                // For now, we'll set status to 'past_due' and let expiration handle it
                await subscriptionService.updateSubscription(
                  userId,
                  SubscriptionPlan.PLUS,
                  'past_due',
                  undefined,
                  gracePeriodEnd
                );
                console.log(`⚠️ Payment failed for user ${userId}, set to past_due with 7-day grace period`);
              }
            }
          } catch (error) {
            console.error('Error handling payment failure:', error);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
