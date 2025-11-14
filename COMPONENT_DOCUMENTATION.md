# Component Documentation

## 🧩 UI Components

### **Layout Components**

#### **AppSidebar** (`src/components/layout/app-sidebar.tsx`)
Main navigation sidebar for the application.

**Features**:
- Collapsible sidebar
- Active route highlighting
- Admin dashboard link (for admin users)
- User profile display
- Sign out functionality

**Navigation Items**:
- Dashboard
- Applications
- Resumes
- Cover Letters
- ATS Checker
- Targets
- Subscriptions
- Profile
- Settings
- Admin Dashboard (admin only)

---

### **Application Components**

#### **AddApplicationSheet** (`src/components/applications/add-application-sheet.tsx`)
Sheet-based form for adding/editing job applications.

**Fields**:
- Job Title (required)
- Company (required)
- Job Link (optional)
- Description (optional)
- Resume Used (dropdown)
- Cover Letter Used (dropdown)
- Status (dropdown)
- Applied Date (date picker)

**Features**:
- Pre-fills data when editing
- Validates required fields
- Optimistic updates
- Toast notifications

---

#### **ApplicationGridView** (`src/components/applications/application-grid-view.tsx`)
Card-based grid view of applications.

**Features**:
- Grouped by date
- Color-coded status badges
- Click to edit
- External link to job posting
- Responsive grid (2-3 columns)

---

#### **OptimizedApplicationListView** (`src/components/applications/optimized-application-list-view.tsx`)
Table-based list view with virtualization.

**Features**:
- Virtual scrolling for 100+ items
- Sortable columns
- Status badges
- Resume and cover letter display
- Actions dropdown (edit/delete)

---

### **Resume Components**

#### **ResumeCard** (`src/components/resumes/resume-card.tsx`)
Card displaying resume information.

**Features**:
- Resume name and metadata
- File download link
- Edit text button
- Delete button
- Extraction warning display
- Character count

**Actions**:
- Edit text (opens dialog)
- Delete (with confirmation)
- Download file

---

#### **UploadResumeDialog** (`src/components/resumes/upload-resume-dialog.tsx`)
Dialog for uploading new resumes.

**Fields**:
- Resume Name (required)
- File (PDF/DOC/DOCX)

**Features**:
- File type validation
- Extraction status display
- Progress indicators
- Error handling

---

### **Cover Letter Components**

#### **CoverLetterCard** (`src/components/cover-letters/cover-letter-card.tsx`)
Card displaying cover letter information.

**Features**:
- Cover letter name
- Company and job title (if available)
- Character count
- Created date
- Edit and delete actions

---

#### **AddCoverLetterDialog** (`src/components/cover-letters/add-cover-letter-dialog.tsx`)
Dialog for saving cover letter to directory.

**Fields**:
- Name (required)
- Company Name (optional)
- Job Title (optional)

**Features**:
- Pre-fills from ATS checker
- Validates required fields
- Auto-closes on success

---

### **ATS Checker Components**

#### **AtsCheckerTool** (`src/components/ats-checker/ats-checker-tool.tsx`)
Main ATS checker interface.

**Sections**:
1. **Setup Panel** (left):
   - Job description textarea
   - Resume selector
   - Analyze button
   - Cover letter generator settings

2. **Results Panel** (right):
   - ATS score display
   - Subscore breakdown
   - Fit analysis
   - Improvement suggestions
   - Chat assistant

**Features**:
- Real-time validation
- Resume text validation
- Cover letter generation
- Save to directory
- Copy/download cover letter

---

### **Dashboard Components**

#### **KpiCard** (`src/components/dashboard/kpi-card.tsx`)
Displays a single KPI metric.

**Props**:
- `title`: Card title
- `value`: Numeric value
- `description`: Help text
- `Icon`: Lucide icon component

**Features**:
- Icon display
- Large number display
- Description text
- Responsive design

---

#### **ApplicationsOverTimeChart** (`src/components/dashboard/applications-over-time-chart.tsx`)
Line chart showing application trends over time.

**Features**:
- Time series data
- Responsive chart
- Tooltip on hover
- Date range display

---

#### **StatusBreakdownChart** (`src/components/dashboard/status-breakdown-chart.tsx`)
Pie chart showing status distribution.

**Features**:
- Color-coded segments
- Percentage labels
- Legend
- Interactive tooltips

---

### **Target Components**

#### **TargetCalendar** (`src/components/targets/target-calendar.tsx`)
Calendar view showing daily target progress.

**Features**:
- Month view
- Color-coded days:
  - Green: Target met
  - Yellow: Partially met
  - Red: Not met
  - Gray: Future/today
