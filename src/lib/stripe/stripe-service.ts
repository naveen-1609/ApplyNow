import Stripe from 'stripe';

// Initialize Stripe with your secret key
// Note: You need to use your SECRET KEY (starts with sk_) for server-side operations
// The publishable key (starts with pk_) is for client-side only
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

// Check if this is a secret key
const isSecretKey = stripeSecretKey.startsWith('sk_');
const stripe = isSecretKey && stripeSecretKey 
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-10-29.clover' })
  : null;

export interface StripePrice {
  id: string;
  amount: number;
  currency: string;
  interval: 'month' | 'one_time';
  productId: string;
}

export interface CreateCheckoutSessionParams {
  userId: string;
  userEmail: string;
  userName?: string;
  plan: 'PLUS' | 'PRO';
  successUrl: string;
  cancelUrl: string;
  embedded?: boolean; // Use embedded checkout
}

export interface CreateEmbeddedCheckoutParams {
  userId: string;
  userEmail: string;
  userName?: string;
  plan: 'PLUS' | 'PRO';
  returnUrl: string;
}

export class StripeService {
  private static instance: StripeService;
  private prices: Map<string, StripePrice> = new Map();

  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  // Initialize Stripe prices from environment variables or create them dynamically
  private async initializePrices() {
    // Try to get prices from environment variables first
    const plusPriceId = process.env.STRIPE_PLUS_PRICE_ID;
    const proPriceId = process.env.STRIPE_PRO_PRICE_ID;

    if (plusPriceId && proPriceId) {
      // Use environment variable prices
      this.prices.set('PLUS', {
        id: plusPriceId,
        amount: 500, // $5.00 in cents
        currency: 'usd',
        interval: 'month',
        productId: process.env.STRIPE_PLUS_PRODUCT_ID || 'prod_plus'
      });

      this.prices.set('PRO', {
        id: proPriceId,
        amount: 5000, // $50.00 in cents
        currency: 'usd',
        interval: 'one_time',
        productId: process.env.STRIPE_PRO_PRODUCT_ID || 'prod_pro'
      });
      return;
    }

    // If no environment variables, try to fetch or create prices dynamically
    if (!stripe) {
      console.warn('⚠️ Stripe not initialized. Using fallback price IDs. Please set STRIPE_PLUS_PRICE_ID and STRIPE_PRO_PRICE_ID in environment variables.');
      // Fallback to hardcoded IDs (these won't work unless created in Stripe)
      this.prices.set('PLUS', {
        id: 'price_plus_monthly',
        amount: 500,
        currency: 'usd',
        interval: 'month',
        productId: 'prod_plus'
      });

      this.prices.set('PRO', {
        id: 'price_pro_onetime',
        amount: 5000,
        currency: 'usd',
        interval: 'one_time',
        productId: 'prod_pro'
      });
      return;
    }

    // Try to find existing prices or create them
    try {
      // Search for existing products
      const products = await stripe.products.list({ limit: 100 });
      
      let plusProduct = products.data.find(p => p.name === 'Plus Plan' || p.metadata?.plan === 'PLUS');
      let proProduct = products.data.find(p => p.name === 'Pro Plan' || p.metadata?.plan === 'PRO');

      // Create products if they don't exist
      if (!plusProduct) {
        plusProduct = await stripe.products.create({
          name: 'Plus Plan',
          description: 'Monthly subscription plan',
          metadata: { plan: 'PLUS' }
        });
      }

      if (!proProduct) {
        proProduct = await stripe.products.create({
          name: 'Pro Plan',
          description: 'One-time payment for lifetime access',
          metadata: { plan: 'PRO' }
        });
      }

      // Find or create prices
      const plusPrices = await stripe.prices.list({
        product: plusProduct.id,
        active: true,
        limit: 1
      });

      const proPrices = await stripe.prices.list({
        product: proProduct.id,
        active: true,
        limit: 1
      });

      let plusPrice = plusPrices.data[0];
      let proPrice = proPrices.data[0];

      // Create prices if they don't exist
      if (!plusPrice) {
        plusPrice = await stripe.prices.create({
          product: plusProduct.id,
          unit_amount: 500,
          currency: 'usd',
          recurring: { interval: 'month' }
        });
      }

      if (!proPrice) {
        proPrice = await stripe.prices.create({
          product: proProduct.id,
          unit_amount: 5000,
          currency: 'usd'
        });
      }

      // Store the prices
      this.prices.set('PLUS', {
        id: plusPrice.id,
        amount: plusPrice.unit_amount || 500,
        currency: plusPrice.currency,
        interval: 'month',
        productId: plusProduct.id
      });

      this.prices.set('PRO', {
        id: proPrice.id,
        amount: proPrice.unit_amount || 5000,
        currency: proPrice.currency,
        interval: 'one_time',
        productId: proProduct.id
      });

      console.log('✅ Stripe prices initialized:', {
        PLUS: plusPrice.id,
        PRO: proPrice.id
      });
    } catch (error) {
      console.error('❌ Error initializing Stripe prices:', error);
      throw new Error('Failed to initialize Stripe prices. Please set STRIPE_PLUS_PRICE_ID and STRIPE_PRO_PRICE_ID in environment variables, or ensure Stripe API key has permission to create products and prices.');
    }
  }

