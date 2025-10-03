export type JobApplicationStatus = 'Applied' | 'Interviewing' | 'Offer' | 'Rejected' | 'Ghosted';

export const ALL_STATUSES: JobApplicationStatus[] = ['Applied', 'Interviewing', 'Offer', 'Rejected', 'Ghosted'];

export type User = {
  user_id: string;
  name: string;
  email: string;
  created_at: Date;
};

export type Resume = {
  resume_id: string;
  user_id: string;
  resume_name: string;
  file_url: string;
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
  resume_id: string;
  status: JobApplicationStatus;
  applied_date: Date;
  last_updated: Date;
};

export type Target = {
  target_id: string;
  user_id: string;
  daily_target: number;
  history: {
    date: string; // YYYY-MM-DD
    applications_done: number;
  }[];
};

export type Schedule = {
  schedule_id: string;
  user_id: string;
  reminder_time: string; // "HH:mm"
  summary_time: string; // "HH:mm"
  email_enabled: boolean;
};