- Click to view details
- Navigation (prev/next month)

---

#### **SetTargetCard** (`src/components/targets/set-target-card.tsx`)
Card for setting daily target.

**Features**:
- Number input
- Save button
- Current target display
- Validation

---

### **Subscription Components**

#### **SubscriptionStatus** (`src/components/subscription/subscription-status.tsx`)
Displays current subscription plan.

**Features**:
- Plan name badge
- Status indicator
- Upgrade button (if on free plan)

---

#### **FeatureGate** (`src/components/subscription/feature-gate.tsx`)
Restricts features based on subscription.

**Props**:
- `requiredPlan`: Minimum plan required
- `children`: Content to show/hide
- `fallback`: Upgrade prompt

**Usage**:
```tsx
<FeatureGate requiredPlan={SubscriptionPlan.PLUS}>
  <PremiumFeature />
</FeatureGate>
```

---

### **Settings Components**

#### **NotificationsForm** (`src/components/settings/notifications-form.tsx`)
Form for configuring email notifications.

**Fields**:
- Email enabled toggle
- Reminder time (time picker)
- Summary time (time picker)
- Custom email templates

**Features**:
- Time format normalization
- Real-time validation
- Auto-save
- Success feedback

---

### **Profile Components**

#### **ProfileCard** (`src/components/profile/ProfileCard.tsx`)
Editable profile information card.

**Fields**:
- Name
- Headline
- Email
- Phone
- Location
- Avatar

**Features**:
- Inline editing
- Auto-save (700ms debounce)
- Image upload
- Validation

---

#### **LinksPanel** (`src/components/profile/LinksPanel.tsx`)
Manages user's social and portfolio links.

**Features**:
- Preset links (Portfolio, LinkedIn, GitHub)
- Custom links
- Copy to clipboard
- External link opening

---

#### **NotesSidebar** (`src/components/profile/NotesSidebar.tsx`)
Sidebar for managing notes and templates.

**Features**:
- Note list
- Search and filter
- Tag filtering
- Pinned notes
- Create new note

---

#### **NoteEditor** (`src/components/profile/NoteEditor.tsx`)
Rich text editor for notes.

**Features**:
- Markdown support
- Formatting toolbar
- Auto-save
- Word/character count
- Version history

---

### **UI Primitives** (`src/components/ui/`)

#### **Button**
Styled button component with variants.

**Variants**: `default`, `outline`, `ghost`, `destructive`

#### **Card**
Container component for content sections.

**Sub-components**: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

#### **Dialog**
Modal dialog component.

**Usage**: For confirmations, forms, and information display.

#### **Sheet**
Slide-out panel component.

**Usage**: For forms and side panels.

#### **Toast**
Notification system.

**Types**: `default`, `destructive`, `success`

#### **Table**
Data table component.

**Sub-components**: `TableHeader`, `TableBody`, `TableRow`, `TableCell`, `TableHead`

#### **Select**
Dropdown select component.

**Features**: Searchable, keyboard navigation

#### **Input/Textarea**
Form input components.

**Features**: Validation, error states

---

## 🎨 Styling System

### **Tailwind CSS**
- Utility-first CSS framework
- Custom color palette
- Responsive breakpoints
- Dark mode support

### **Color Palette**
- **Primary**: Orange (#FF9900)
- **Background**: Light beige (#F5F1EC)
- **Accent**: Deep orange (#E65C00)
- **Status Colors**:
  - Success: Green
  - Warning: Yellow
  - Error: Red
  - Info: Blue

### **Typography**
- **Headings**: Custom font stack
- **Body**: System font stack
- **Code**: Monospace font

---

## 🔄 State Management

### **React Hooks Pattern**
- Custom hooks for data fetching
- Optimistic updates
- Cache management
- Error handling

### **Key Hooks**
- `useOptimizedAuth` - Authentication
- `useOptimizedApplications` - Applications
- `useOptimizedResumes` - Resumes
- `useCoverLetters` - Cover letters
- `useGlobalData` - Dashboard data
- `useSubscription` - Subscription status

---

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Adaptive Features**
- Sidebar collapses on mobile
- Grid → List view on small screens
- Touch-friendly buttons
- Responsive charts
- Mobile-optimized forms

---

## ♿ Accessibility

### **ARIA Labels**
- All interactive elements labeled
- Form fields properly associated
- Error messages linked to inputs

### **Keyboard Navigation**
- Tab order logical
- Keyboard shortcuts (Ctrl+S, etc.)
- Focus management

### **Screen Reader Support**
- Semantic HTML
- ARIA roles and properties
- Alt text for images

---

All components follow consistent patterns and are fully documented with TypeScript types.

