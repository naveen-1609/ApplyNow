# Detailed Architecture Documentation

## 🏗️ System Architecture

### **High-Level Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Next.js    │  │   React      │  │   Firebase   │ │
│  │   Frontend   │  │   Components │  │   Client SDK │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Vercel Edge Network                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  API Routes  │  │  Cron Jobs   │  │  Static      │ │
│  │  (Next.js)   │  │  (Vercel)    │  │  Assets      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Firebase    │  │   SendGrid   │  │    Stripe    │
│   Services    │  │   (Email)    │  │  (Payments)  │
│              │  │              │  │              │
│ - Firestore  │  │ - SMTP API   │  │ - Checkout   │
│ - Storage    │  │ - Templates  │  │ - Webhooks   │
│ - Auth       │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
        │
        │
        ▼
┌──────────────┐
│   OpenAI     │
│   (via       │
│   Genkit)    │
│              │
│ - GPT Models │
│ - AI Flows   │
└──────────────┘
```

---

## 📦 Data Flow Architecture

### **1. Authentication Flow**

```
User → Login Page → Firebase Auth → Auth State → Protected Routes
                                      │
                                      ▼
                              User Profile Created/Updated
```

**Key Files:**
- `src/hooks/use-optimized-auth.tsx` - Auth state management
- `src/lib/subscription/subscription-service.ts` - Profile creation

### **2. Resume Upload Flow**

```
User Upload → File Validation → Firebase Storage Upload
                                    │
                                    ▼
                            Text Extraction (PDF.js/Mammoth)
                                    │
                                    ▼
                            Firestore Document Creation
                                    │
                                    ▼
                            UI Update (Optimistic)
```

**Key Files:**
- `src/lib/services/resumes.ts` - Upload logic
- `src/lib/services/pdf-parser.ts` - Text extraction

### **3. Application Creation Flow**

```
User Input → Form Validation → Optimistic UI Update
                                    │
                                    ▼
                            Firestore Document Creation
                                    │
                                    ▼
                            Cache Invalidation
                                    │
                                    ▼
                            UI Refresh
```

**Key Files:**
- `src/lib/services/applications.ts` - CRUD operations
- `src/hooks/use-optimized-applications.tsx` - State management

### **4. ATS Analysis Flow**

```
Job Description + Resume → Genkit AI Flow
                                │
                                ▼
                        OpenAI GPT Analysis
                                │
                                ▼
                        Score Calculation
                                │
                                ▼
                        Results Display
```

**Key Files:**
- `src/ai/flows/ats-checker-flow.ts` - AI flow definition
- `src/components/ats-checker/ats-checker-tool.tsx` - UI

### **5. Email Notification Flow**

```
Vercel Cron (Every Minute) → Check User Schedules
                                    │
                                    ▼
                            Match Current Time
                                    │
                                    ▼
                            Fetch User Data
                                    │
                                    ▼
                            Generate Email HTML
                                    │
                                    ▼
                            Send via SendGrid
