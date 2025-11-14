# Quick Reference Guide

## 🚀 Getting Started

### **Start Development**
```bash
npm install
npm run dev          # Frontend (port 9002)
npm run genkit:dev   # AI server (for ATS checker)
```

### **Deploy to Production**
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
vercel deploy
```

---

## 📁 Key File Locations

### **Pages**
- Dashboard: `src/app/(app)/dashboard/page.tsx`
- Applications: `src/app/(app)/applications/page.tsx`
- Resumes: `src/app/(app)/resumes/page.tsx`
- Cover Letters: `src/app/(app)/cover-letters/page.tsx`
- ATS Checker: `src/app/(app)/ats-checker/page.tsx`
- Targets: `src/app/(app)/targets/page.tsx`
- Subscriptions: `src/app/(app)/subscriptions/page.tsx`
- Settings: `src/app/(app)/settings/page.tsx`
- Profile: `src/app/(app)/profile/page.tsx`

### **Services**
- Applications: `src/lib/services/applications.ts`
- Resumes: `src/lib/services/resumes.ts`
- Cover Letters: `src/lib/services/cover-letters.ts`
- Email: `src/lib/services/email.ts`
- Schedules: `src/lib/services/schedules-server.ts`
- Targets: `src/lib/services/targets-server.ts`
- Stripe: `src/lib/stripe/stripe-service.ts`
- Subscriptions: `src/lib/subscription/subscription-service.ts`

### **AI Flows**
- ATS Checker: `src/ai/flows/ats-checker-flow.ts`
- Genkit Config: `src/ai/genkit.ts`

### **Configuration**
- Firestore Rules: `firestore.rules`
- Firestore Indexes: `firestore.indexes.json`
- Vercel Config: `vercel.json`
- Types: `src/lib/types.ts`

---

## 🔑 Environment Variables

### **Required**
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_PROJECT_ID
FIREBASE_ADMIN_PRIVATE_KEY
FIREBASE_ADMIN_CLIENT_EMAIL

# SendGrid
SENDGRID_API_KEY

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

# OpenAI
OPENAI_API_KEY
```

---

## 🗄️ Firestore Collections

- `users` - User profiles
- `job_applications` - Job applications
- `resumes` - Resume documents
- `cover_letters` - Cover letter documents
- `targets` - Daily targets
- `schedules` - Email schedules
- `subscription_transactions` - Payment records
- `admin_users` - Admin user records

---

## 🔧 Common Tasks

### **Add New Feature**
1. Create component in `src/components/`
2. Create service in `src/lib/services/`
3. Add types to `src/lib/types.ts`
4. Update Firestore rules if needed
5. Add route to sidebar if needed

### **Fix Permission Error**
```bash
firebase deploy --only firestore:rules
```

### **Create Index for Query**
1. Add to `firestore.indexes.json`
2. Deploy: `firebase deploy --only firestore:indexes`
3. Wait for index to build (check Firebase Console)

### **Test Email Locally**
```
GET /api/cron/notifications?local=true
GET /api/notifications/trigger-now?email=user@example.com
```

### **Test Stripe Locally**
- Use Stripe test keys
- Use Stripe CLI for webhooks: `stripe listen --forward-to localhost:9002/api/stripe/webhook`

---

## 📊 Feature Status

| Feature | Status | Documentation |
|---------|--------|---------------|
| Authentication | ✅ | `FEATURES_DOCUMENTATION.md` |
| Resumes | ✅ | `FEATURES_DOCUMENTATION.md` |
| Applications | ✅ | `FEATURES_DOCUMENTATION.md` |
| ATS Checker | ✅ | `FEATURES_DOCUMENTATION.md` |
| Cover Letters | ✅ | `FEATURES_DOCUMENTATION.md` |
| Dashboard | ✅ | `FEATURES_DOCUMENTATION.md` |
| Targets | ✅ | `FEATURES_DOCUMENTATION.md` |
| Email Notifications | ✅ | `FEATURES_DOCUMENTATION.md` |
| Subscriptions | ✅ | `FEATURES_DOCUMENTATION.md` |
| Profile | ✅ | `FEATURES_DOCUMENTATION.md` |

---

## 🐛 Troubleshooting

### **"Missing or insufficient permissions"**
→ Deploy Firestore rules

### **"Index required" error**
→ Deploy indexes and wait for build

### **Email not sending**
→ Check SendGrid API key and sender verification

### **Stripe not working**
→ Verify API keys and webhook endpoint

### **AI features not working**
→ Check OpenAI API key and Genkit server

---

## 📚 Documentation Files

1. **APPLICATION_OVERVIEW.md** - High-level overview
2. **FEATURES_DOCUMENTATION.md** - How each feature works
3. **ARCHITECTURE_DETAILED.md** - Technical deep dive
4. **SETUP_GUIDE.md** - Setup instructions
5. **API_DOCUMENTATION.md** - API reference
6. **COMPONENT_DOCUMENTATION.md** - Component guide
7. **VALIDATION_REPORT.md** - Validation results
8. **QUICK_REFERENCE.md** - This file

---

## ✅ Production Checklist

- [ ] All environment variables set
- [ ] Firestore rules deployed
- [ ] Firestore indexes deployed
- [ ] SendGrid sender verified
- [ ] Stripe webhook configured
- [ ] OpenAI API key configured
- [ ] Test all features
- [ ] Review security rules
- [ ] Monitor error logs

---

**Application is production-ready!** 🎉

