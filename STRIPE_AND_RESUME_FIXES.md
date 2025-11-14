# Stripe Price Error & Resume Reading Fixes

## Issues Fixed

### 1. ✅ Stripe Price Error: "No such price: 'price_pro_onetime'"

**Problem**: The code was using hardcoded price IDs (`price_pro_onetime`, `price_plus_monthly`) that don't exist in Stripe, causing checkout initialization to fail.

**Solution**: 
- Made Stripe prices configurable via environment variables
- Added automatic price creation if they don't exist
- Added fallback mechanism with better error messages

**How it works now**:
1. **First Priority**: Uses environment variables if set:
   - `STRIPE_PLUS_PRICE_ID` - Price ID for Plus plan
   - `STRIPE_PRO_PRICE_ID` - Price ID for Pro plan
   - `STRIPE_PLUS_PRODUCT_ID` - Product ID for Plus plan (optional)
   - `STRIPE_PRO_PRODUCT_ID` - Product ID for Pro plan (optional)

2. **Second Priority**: If environment variables are not set, automatically:
   - Searches for existing products named "Plus Plan" or "Pro Plan"
   - Creates products if they don't exist
   - Searches for existing prices for those products
   - Creates prices if they don't exist ($5/month for Plus, $50 one-time for Pro)

3. **Fallback**: If Stripe is not initialized, uses hardcoded IDs (with warning)

**Setup Options**:

#### Option 1: Use Environment Variables (Recommended)
1. Go to Stripe Dashboard → Products
2. Create or find your products
3. Copy the Price IDs (starts with `price_...`)
4. Add to your `.env.local` or Vercel environment variables:
   ```bash
   STRIPE_PLUS_PRICE_ID=price_xxxxx
   STRIPE_PRO_PRICE_ID=price_xxxxx
   ```

#### Option 2: Let System Create Automatically
- Just ensure `STRIPE_SECRET_KEY` is set
- The system will automatically create products and prices on first use
- Check Stripe Dashboard after first checkout attempt to see created items

### 2. ✅ Resume Reading Issue

**Problem**: Resumes were not being read properly by the AI model, causing analysis failures.

**Root Causes Identified**:
1. Text extraction might fail silently
2. Empty text might be stored in database
3. Text might not be properly retrieved when needed

**Fixes Applied**:
1. **Enhanced Text Extraction Validation** (`src/lib/services/resumes.ts`):
   - Validates extracted text length
   - Stores extraction warnings in database
   - Provides clear error messages to users

2. **Better Error Handling** (`src/components/ats-checker/ats-checker-tool.tsx`):
   - Validates resume text before sending to AI
   - Shows helpful error messages if text is missing
   - Provides actionable guidance (re-upload or edit manually)

3. **Improved Logging**:
   - Logs resume text length and preview
   - Logs extraction status for debugging
   - Logs validation results

**How to Fix Resume Reading Issues**:

1. **Check Resume Text**:
   - Go to Resumes page
   - Click on a resume
   - Check if "Edit Text" shows content
   - If empty, the extraction failed

2. **Re-upload Resume**:
   - Delete the problematic resume
   - Re-upload as PDF (PDFs extract better than DOCX)
   - Check extraction warning message if shown

3. **Manually Add Text**:
   - Click "Edit Text" on the resume
   - Paste your resume content manually
   - Save and try ATS analysis again

4. **Check Console Logs**:
   - Open browser console (F12)
   - Look for resume extraction logs
   - Check for error messages

## Files Modified

1. **`src/lib/stripe/stripe-service.ts`**:
   - Made `initializePrices()` async
   - Added environment variable support
   - Added automatic price/product creation
   - Better error messages

2. **`env.example`**:
   - Added Stripe price ID environment variables

## Testing

### Test Stripe Fix:
1. Try to upgrade to Plus or Pro plan
2. Check browser console for any errors
3. If using auto-creation, check Stripe Dashboard for new products/prices
4. Verify checkout loads without "No such price" error

### Test Resume Reading:
1. Upload a resume (preferably PDF)
2. Check Resumes page - verify text is extracted
3. Try ATS analysis - should work if text is present
4. If text is missing, use "Edit Text" to add manually

## Troubleshooting

### Stripe Price Error Still Appears:
1. **Check Environment Variables**:
   - Verify `STRIPE_SECRET_KEY` is set
   - If using custom prices, verify `STRIPE_PLUS_PRICE_ID` and `STRIPE_PRO_PRICE_ID` are correct

2. **Check Stripe Dashboard**:
   - Go to Products → Prices
   - Verify prices exist and are active
   - Copy the correct Price IDs

3. **Check API Permissions**:
   - Ensure Stripe API key has permission to create products and prices
   - Test mode keys can create test products/prices

### Resume Still Not Reading:
1. **Check Database**:
   - Open Firestore console
   - Check `resumes` collection
   - Verify `editable_text` field has content

2. **Check Extraction**:
   - Look for `extraction_warning` field
   - If present, extraction had issues
   - Re-upload or manually add text

3. **Check File Format**:
   - PDF files extract best
   - DOCX files may have issues
   - Try converting to PDF first

4. **Manual Fix**:
   - Go to Resumes page
   - Click "Edit Text" on the resume
   - Paste resume content
   - Save and try again

## Next Steps

1. **For Stripe**: 
   - Set environment variables with your actual price IDs (recommended)
   - Or let the system create them automatically

2. **For Resumes**:
   - Re-upload any resumes with missing text
   - Use PDF format for best results
   - Manually add text if extraction fails

