# Features Documentation

This document explains how each major feature works in Application Console.

---

## 📄 1. Resume Management System

### **Overview**
Allows users to upload, store, and manage multiple resume versions with automatic text extraction.

### **How It Works**

#### **Upload Process** (`src/lib/services/resumes.ts`)
1. User selects a file (PDF, DOC, or DOCX)
2. File is uploaded to Firebase Storage
3. Text is extracted using:
   - `pdfjs-dist` for PDF files
   - `mammoth` for DOC/DOCX files
4. Extracted text is validated and stored in Firestore
5. If extraction fails, user can manually add text

#### **Text Extraction** (`src/lib/services/pdf-parser.ts`)
- **PDF**: Uses PDF.js to extract text from each page
- **DOC/DOCX**: 
  - First attempts raw text extraction
  - Falls back to HTML conversion if needed
  - Validates minimum text length (50+ characters)

#### **Storage Structure**
```
Firestore: resumes/{resumeId}
{
  user_id: string
  resume_name: string
  file_url: string (Firebase Storage URL)
  storage_path: string
  editable_text: string
  extraction_warning?: string
  created_at: Timestamp
}
```

#### **Key Components**
- `src/components/resumes/upload-resume-dialog.tsx` - Upload UI
- `src/components/resumes/resume-card.tsx` - Resume display card
- `src/app/(app)/resumes/page.tsx` - Resume directory page

---

## 💼 2. Job Application Tracking

### **Overview**
Track job applications with status, dates, and linked resumes/cover letters.

### **How It Works**

#### **Application Data Model** (`src/lib/types.ts`)
```typescript
{
  job_id: string
  user_id: string
  company_name: string
  job_title: string
  job_link: string
  job_description: string
  resume_id: string | null
  cover_letter_id: string | null
  status: 'Applied' | 'Interviewing' | 'Offer' | 'Rejected' | 'Ghosted'
  applied_date: Date
  last_updated: Date
}
```

#### **Features**
- **Add/Edit Applications**: Sheet-based form for quick entry
- **Status Tracking**: 5 status options with color coding
- **Resume Linking**: Link applications to specific resumes
- **Cover Letter Linking**: Link applications to cover letters
- **Views**: Grid view (cards) and List view (table)
- **Filtering**: By status, date, company

#### **Key Components**
- `src/components/applications/add-application-sheet.tsx` - Add/edit form
- `src/components/applications/application-grid-view.tsx` - Card view
- `src/components/applications/optimized-application-list-view.tsx` - Table view

---

## 🤖 3. ATS Checker & AI Assistant

### **Overview**
AI-powered tool to analyze resume match with job descriptions and provide improvement suggestions.

### **How It Works**

#### **Analysis Flow** (`src/ai/flows/ats-checker-flow.ts`)
1. User provides job description and selects resume
2. AI analyzes:
   - Skills & Tools match
   - Responsibilities alignment
   - Domain/Industry fit
   - Education/Certifications
   - Experience level
   - Soft skills
   - Formatting for ATS
3. Returns comprehensive score and suggestions

#### **Score Calculation**
- **Overall ATS Match Score**: Weighted average of subscores
- **Subscores**: Individual scores for each category (0-100)
- **Fit Analysis**: Found, Partial, Missing items
- **Improvement Suggestions**: Actionable recommendations

#### **Chat Assistant**
- Context-aware responses
- Access to ATS analysis results
- Can answer questions about improving resume
- Provides specific examples

#### **Cover Letter Generation**
- Uses job description as primary source
- Matches resume experience to job requirements
- Customizable tone and length
- Generates key points and customization tips

#### **Key Components**
- `src/components/ats-checker/ats-checker-tool.tsx` - Main UI
- `src/ai/flows/ats-checker-flow.ts` - AI flow definitions

---

## 📧 4. Cover Letter Directory

### **Overview**
Store and manage generated cover letters for reuse in applications.

### **How It Works**

#### **Storage Structure**
```
Firestore: cover_letters/{coverLetterId}
{
  user_id: string
  cover_letter_name: string
  cover_letter_text: string
  company_name?: string
  job_title?: string
  created_at: Timestamp
}
```

#### **Features**
- **Save from ATS Checker**: One-click save after generation
- **Edit**: Update text and metadata
- **Delete**: Remove unused cover letters
- **Link to Applications**: Select when adding applications

