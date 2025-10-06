import type { Timestamp } from 'firebase/firestore';

export type JobApplicationStatus = 'Applied' | 'Interviewing' | 'Offer' | 'Rejected' | 'Ghosted';

export const ALL_STATUSES: JobApplicationStatus[] = ['Applied', 'Interviewing', 'Offer', 'Rejected', 'Ghosted'];

export type User = {
  user_id: string;
  name: string | null;
  email: string | null;
  created_at: Date;
};

export type Resume = {
  resume_id: string;
  user_id: string;
  resume_name: string;
  file_url: string;
  storage_path: string;
  editable_text: string;
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
  status: JobApplicationStatus;
  applied_date: Date;
  last_updated: Date;
};

export type Target = {
  daily_target: number;
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
