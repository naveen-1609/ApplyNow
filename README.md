# Application Console

> A comprehensive job search management platform with AI-powered resume optimization, application tracking, and automated email notifications.

## 📚 Documentation

- **[APPLICATION_OVERVIEW.md](./APPLICATION_OVERVIEW.md)** - High-level overview and architecture
- **[FEATURES_DOCUMENTATION.md](./FEATURES_DOCUMENTATION.md)** - Detailed feature explanations
- **[ARCHITECTURE_DETAILED.md](./ARCHITECTURE_DETAILED.md)** - Technical architecture deep dive
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup and configuration instructions
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - API endpoints reference
- **[COMPONENT_DOCUMENTATION.md](./COMPONENT_DOCUMENTATION.md)** - UI component guide
- **[VALIDATION_REPORT.md](./VALIDATION_REPORT.md)** - Complete validation and testing report
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick reference guide

## 🚀 Quick Start

```bash
npm install
npm run dev          # Frontend (port 9002)
npm run genkit:dev   # AI server (for ATS checker)
```

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete setup instructions.

## ✨ Features

- 📄 **Resume Management** - Upload, store, and manage multiple resumes with automatic text extraction
- 💼 **Application Tracking** - Track job applications with status, dates, and linked resumes/cover letters
- 🤖 **ATS Checker** - AI-powered resume analysis and optimization with interactive chat assistant
- 📧 **Cover Letter Generator** - Generate personalized cover letters based on job descriptions
- 📊 **Dashboard Analytics** - Visual insights with KPIs, charts, and application trends
- 🎯 **Daily Targets** - Set and track daily application goals with calendar view
- 📬 **Email Notifications** - Automated reminder and summary emails at customizable times
- 💳 **Subscriptions** - Multiple plan tiers (FREE, PLUS, PRO, ADMIN) with Stripe integration
- 👤 **User Profile** - Manage profile, links, notes, and templates

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Firebase Admin SDK
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **AI**: Google Genkit + OpenAI GPT-4
- **Email**: SendGrid
- **Payments**: Stripe
- **Deployment**: Vercel
- **UI Components**: Radix UI

## 📖 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ApplyNow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in all required variables (see [SETUP_GUIDE.md](./SETUP_GUIDE.md))

4. **Deploy Firestore rules and indexes**
   ```bash
   firebase login
   firebase use <your-project-id>
   firebase deploy --only firestore:rules
   firebase deploy --only firestore:indexes
   ```

5. **Start development**
   ```bash
   npm run dev          # Frontend on http://localhost:9002
   npm run genkit:dev   # AI server for ATS checker
   ```

## 🔐 Security

- Firestore security rules enforce user data isolation
- All API routes require authentication
- Admin users have special access controls
- Input validation on all forms
- Secure payment processing with Stripe

## 📊 Application Status

**Status**: ✅ Production Ready

All core features are implemented, tested, and documented. See [VALIDATION_REPORT.md](./VALIDATION_REPORT.md) for complete validation details.

## 🐛 Troubleshooting

Common issues and solutions:

- **"Missing or insufficient permissions"** → Deploy Firestore rules
- **"Index required" error** → Deploy indexes and wait for build
- **Email not sending** → Check SendGrid API key and sender verification
- **Stripe not working** → Verify API keys and webhook endpoint
- **AI features not working** → Check OpenAI API key and Genkit server

See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for more troubleshooting tips.

## 📝 License

Private - All rights reserved

## 🆘 Support

For issues or questions:
1. Check the documentation files
2. Review console logs for errors
3. Check Firebase Console for database issues
4. Review Vercel logs for API errors

---

**Built with ❤️ for job seekers**
