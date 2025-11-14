# Stripe Keys Configuration

## Your Stripe API Keys

Please add these keys to your `.env.local` file (for local development) and to your production environment variables:

### For Local Development (.env.local):

```env
# Stripe Secret Key (Server-side only - NEVER expose this to client)
STRIPE_SECRET_KEY=sk_test_51SPyOIB4sU5FZqAtF14kBYLL5lPJ5xlgzeXXyTjo8mhxr7kR7sLjP24PQo

# Stripe Publishable Key (Client-side - safe to expose)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SPyOIB4sU5FZqAtwUijoyVqCK8zNSTDe2z7j7By0xSq5CTcHuUsziUv

# Stripe Webhook Secret (Get this from Stripe Dashboard after setting up webhook)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### For Production (Vercel/Deployment Platform):

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the following:
   - `STRIPE_SECRET_KEY` = `sk_test_51SPyOIB4sU5FZqAtF14kBYLL5lPJ5xlgzeXXyTjo8mhxr7kR7sLjP24PQo`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_51SPyOIB4sU5FZqAtwUijoyVqCK8zNSTDe2z7j7By0xSq5CTcHuUsziUv`
   - `STRIPE_WEBHOOK_SECRET` = (Get from Stripe Dashboard)

## Important Notes:

⚠️ **Security Warning:**
- The **Secret Key** (starts with `sk_`) should NEVER be exposed to the client-side code
- The **Publishable Key** (starts with `pk_`) is safe to use in client-side code
- Never commit your `.env.local` file to git
- Make sure your `.env.local` is in `.gitignore`

## Next Steps:

1. **Create Products in Stripe Dashboard:**
   - Go to https://dashboard.stripe.com/test/products
   - Create a product for "Plus Plan" ($5/month subscription)
   - Create a product for "Pro Plan" ($50 one-time payment)
   - Copy the Price IDs and update them in `src/lib/stripe/stripe-service.ts`

2. **Set up Webhook:**
   - Go to https://dashboard.stripe.com/test/webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`
   - Copy the webhook signing secret and add it to `STRIPE_WEBHOOK_SECRET`

3. **Update Price IDs:**
   - Once you have the Price IDs from Stripe, update the `initializePrices()` method in `src/lib/stripe/stripe-service.ts`

## Testing:

After setting up the keys, you can test with Stripe's test card numbers:
- Success: `4242 4242 4242 4242`
- Requires Authentication: `4000 0025 0000 3155`
- Declined: `4000 0000 0000 9995`

Any expiration date, CVC, and postal code will work for testing.
