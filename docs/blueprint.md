# **App Name**: CareerPilot

## Core Features:

- Resume Upload and Management: Allows users to upload resumes in PDF/DOCX formats, storing them in Firebase Storage with metadata in Firestore.  Includes an inline editable text field for quick edits and the ability to link resumes to job applications.
- Job Application Tracking: Enables users to add job entries with details like job title, company, link, description, resume used, application date and status (Applied, Interviewing, Offer, Rejected, Ghosted).  Offers block and tabular views for organizing and filtering applications.
- Profile Metrics Dashboard: Presents key performance indicators (KPIs) like total applications, interviews, rejections and offers, grouped by resume. Includes an average JD ↔ Resume match score (dummy field) and charts for visualizing application trends and success rates. Can use the resume editable text field to extract meaningful details about the job applications with an AI powered tool and then make predictions on which applications have the highest chances to succeed.
- Daily Job Application Target: Allows users to set and edit a daily job application target. Includes a calendar view with color grading to indicate progress (green=met, yellow=partially met, red=not met), displaying current progress and historical performance.
- Scheduled Email Notifications: Allows configuration of daily reminder emails (6AM) with target progress, and daily summary emails (10PM) with application results. Includes options to enable/disable or change notification times, leveraging Firebase Cloud Functions and Cloud Scheduler with SendGrid API or Mailgun.

## Style Guidelines:

- Primary color: HSL 48, 100%, 50% (Hex: #FF9900), a vibrant orange that conveys enthusiasm and motivation, central to a job-seeking theme.
- Background color: HSL 48, 20%, 95% (Hex: #F5F1EC), a light, desaturated near-white, for comfortable readability and visual spaciousness.
- Accent color: HSL 18, 70%, 50% (Hex: #E65C00), a deep analogous orange, for emphasis and call-to-action elements.
- Headline font: 'Playfair', a modern serif with an elegant, high-end feel; use 'PT Sans', a humanist sans-serif, for body text
- Code font: 'Source Code Pro' for displaying code snippets.
- Use a consistent set of icons for resume types, job application statuses, and notification settings. Icons should be simple and easily recognizable.
- Maintain a clean and intuitive layout across all pages, prioritizing key information and minimizing visual clutter. Use clear visual hierarchy to guide the user's attention.
- Incorporate subtle animations for transitions between pages and to highlight user interactions, such as a progress bar for uploads or a slide-in effect for new job applications.