#### **Key Components**
- `src/components/cover-letters/cover-letter-card.tsx` - Display card
- `src/components/cover-letters/add-cover-letter-dialog.tsx` - Save dialog
- `src/app/(app)/cover-letters/page.tsx` - Directory page

---

## 📊 5. Dashboard & Analytics

### **Overview**
Visual dashboard showing job search progress and statistics.

### **How It Works**

#### **KPI Cards**
- **Total Applications**: Count of all applications
- **Interviews**: Applications with "Interviewing" status
- **Offers**: Applications with "Offer" status
- **Rejections**: Applications with "Rejected" status

#### **Charts**
- **Applications Over Time**: Line chart showing application trends
- **Status Breakdown**: Pie chart showing status distribution

#### **Data Source**
- Uses `useGlobalData` hook for optimized data fetching
- Real-time updates when applications change
- Cached for performance

#### **Key Components**
- `src/components/dashboard/kpi-card.tsx` - KPI display
- `src/components/dashboard/applications-over-time-chart.tsx` - Line chart
- `src/components/dashboard/status-breakdown-chart.tsx` - Pie chart

---

## 🎯 6. Daily Targets System

### **Overview**
Set daily application goals and track progress with visual calendar.

### **How It Works**

#### **Target Storage**
```
Firestore: targets/{targetId}
{
  user_id: string
  daily_target: number
  current_date: Timestamp
  applications_done: number
  status_color: 'Green' | 'Yellow' | 'Red'
  created_at: Timestamp
  updated_at: Timestamp
}
```

#### **Calendar View**
- **Green**: Target met or exceeded
- **Yellow**: Partially met (50-99%)
- **Red**: Not met (<50% or 0 applications)
- **Gray**: Future dates or today

#### **Progress Calculation**
- Counts applications with `applied_date` matching today
- Compares against `daily_target`
- Updates in real-time

#### **Key Components**
- `src/components/targets/target-calendar.tsx` - Calendar display
- `src/components/targets/set-target-card.tsx` - Target setting UI

---

## 📧 7. Email Notification System

### **Overview**
Automated email reminders and summaries sent at user-configured times.

### **How It Works**

#### **Scheduling** (`vercel.json`)
- Vercel Cron Job runs every minute
- Checks each user's individual schedule times
- Sends emails when time matches

#### **Schedule Storage**
```
Firestore: schedules/{scheduleId}
{
  user_id: string
  reminder_time: "HH:mm" (e.g., "09:00")
  summary_time: "HH:mm" (e.g., "21:00")
  email_enabled: boolean
  reminder_email_template?: string
  summary_email_template?: string
  created_at: Timestamp
  updated_at: Timestamp
}
```

#### **Email Types**

**Reminder Email** (Morning):
- Daily target reminder
- Progress so far today
- Motivational message
- Call-to-action to apply

**Summary Email** (Evening):
- Applications submitted today
- Progress percentage
- Tomorrow's target reminder
- Achievement celebration

#### **Email Templates** (`src/lib/services/email.ts`)
- HTML-based with gradients and styling
- Responsive design
- Progress bars and stat cards
- Customizable templates

#### **Key Files**
- `src/app/api/cron/notifications/route.ts` - Cron job endpoint
- `src/lib/services/email.ts` - Email sending logic
- `src/lib/services/schedules-server.ts` - Schedule management

---

## 💳 8. Subscription Management

### **Overview**
Multi-tier subscription system with Stripe payment integration.

### **How It Works**

#### **Subscription Plans**
- **FREE**: Basic features, 100 applications limit
- **PLUS**: $5/month, 1,000 applications, all AI features
- **PRO**: $50 one-time, unlimited, lifetime access
- **ADMIN**: Free, full access (for admin email)

#### **Payment Flow**
1. User selects plan
2. Stripe checkout session created
3. User completes payment
4. Webhook updates subscription status
5. Features unlocked based on plan

#### **Feature Gating** (`src/components/subscription/feature-gate.tsx`)
- Checks user's subscription plan
- Shows upgrade prompts for restricted features
- Handles plan limits

#### **Key Components**
- `src/lib/stripe/stripe-service.ts` - Stripe integration
- `src/app/api/stripe/webhook/route.ts` - Payment webhooks
- `src/app/(app)/subscriptions/page.tsx` - Subscription page

---

## 👤 9. User Profile & Settings

### **Overview**
Manage user profile, links, notes, and application settings.

### **How It Works**

