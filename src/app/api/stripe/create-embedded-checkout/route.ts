import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/stripe/stripe-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userEmail, userName, plan, returnUrl } = body;

    if (!userId || !userEmail || !plan || !returnUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (plan !== 'PLUS' && plan !== 'PRO') {
      return NextResponse.json(
        { error: 'Invalid plan. Must be PLUS or PRO' },
        { status: 400 }
      );
    }

    const { clientSecret, sessionId } = await stripeService.createEmbeddedCheckoutSession({
      userId,
      userEmail,
      userName,
      plan,
      returnUrl,
    });

    return NextResponse.json({ clientSecret, sessionId });
  } catch (error: any) {
    console.error('Error creating embedded checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
