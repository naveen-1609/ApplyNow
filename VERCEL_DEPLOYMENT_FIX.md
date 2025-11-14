# Vercel Deployment Fix

## Issues Fixed

### 1. **Peer Dependency Conflict**
**Problem**: `@dataconnect/generated` requires `firebase@^11.3.0 || ^12.0.0`, but project uses `firebase@^10.12.2`.

**Solution**: Added npm `overrides` in `package.json` to resolve the peer dependency conflict:
```json
"overrides": {
  "@dataconnect/generated": {
    "firebase": "$firebase"
  }
}
```

This tells npm to use the project's firebase version for the dataconnect package.

### 2. **Build Script Compatibility**
**Problem**: Build script used Windows-specific `set` command which doesn't work on Vercel (Linux).

**Solution**: Changed from:
```json
"build": "set NODE_ENV=production && next build"
```

To:
```json
"build": "next build"
```

Vercel automatically sets `NODE_ENV=production` during builds.

### 3. **Standalone Output**
**Problem**: `output: 'standalone'` in `next.config.ts` is not needed for Vercel and can cause issues.

**Solution**: Commented out the standalone output:
```typescript
// output: 'standalone', // Commented out for Vercel deployment
```

Vercel handles deployment optimization automatically.

## Deployment Steps

1. **Commit the changes**:
   ```bash
   git add package.json next.config.ts
   git commit -m "Fix Vercel deployment issues"
   git push
   ```

2. **Vercel will automatically redeploy** when you push to your main branch.

3. **If deployment still fails**, check:
   - All environment variables are set in Vercel dashboard
   - Build logs for specific errors
   - Node.js version (should be 18+)

## Environment Variables Required in Vercel

Make sure these are set in Vercel → Project Settings → Environment Variables:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `SENDGRID_API_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `OPENAI_API_KEY`

## Additional Notes

- The `@dataconnect/generated` package is not actually used in the codebase, but removing it might break if Firebase Data Connect is needed in the future. The override is the safest solution.
- If you want to remove the dataconnect package entirely, you can remove it from `package.json` and delete the `src/dataconnect-generated` folder, but this is not recommended if you plan to use Firebase Data Connect.

## Verification

After deployment, verify:
- ✅ Application loads without errors
- ✅ Authentication works
- ✅ Database operations work
- ✅ API routes respond correctly
- ✅ Cron jobs are scheduled (check Vercel dashboard)