  // Create or get Stripe customer
  async createOrGetCustomer(email: string, name?: string): Promise<string> {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Please set STRIPE_SECRET_KEY environment variable.');
    }

    try {
      // Try to find existing customer
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0].id;
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email: email,
        name: name,
      });

      return customer.id;
    } catch (error) {
      console.error('Error creating/getting customer:', error);
      throw error;
    }
  }

  // Create embedded checkout session
  async createEmbeddedCheckoutSession(params: CreateEmbeddedCheckoutParams): Promise<{ clientSecret: string; sessionId: string }> {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Please set STRIPE_SECRET_KEY environment variable.');
    }

    await this.initializePrices();
    const price = this.prices.get(params.plan);
    
    if (!price) {
      throw new Error(`Price not found for plan: ${params.plan}`);
    }

    try {
      // Create or get customer
      const customerId = await this.createOrGetCustomer(params.userEmail, params.userName);

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        ui_mode: 'embedded',
        mode: params.plan === 'PRO' ? 'payment' : 'subscription',
        payment_method_types: ['card'],
        customer: customerId,
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        return_url: params.returnUrl,
        metadata: {
          userId: params.userId,
          plan: params.plan,
        },
      };

      const session = await stripe.checkout.sessions.create(sessionParams);
      
      return {
        clientSecret: session.client_secret || '',
        sessionId: session.id,
      };
    } catch (error) {
      console.error('Error creating embedded checkout session:', error);
      throw error;
    }
  }

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<string> {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Please set STRIPE_SECRET_KEY environment variable.');
    }

    await this.initializePrices();
    const price = this.prices.get(params.plan);
    
    if (!price) {
      throw new Error(`Price not found for plan: ${params.plan}`);
    }

    try {
      // Create or get customer
      const customerId = await this.createOrGetCustomer(params.userEmail, params.userName);

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: params.plan === 'PRO' ? 'payment' : 'subscription',
        payment_method_types: ['card'],
        customer: customerId,
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
          userId: params.userId,
          plan: params.plan,
        },
      };

      // Use embedded mode if requested
      if (params.embedded) {
        sessionParams.ui_mode = 'embedded';
        sessionParams.return_url = params.successUrl;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      return session.url || '';
    } catch (error) {
      console.error('Error creating Stripe checkout session:', error);
      throw error;
    }
  }

  async getSubscriptionStatus(sessionId: string): Promise<'active' | 'inactive' | 'cancelled'> {
    if (!stripe) {
      throw new Error('Stripe is not initialized');
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status === 'paid') {
        return 'active';
      }
      return 'inactive';
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return 'inactive';
    }
  }

  async getCustomerSubscriptions(customerEmail: string): Promise<Stripe.Subscription[]> {
    if (!stripe) {
      throw new Error('Stripe is not initialized');
    }

    try {
      const customers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });

      if (customers.data.length === 0) {
        return [];
      }

      const subscriptions = await stripe.subscriptions.list({
        customer: customers.data[0].id,
        status: 'all',
      });

      return subscriptions.data;
    } catch (error) {
      console.error('Error getting customer subscriptions:', error);
      return [];
    }
  }
}

export const stripeService = StripeService.getInstance();