#### **Profile Management**
- Inline editing with auto-save
- Avatar upload
- Contact information
- Social links (Portfolio, LinkedIn, GitHub)

#### **Notes & Templates**
- Rich text editor (Markdown)
- Tag system
- Pinned notes
- Template gallery
- Version history
- Sharing capabilities

#### **Settings**
- Email notification preferences
- Schedule configuration
- Timezone settings

#### **Key Components**
- `src/components/profile/ProfileCard.tsx` - Profile editor
- `src/components/profile/NotesSidebar.tsx` - Notes list
- `src/components/settings/notifications-form.tsx` - Settings form

---

## 🔐 10. Authentication & Authorization

### **Overview**
Firebase Auth with Google OAuth and email/password.

### **How It Works**

#### **Authentication Methods**
- Email/Password signup and login
- Google OAuth
- Session persistence
- Protected routes

#### **Authorization**
- User-specific data access
- Admin user detection (by email)
- Subscription-based feature access

#### **Key Files**
- `src/hooks/use-optimized-auth.tsx` - Auth hook
- `src/app/(auth)/login/page.tsx` - Login page
- `src/app/(app)/layout.tsx` - Protected route wrapper

---

## 🎨 11. UI Components & Design System

### **Overview**
Consistent UI built with Radix UI and Tailwind CSS.

### **Component Library**
- Cards, Buttons, Dialogs, Sheets
- Forms, Inputs, Selects, Textareas
- Charts, Progress bars, Badges
- Tables, Lists, Virtual scrolling
- Loading states, Skeletons

### **Design Principles**
- Mobile-first responsive design
- Accessibility (ARIA labels)
- Dark mode support
- Consistent spacing and typography

---

## 📈 12. Performance Optimizations

### **Overview**
Multiple optimization strategies for fast, scalable performance.

### **Optimizations**
- **Data Caching**: 2-minute TTL cache for Firestore queries
- **Optimistic Updates**: Instant UI updates before server confirmation
- **Virtual Scrolling**: For large lists (100+ items)
- **Code Splitting**: Lazy loading of components
- **Query Batching**: Combined Firestore queries
- **Indexed Queries**: Composite indexes for fast queries

### **Key Files**
- `src/lib/services/optimized-data.ts` - Caching service
- `src/hooks/use-optimized-*.tsx` - Optimized hooks
- `src/components/ui/virtual-list.tsx` - Virtual scrolling

---

## 🔧 13. Error Handling & Logging

### **Overview**
Comprehensive error handling and logging throughout the application.

### **Error Handling**
- Try-catch blocks in all async operations
- User-friendly error messages
- Toast notifications for feedback
- Console logging for debugging
- Graceful degradation

### **Logging Levels**
- ✅ Success operations
- ⚠️ Warnings
- ❌ Errors
- 🔍 Debug information

---

## 🚀 14. Deployment & Infrastructure

### **Overview**
Vercel-based deployment with Firebase backend.

### **Deployment Components**
- **Vercel**: Frontend hosting and API routes
- **Firebase**: Database, storage, auth
- **Cron Jobs**: Vercel cron for scheduled tasks
- **Environment Variables**: Secure configuration

### **Required Setup**
1. Firebase project configuration
2. Vercel project setup
3. Environment variables
4. Firestore rules deployment
5. Firestore indexes creation
6. SendGrid domain verification
7. Stripe webhook configuration

---

## ✅ Feature Status Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | ✅ Complete | Email/password + Google OAuth |
| Resume Management | ✅ Complete | PDF/DOC/DOCX support |
| Application Tracking | ✅ Complete | Grid + List views |
| ATS Checker | ✅ Complete | AI-powered analysis |
| Cover Letters | ✅ Complete | Generation + Directory |
| Dashboard | ✅ Complete | KPIs + Charts |
| Daily Targets | ✅ Complete | Calendar view |
| Email Notifications | ✅ Complete | Reminder + Summary |
| Subscriptions | ✅ Complete | Stripe integration |
| Profile & Settings | ✅ Complete | Full profile management |

---

## 📚 Additional Documentation

- `APPLICATION_OVERVIEW.md` - High-level architecture
- `ARCHITECTURE_DETAILED.md` - Technical deep dive
- `SETUP_GUIDE.md` - Setup instructions
- `API_DOCUMENTATION.md` - API endpoints
- `DEPLOYMENT_GUIDE.md` - Deployment steps

