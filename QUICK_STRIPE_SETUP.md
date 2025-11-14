# Quick Stripe Setup Guide

## Step 1: Add Keys to Environment Variables

Create or update your `.env.local` file in the root directory:

```env
# Stripe Secret Key (Server-side)
STRIPE_SECRET_KEY=sk_test_51SPyOIB4sU5FZqAtF14kBYLL5lPJ5xlgzeXXyTjo8mhxr7kR7sLjP24PQo

# Stripe Publishable Key (Client-side)
# Note: Make sure you have the COMPLETE key (should be longer)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SPyOIB4sU5FZqAtwUijoyVqCK8zNSTDe2z7j7By0xSq5CTcHuUsziUv

# Webhook Secret (Get from Stripe Dashboard after setting up webhook)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

⚠️ **Important**: Make sure your publishable key is complete. Test keys typically end with something like `...vQ` or similar. If the key seems truncated, copy the full key from your Stripe Dashboard.

## Step 2: Get Your Complete Keys from Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy the **Publishable key** (starts with `pk_test_`)
3. Copy the **Secret key** (starts with `sk_test_` - click "Reveal" to see it)
4. Update your `.env.local` file with the complete keys

## Step 3: Create Products and Prices in Stripe

1. Go to: https://dashboard.stripe.com/test/products
2. Click "Add product"
3. Create **Plus Plan**:
   - Name: "Plus Plan"
   - Price: $5.00 USD
   - Billing period: Monthly (recurring)
   - Copy the Price ID (starts with `price_...`)
4. Create **Pro Plan**:
   - Name: "Pro Plan"
   - Price: $50.00 USD
   - Billing period: One time
   - Copy the Price ID (starts with `price_...`)

## Step 4: Update Price IDs in Code

After creating the products, update `src/lib/stripe/stripe-service.ts`:

```typescript
private initializePrices() {
  // PLUS Plan: $5/month
  this.prices.set('PLUS', {
    id: 'price_YOUR_PLUS_PRICE_ID_HERE', // Replace with actual Price ID
    amount: 500,
    currency: 'usd',
    interval: 'month',
    productId: 'prod_plus'
  });

  // PRO Plan: $50 one-time
  this.prices.set('PRO', {
    id: 'price_YOUR_PRO_PRICE_ID_HERE', // Replace with actual Price ID
    amount: 5000,
    currency: 'usd',
    interval: 'one_time',
    productId: 'prod_pro'
  });
}
```

## Step 5: Set Up Webhook (For Production)

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-domain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy the "Signing secret" (starts with `whsec_...`)
6. Add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

## Step 6: Restart Your Development Server

After adding the keys:
```bash
npm run dev
```

## Testing

Use Stripe's test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Requires 3D Secure**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 9995`

Use any future expiration date, any 3-digit CVC, and any postal code.

## Need Help?

If you encounter issues:
1. Verify your keys are complete and correct
2. Check that `.env.local` is in your project root
3. Make sure you restarted the dev server after adding keys
4. Verify the Price IDs match what you created in Stripe Dashboard
