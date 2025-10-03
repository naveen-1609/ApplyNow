import type { JobApplication, Resume, Target, Schedule, User } from './types';
import { subDays, format } from 'date-fns';

export const mockUser: User = {
  user_id: 'user-1',
  name: 'Alex Doe',
  email: 'alex.doe@example.com',
  created_at: new Date('2023-01-15T09:00:00Z'),
};

export const mockResumes: Resume[] = [
  {
    resume_id: 'resume-1',
    user_id: 'user-1',
    resume_name: 'Software_Engineer_v3.pdf',
    file_url: '/resumes/Software_Engineer_v3.pdf',
    editable_text: 'Experienced Full Stack Engineer with a passion for building scalable web applications. Proficient in React, Node.js, and TypeScript. Seeking a challenging role in a fast-paced environment.',
    created_at: new Date('2023-10-01T10:00:00Z'),
  },
  {
    resume_id: 'resume-2',
    user_id: 'user-1',
    resume_name: 'Product_Manager_Resume.docx',
    file_url: '/resumes/Product_Manager_Resume.docx',
    editable_text: 'Strategic Product Manager with a track record of launching successful products. Skilled in market analysis, user research, and agile methodologies. Ready to lead a product to market leadership.',
    created_at: new Date('2023-09-15T14:30:00Z'),
  },
];

export const mockJobApplications: JobApplication[] = [
  {
    job_id: 'job-1',
    user_id: 'user-1',
    company_name: 'Tech Innovators Inc.',
    job_title: 'Senior Frontend Engineer',
    job_link: 'https://example.com/job/1',
    job_description: 'Join our team to build the next generation of user interfaces.',
    resume_id: 'resume-1',
    status: 'Interviewing',
    applied_date: subDays(new Date(), 2),
    last_updated: subDays(new Date(), 1),
  },
  {
    job_id: 'job-2',
    user_id: 'user-1',
    company_name: 'Data Solutions LLC',
    job_title: 'Data Scientist',
    job_link: 'https://example.com/job/2',
    job_description: 'Analyze large datasets to extract meaningful insights.',
    resume_id: 'resume-1',
    status: 'Applied',
    applied_date: subDays(new Date(), 5),
    last_updated: subDays(new Date(), 5),
  },
  {
    job_id: 'job-3',
    user_id: 'user-1',
    company_name: 'Creative Minds Agency',
    job_title: 'UX Designer',
    job_link: 'https://example.com/job/3',
    job_description: 'Design intuitive and beautiful user experiences.',
    resume_id: 'resume-2',
    status: 'Rejected',
    applied_date: subDays(new Date(), 10),
    last_updated: subDays(new Date(), 7),
  },
  {
    job_id: 'job-4',
    user_id: 'user-1',
    company_name: 'Global Connect',
    job_title: 'Product Manager',
    job_link: 'https://example.com/job/4',
    job_description: 'Lead the product vision and roadmap for our flagship product.',
    resume_id: 'resume-2',
    status: 'Offer',
    applied_date: subDays(new Date(), 30),
    last_updated: subDays(new Date(), 15),
  },
    {
    job_id: 'job-5',
    user_id: 'user-1',
    company_name: 'Future Systems',
    job_title: 'Backend Developer',
    job_link: 'https://example.com/job/5',
    job_description: 'Develop and maintain server-side logic.',
    resume_id: 'resume-1',
    status: 'Ghosted',
    applied_date: subDays(new Date(), 45),
    last_updated: subDays(new Date(), 20),
  },
   {
    job_id: 'job-6',
    user_id: 'user-1',
    company_name: 'Stark Industries',
    job_title: 'Lead AI Engineer',
    job_link: 'https://example.com/job/6',
    job_description: 'Build cutting-edge AI systems.',
    resume_id: 'resume-1',
    status: 'Applied',
    applied_date: subDays(new Date(), 1),
    last_updated: subDays(new Date(), 1),
  },
   {
    job_id: 'job-7',
    user_id: 'user-1',
    company_name: 'Wayne Enterprises',
    job_title: 'DevOps Specialist',
    job_link: 'https://example.com/job/7',
    job_description: 'Automate and streamline our operations and processes.',
    resume_id: 'resume-1',
    status: 'Applied',
    applied_date: subDays(new Date(), 0),
    last_updated: subDays(new Date(), 0),
  },
];

export const mockTarget: Target = {
  target_id: 'target-1',
  user_id: 'user-1',
  daily_target: 3,
  history: [
    { date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), applications_done: 3 },
    { date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), applications_done: 2 },
    { date: format(new Date(), 'yyyy-MM-dd'), applications_done: 1 },
  ],
};

export const mockSchedule: Schedule = {
  schedule_id: 'schedule-1',
  user_id: 'user-1',
  reminder_time: '06:00',
  summary_time: '22:00',
  email_enabled: true,
};
