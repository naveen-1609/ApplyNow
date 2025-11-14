# Setup & Configuration Guide

## 🚀 Initial Setup

### **Prerequisites**
- Node.js 18+ installed
- Firebase account
- Vercel account (for deployment)
- SendGrid account (for emails)
- Stripe account (for payments)
- OpenAI API key (for AI features)

---

## 📦 Installation

### **1. Clone and Install**
```bash
git clone <repository-url>
cd ApplyNow
npm install
```

### **2. Environment Variables**

Create `.env.local` file with the following:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# SendGrid
SENDGRID_API_KEY=SG.your_sendgrid_api_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLUS_PRICE_ID=price_... (optional)
STRIPE_PRO_PRICE_ID=price_... (optional)

# OpenAI (for AI features)
OPENAI_API_KEY=sk-...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

---

## 🔥 Firebase Setup

### **1. Create Firebase Project**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project
3. Enable Firestore Database
4. Enable Firebase Storage
5. Enable Authentication (Email/Password + Google)

### **2. Get Firebase Config**
1. Project Settings → General
2. Scroll to "Your apps"
3. Add web app
4. Copy config values to `.env.local`

### **3. Create Service Account**
1. Project Settings → Service Accounts
2. Generate new private key
3. Download JSON
4. Extract `private_key` and `client_email` to `.env.local`

### **4. Deploy Firestore Rules**
```bash
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules
```

### **5. Deploy Firestore Indexes**
```bash
firebase deploy --only firestore:indexes
```

**Note**: Indexes may take a few minutes to build. Check status in Firebase Console.

---

## 📧 SendGrid Setup

### **1. Create SendGrid Account**
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Verify your email

### **2. Create API Key**
1. Settings → API Keys
2. Create API Key
3. Give it "Full Access" or "Mail Send" permissions
4. Copy to `SENDGRID_API_KEY` in `.env.local`

### **3. Verify Sender**
1. Settings → Sender Authentication
2. Verify Single Sender or Domain
3. Use verified email in `email.ts` (default: `info@appconsole.tech`)

---

## 💳 Stripe Setup

### **1. Create Stripe Account**
1. Sign up at [Stripe](https://stripe.com/)
2. Get test API keys from Dashboard

### **2. Create Products & Prices**
1. Products → Add Product
2. Create "Plus" plan ($5/month)
3. Create "Pro" plan ($50 one-time)
4. Copy Price IDs to `.env.local` (optional - system can auto-create)

### **3. Configure Webhook**
1. Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

---

## 🤖 OpenAI Setup

### **1. Get API Key**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. API Keys → Create new secret key
3. Copy to `OPENAI_API_KEY` in `.env.local`

### **2. Verify Access**
- Ensure you have access to GPT-4 models
- Check billing/usage limits

---

## 🏃 Local Development

### **1. Start Development Server**
```bash
npm run dev
```

Server runs on `http://localhost:9002`

### **2. Start Genkit Dev Server** (for AI features)
```bash
npm run genkit:dev
```

### **3. Test Features**
- Create account and login
- Upload a resume
- Add a job application
- Test ATS checker
- Generate cover letter

---

## 🚀 Production Deployment

### **1. Vercel Deployment**

#### **Option A: Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel
```

#### **Option B: GitHub Integration**
1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### **2. Environment Variables in Vercel**
1. Project Settings → Environment Variables
2. Add all variables from `.env.local`
3. Set for Production, Preview, and Development

### **3. Configure Vercel Cron**
- Cron jobs are auto-configured via `vercel.json`
- No additional setup needed
- Runs automatically on Vercel

### **4. Update Webhook URLs**
- Update Stripe webhook URL to production domain
- Update any other webhook URLs

---

## ✅ Verification Checklist

### **Firebase**
- [ ] Firestore rules deployed
- [ ] Indexes created and built
- [ ] Storage rules configured
- [ ] Authentication providers enabled
- [ ] Service account created

### **SendGrid**
- [ ] API key created
- [ ] Sender verified
- [ ] Test email sent successfully

### **Stripe**
- [ ] Test API keys configured
- [ ] Products and prices created
- [ ] Webhook endpoint configured
- [ ] Test payment successful

### **OpenAI**
- [ ] API key configured
- [ ] Billing set up
- [ ] Test AI flow working

### **Application**
- [ ] Can create account
- [ ] Can upload resume
- [ ] Can add application
- [ ] ATS checker works
- [ ] Cover letter generation works
- [ ] Email notifications working
- [ ] Payments processing

---

## 🐛 Troubleshooting

### **Common Issues**

#### **"Missing or insufficient permissions"**
- **Solution**: Deploy Firestore rules
```bash
firebase deploy --only firestore:rules
```

#### **"Index required" error**
- **Solution**: Deploy indexes and wait for build
```bash
firebase deploy --only firestore:indexes
```
- Check status in Firebase Console → Firestore → Indexes

#### **Email not sending**
- Check SendGrid API key is correct
- Verify sender email is verified
- Check SendGrid activity logs

#### **Stripe checkout not working**
- Verify API keys are correct
- Check webhook endpoint is accessible
- Ensure products/prices exist

#### **AI features not working**
- Verify OpenAI API key
- Check Genkit dev server is running (local)
- Check API key has sufficient credits

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Stripe Documentation](https://stripe.com/docs)
- [OpenAI Documentation](https://platform.openai.com/docs)

---

## 🔄 Updates & Maintenance

### **Regular Tasks**
1. Monitor Firebase usage and quotas
2. Check SendGrid email delivery rates
3. Review Stripe payment logs
4. Monitor OpenAI API usage
5. Update dependencies regularly

### **Backup Strategy**
- Firestore: Automatic backups (Firebase feature)
- Storage: Manual backups recommended
- Code: Git repository

---

## 🆘 Support

For issues or questions:
1. Check console logs for errors
2. Review Firebase Console for database issues
3. Check Vercel logs for API errors
4. Review this documentation

---

**Setup Complete!** 🎉

Your Application Console should now be fully configured and ready to use.

