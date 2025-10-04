import type { Schedule, User } from './types';
import { subDays, format } from 'date-fns';

export const mockUser: User = {
  user_id: 'user-1',
  name: 'Alex Doe',
  email: 'alex.doe@example.com',
  created_at: new Date('2023-01-15T09:00:00Z'),
};

// This file now contains only data that is truly static or used for fallback.
// User-specific data like resumes and applications are managed in Firestore.

// This is no longer used by the notifications form, but kept for reference
export const mockSchedule: Schedule = {
  schedule_id: 'schedule-1',
  user_id: 'user-1',
  reminder_time: '06:00',
  summary_time: '22:00',
  email_enabled: true,
};
