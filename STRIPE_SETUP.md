# Stripe Payment Integration Setup

## 🔑 Environment Variables

You need to set up the following environment variables:

### Required:
1. **STRIPE_SECRET_KEY** - Your Stripe secret key (starts with `sk_`)
   - Get it from: https://dashboard.stripe.com/apikeys
   - **Important**: The key you provided (`pk_test_...`) is a **publishable key**, not a secret key
   - You need to get the **secret key** from your Stripe dashboard

2. **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY** - Your Stripe publishable key (starts with `pk_`)
   - Get it from: https://dashboard.stripe.com/apikeys
   - This is the key you already have: `pk_test_51SPyOIB4sU5FZqAtwUijoyVqCK8zNSTDe2z7j7By0xSq5CTcHuUsziUvaV3CxP9pY5qhmi2ylG8iX8FLe7Ngv7jp00bWy4XTvQ`
   - Used for client-side Stripe.js initialization

3. **STRIPE_WEBHOOK_SECRET** - Webhook signing secret (for production)
   - Get it from: https://dashboard.stripe.com/webhooks
   - Required for webhook signature verification

### Adding Environment Variables:

#### For Local Development:
Create a `.env.local` file in the root directory:
```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SPyOIB4sU5FZqAtwUijoyVqCK8zNSTDe2z7j7By0xSq5CTcHuUsziUvaV3CxP9pY5qhmi2ylG8iX8FLe7Ngv7jp00bWy4XTvQ
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

#### For Production (Vercel):
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add:
   - `STRIPE_SECRET_KEY` = your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` = your webhook secret

## 📦 Stripe Dashboard Setup

### Step 1: Create Products and Prices

1. Go to Stripe Dashboard: https://dashboard.stripe.com/products
2. Create two products:

#### Product 1: Plus Plan
- **Name**: Plus Plan
- **Description**: Monthly subscription with AI features
- **Price**: $5.00 USD
- **Billing**: Recurring (monthly)
- **Price ID**: Copy this (starts with `price_...`)

#### Product 2: Pro Plan
- **Name**: Pro Plan
- **Description**: One-time payment for lifetime access
- **Price**: $50.00 USD
- **Billing**: One-time payment
- **Price ID**: Copy this (starts with `price_...`)

### Step 2: Update Price IDs in Code

After creating the products, update the price IDs in `src/lib/stripe/stripe-service.ts`:

```typescript
this.prices.set('PLUS', {
  id: 'price_YOUR_PLUS_PRICE_ID', // Replace with actual price ID
  amount: 500,
  currency: 'usd',
  interval: 'month',
  productId: 'prod_YOUR_PLUS_PRODUCT_ID'
});

this.prices.set('PRO', {
  id: 'price_YOUR_PRO_PRICE_ID', // Replace with actual price ID
  amount: 5000,
  currency: 'usd',
  interval: 'one_time',
  productId: 'prod_YOUR_PRO_PRODUCT_ID'
});
```

### Step 3: Set Up Webhooks

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL:
   - **Local**: `https://your-domain.com/api/stripe/webhook`
   - **Production**: `https://your-production-domain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret and add it to your environment variables

## 🚀 Testing

### Test Mode:
- Use test keys (starts with `sk_test_` and `pk_test_`)
- Use test card numbers from Stripe: https://stripe.com/docs/testing

### Test Cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Use any future expiry date and any 3-digit CVC

## 📝 Features Implemented

✅ **Stripe Checkout Integration**
- Secure payment processing
- Automatic redirect to Stripe checkout
- Success/cancel URL handling

✅ **Webhook Handler**
- Processes payment completions
- Updates subscription status
- Creates transaction records

✅ **Subscriptions Page**
- Shows current subscription
- Displays billing history
- Upgrade/downgrade options

✅ **Pricing Page Integration**
- Direct Stripe checkout
- Loading states
- Error handling

## 🔒 Security Notes

1. **Never commit secret keys** to version control
2. **Use environment variables** for all sensitive data
3. **Verify webhook signatures** to prevent fraud
4. **Use HTTPS** in production
5. **Test thoroughly** before going live

## 🐛 Troubleshooting

### "Stripe is not initialized" error:
- Check that `STRIPE_SECRET_KEY` is set correctly
- Ensure it starts with `sk_` (not `pk_`)
- Restart your development server after adding env variables

### Webhook not working:
- Verify webhook URL is correct
- Check webhook secret is set
- View webhook logs in Stripe dashboard

### Payment not completing:
- Check browser console for errors
- Verify Stripe checkout is loading
- Test with Stripe test cards

## 📚 Resources

- Stripe Documentation: https://stripe.com/docs
- Stripe Testing: https://stripe.com/docs/testing
- Stripe Webhooks: https://stripe.com/docs/webhooks
