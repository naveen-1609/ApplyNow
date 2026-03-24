import type { Timestamp } from 'firebase/firestore';

export type JobApplicationStatus = 'Applied' | 'Interviewing' | 'Offer' | 'Rejected' | 'Ghosted';
export type PermissionLevel = 'ai_features' | 'records_only';

export const ALL_STATUSES: JobApplicationStatus[] = ['Applied', 'Interviewing', 'Offer', 'Rejected', 'Ghosted'];

export type User = {
  user_id: string;
  name: string | null;
  email: string | null;
  permissions?: PermissionLevel;
  access_enabled?: boolean;
  isAdmin?: boolean;
  created_at: Date;
};

export type Resume = {
  resume_id: string;
  user_id: string;
  resume_name: string;
  file_url: string;
  storage_path: string;
  editable_text: string;
  extraction_warning?: string | null; // Warning message if text extraction had issues
  created_at: Date;
};

export type CoverLetter = {
  cover_letter_id: string;
  user_id: string;
  cover_letter_name: string;
  cover_letter_text: string;
  is_template?: boolean;
  template_variables?: string[];
  source_file_name?: string | null;
  company_name?: string | null;
  job_title?: string | null;
  created_at: Date;
};

export type JobApplication = {
  job_id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  job_link: string;
  job_description: string;
  resume_id: string | null; // Make resume_id optional
  cover_letter_id: string | null; // Cover letter used for this application
  status: JobApplicationStatus;
  applied_date: Date;
  last_updated: Date;
};

export type Target = {
  target_id?: string;
  user_id?: string;
  daily_target: number;
  current_date?: Date;
  applications_done?: number;
  status_color?: string;
};

export type Schedule = {
  schedule_id: string;
  user_id: string;
  reminder_time: string; // "HH:mm"
  summary_time: string; // "HH:mm"
  email_enabled: boolean;
  reminder_email_template?: string;
  summary_email_template?: string;
};

// Firestore document types
export type JobApplicationDocument = Omit<JobApplication, 'job_id' | 'applied_date' | 'last_updated'> & {
    applied_date: Timestamp;
    last_updated: Timestamp;
};

export type CreateJobApplicationData = Omit<JobApplication, 'job_id' | 'user_id' | 'last_updated'>;
export type UpdateJobApplicationData = Partial<Omit<JobApplication, 'job_id' | 'user_id' | 'last_updated' | 'applied_date'> & { applied_date?: Date }>;

export type GeneratedCoverLetterDraft = {
  template_id: string;
  template_name: string;
  generated_text: string;
  company_name?: string | null;
  job_title?: string | null;
};

export type ApplicationSavePayload = (CreateJobApplicationData | UpdateJobApplicationData) & {
  generated_cover_letter?: GeneratedCoverLetterDraft | null;
};