```

**Key Files:**
- `src/app/api/cron/notifications/route.ts` - Cron endpoint
- `src/lib/services/email.ts` - Email generation

---

## 🗄️ Database Schema

### **Firestore Collections**

#### **users/{userId}**
```typescript
{
  email: string
  name: string
  subscriptionPlan: 'FREE' | 'PLUS' | 'PRO' | 'ADMIN'
  subscriptionStatus: 'active' | 'inactive' | 'cancelled'
  isAdmin: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### **job_applications/{applicationId}**
```typescript
{
  user_id: string
  company_name: string
  job_title: string
  job_link: string
  job_description: string
  resume_id: string | null
  cover_letter_id: string | null
  status: 'Applied' | 'Interviewing' | 'Offer' | 'Rejected' | 'Ghosted'
  applied_date: Timestamp
  last_updated: Timestamp
}
```

#### **resumes/{resumeId}**
```typescript
{
  user_id: string
  resume_name: string
  file_url: string
  storage_path: string
  editable_text: string
  extraction_warning?: string | null
  created_at: Timestamp
}
```

#### **cover_letters/{coverLetterId}**
```typescript
{
  user_id: string
  cover_letter_name: string
  cover_letter_text: string
  company_name?: string | null
  job_title?: string | null
  created_at: Timestamp
}
```

#### **targets/{targetId}**
```typescript
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

#### **schedules/{scheduleId}**
```typescript
{
  user_id: string
  reminder_time: string  // "HH:mm" format
  summary_time: string   // "HH:mm" format
  email_enabled: boolean
  reminder_email_template?: string
  summary_email_template?: string
  created_at: Timestamp
  updated_at: Timestamp
}
```

---

## 🔄 State Management

### **React Hooks Pattern**

#### **Optimized Data Hooks**
- `useOptimizedApplications` - Application data with caching
- `useOptimizedResumes` - Resume data with caching
- `useCoverLetters` - Cover letter data
- `useGlobalData` - Combined dashboard data

#### **Auth Hooks**
- `useOptimizedAuth` - Authentication state
- `useSubscription` - Subscription status

#### **State Updates**
- **Optimistic Updates**: UI updates immediately, reverts on error
- **Cache Invalidation**: Clears cache on mutations
- **Real-time Sync**: Refetch after mutations

---

## 🎯 AI Integration (Genkit)

### **AI Flows**

#### **ATS Checker Flow** (`ats-checker-flow.ts`)
- **Input**: Job description + Resume text
- **Process**: GPT-4 analysis with structured prompts
- **Output**: ATS scores, suggestions, fit analysis

#### **Chat Assistant Flow** (`ats-checker-flow.ts`)
- **Input**: Chat history + ATS analysis + User message
- **Process**: Context-aware GPT responses
- **Output**: Helpful suggestions and answers

#### **Cover Letter Flow** (`ats-checker-flow.ts`)
- **Input**: Job description + Resume + Preferences
- **Process**: GPT-4 generation with job description focus
- **Output**: Personalized cover letter + Key points

### **Genkit Configuration**
- Uses OpenAI models via `@genkit-ai/compat-oai`
- Flows defined with Zod schemas
- Server-side execution only

---

## 📧 Email System Architecture

### **Components**

#### **Scheduling**
- **Vercel Cron**: Runs every minute (`* * * * *`)
- **Time Matching**: Compares UTC time to user schedules
- **Per-User Times**: Each user has individual reminder/summary times

#### **Email Generation**
- **HTML Templates**: Rich, responsive HTML emails
- **Dynamic Content**: Progress bars, stats, motivational messages
- **Template Variables**: Replaceable placeholders

#### **Delivery**
- **SendGrid API**: SMTP delivery
- **Error Handling**: Retry logic and logging
- **Delivery Tracking**: Status logging

---

## 💳 Payment System (Stripe)

### **Flow**

```
User Selects Plan → Create Checkout Session → Stripe Checkout
                                                      │
                                                      ▼
                                            User Completes Payment
                                                      │
                                                      ▼
                                            Stripe Webhook Triggered
                                                      │
                                                      ▼
                                            Update User Subscription
                                                      │
                                                      ▼
                                            Unlock Features
```

### **Webhook Events**
- `checkout.session.completed` - Payment successful
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription cancelled

---

## 🔐 Security Architecture

### **Firestore Security Rules**

#### **Pattern**
```javascript
match /collection/{documentId} {
  allow read: if request.auth != null && 
              request.auth.uid == resource.data.user_id;
  allow write: if request.auth != null && 
               request.auth.uid == resource.data.user_id;
  allow create: if request.auth != null && 
                request.auth.uid == request.resource.data.user_id;
}
```

#### **Query Security**
- All queries filtered by `user_id`
- Rules validate ownership on each document
- Admin users have special access

### **API Route Security**
- Authentication required for protected routes
- Server-side validation
- Rate limiting (Vercel default)

---

## ⚡ Performance Architecture

### **Caching Strategy**

#### **Client-Side Caching**
- **TTL**: 2 minutes
- **Cache Keys**: `{collection}_{userId}`
- **Invalidation**: On mutations

#### **Query Optimization**
- **Composite Indexes**: For `where` + `orderBy` queries
- **Query Limits**: Max 50-100 documents per query
- **Pagination**: For large datasets

#### **Virtual Scrolling**
- **Threshold**: 100+ items
- **Item Height**: 60px (configurable)
- **Overscan**: 5 items

---

## 🧪 Testing & Validation

### **Error Handling**
- Try-catch in all async operations
- User-friendly error messages
- Console logging for debugging
- Graceful degradation

### **Validation**
- Form validation (client-side)
- Type checking (TypeScript)
- Schema validation (Zod)
- Firestore rules (server-side)

---

## 📊 Monitoring & Logging

### **Logging Levels**
- ✅ **Success**: Green checkmarks
- ⚠️ **Warning**: Yellow warnings
- ❌ **Error**: Red errors
- 🔍 **Debug**: Blue info

### **Key Metrics**
- Application count
- Resume count
- Email delivery status
- Payment success rate
- AI analysis usage

---

## 🚀 Deployment Architecture

### **Vercel Deployment**
- **Build**: Next.js production build
- **Edge Functions**: API routes
- **Cron Jobs**: Scheduled tasks
- **Environment Variables**: Secure config

### **Firebase Deployment**
- **Firestore Rules**: Security rules
- **Indexes**: Query performance
- **Storage**: File uploads
- **Auth**: User management

---

## 🔄 Data Synchronization

### **Real-Time Updates**
- Optimistic UI updates
- Cache invalidation
- Background refetch
- Error recovery

### **Consistency**
- Firestore transactions (where needed)
- Atomic updates
- Conflict resolution

---

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Adaptive Components**
- Sidebar collapses on mobile
- Grid → List view on small screens
- Touch-friendly buttons
- Responsive charts

---

This architecture supports scalability, maintainability, and performance at scale.

