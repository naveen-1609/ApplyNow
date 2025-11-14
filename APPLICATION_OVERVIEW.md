# Application Console - Complete Overview

## 🎯 Application Purpose

Application Console is a comprehensive job search management platform that helps job seekers:
- Track job applications efficiently
- Optimize resumes for ATS (Applicant Tracking Systems)
- Generate personalized cover letters
- Set and achieve daily application targets
- Receive automated email reminders and summaries
- Manage subscriptions and access premium features

---

## 🏗️ Architecture Overview

### **Technology Stack**
- **Frontend**: Next.js 15.3.3 (React 18.3.1)
- **Backend**: Next.js API Routes + Firebase Admin SDK
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth
- **AI/ML**: Google Genkit with OpenAI models
- **Email**: SendGrid
- **Payments**: Stripe
- **Deployment**: Vercel

### **Key Libraries**
- `firebase` & `firebase-admin` - Database and authentication
- `@genkit-ai/*` - AI flow management
- `@sendgrid/mail` - Email delivery
- `stripe` - Payment processing
- `pdfjs-dist` & `mammoth` - Document parsing
- `recharts` - Data visualization
- `date-fns` - Date manipulation

---

## 📁 Project Structure

```
src/
├── app/                          # Next.js app router
│   ├── (app)/                   # Protected app routes
│   │   ├── dashboard/           # Main dashboard
│   │   ├── applications/       # Job applications tracking
│   │   ├── resumes/            # Resume management
│   │   ├── cover-letters/      # Cover letter directory
│   │   ├── ats-checker/        # ATS analysis tool
│   │   ├── targets/             # Daily targets
│   │   ├── subscriptions/      # Subscription management
│   │   ├── settings/           # User settings
│   │   └── profile/            # User profile
│   ├── (auth)/                 # Public auth routes
│   ├── api/                    # API routes
│   │   ├── cron/               # Scheduled jobs
│   │   ├── notifications/      # Email endpoints
│   │   └── stripe/             # Payment webhooks
│   └── layout.tsx              # Root layout
├── components/                  # React components
│   ├── applications/           # Application UI
│   ├── resumes/                # Resume UI
│   ├── cover-letters/          # Cover letter UI
│   ├── ats-checker/            # ATS checker UI
│   ├── dashboard/               # Dashboard charts
│   ├── targets/                 # Target tracking UI
│   └── ui/                     # Reusable UI components
├── lib/                         # Core libraries
│   ├── services/               # Business logic
│   ├── subscription/           # Subscription management
│   ├── stripe/                 # Stripe integration
│   └── types.ts                # TypeScript types
├── hooks/                       # React hooks
├── ai/                          # AI flows (Genkit)
│   └── flows/                  # AI flow definitions
└── dataconnect-generated/      # Firebase Data Connect

```

---

## 🔑 Core Features

### 1. **Authentication System**
- Email/password authentication
- Google OAuth
- Protected routes
- Session management

### 2. **Resume Management**
- Upload PDF/DOC/DOCX files
- Automatic text extraction
- Manual text editing
- Multiple resume storage
- Link resumes to applications

### 3. **Job Application Tracking**
- Add/edit/delete applications
- Track application status
- Link resumes and cover letters
- Grid and list views
- Application analytics

### 4. **ATS Checker**
- Resume vs Job Description analysis
- ATS match score calculation
- Subscore breakdown
- AI-powered improvement suggestions
- Interactive chat assistant
- Cover letter generation

### 5. **Cover Letter Directory**
- Generate cover letters from ATS checker
- Save to directory
- Edit and manage cover letters
- Link to applications

### 6. **Daily Targets**
- Set daily application goals
- Calendar view with progress
- Color-coded progress indicators
- Historical tracking

### 7. **Email Notifications**
- Daily reminder emails
- Daily summary emails
- Customizable schedules
- HTML email templates
- SendGrid integration

### 8. **Subscription Management**
- FREE, PLUS, PRO, ADMIN plans
- Stripe payment integration
- Feature gating
- Subscription status tracking

### 9. **Dashboard Analytics**
- KPI cards (applications, interviews, offers, rejections)
- Applications over time chart
- Status breakdown chart
- Real-time data updates

### 10. **User Profile**
- Profile information management
- Links management (Portfolio, LinkedIn, GitHub)
- Notes and templates system
- Resume integration

---

## 🔐 Security & Permissions

### **Firestore Security Rules**
- Users can only access their own data
- Admin users have special access
- Collection-level security rules
- Query-level validation

### **Authentication**
- Firebase Auth for user management
- Protected API routes
- Server-side validation

---

## 📊 Data Models

### **Collections**
- `users` - User profiles
- `job_applications` - Job applications
- `resumes` - Resume documents
- `cover_letters` - Cover letter documents
- `targets` - Daily targets
- `schedules` - Email schedules
- `subscription_transactions` - Payment records
- `admin_users` - Admin user records

---

## 🚀 Deployment

### **Environment Variables Required**
- Firebase configuration
- SendGrid API key
- Stripe keys
- OpenAI API key (for AI features)
- Firebase Admin credentials

### **Deployment Steps**
1. Set environment variables in Vercel
2. Deploy Firestore rules: `firebase deploy --only firestore:rules`
3. Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
4. Deploy application: `vercel deploy`

---

## 📝 Key Files Reference

- `firestore.rules` - Security rules
- `firestore.indexes.json` - Database indexes
- `vercel.json` - Vercel configuration (cron jobs)
- `src/lib/types.ts` - TypeScript type definitions
- `src/lib/firebase-admin.ts` - Server-side Firebase
- `src/lib/firebase.ts` - Client-side Firebase

---

## 🎨 Design System

- **Primary Color**: #FF9900 (Orange)
- **Background**: #F5F1EC (Light beige)
- **Accent**: #E65C00 (Deep orange)
- **UI Library**: Radix UI + Tailwind CSS
- **Icons**: Lucide React

---

## ✅ Status: Production Ready

All core features are implemented and tested. The application is fully functional and ready for production use.

