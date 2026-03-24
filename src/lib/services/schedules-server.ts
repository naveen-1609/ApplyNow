'use server';

import { adminDb, Timestamp } from '@/lib/firebase-admin';
import { normalizeTimeFormat } from '@/lib/utils/time-format';

export interface Schedule {
  schedule_id: string;
  user_id: string;
  reminder_time: string;
  summary_time: string;
  email_enabled: boolean;
  reminder_email_template?: string;
  summary_email_template?: string;
}

// Get schedule for a user (server-side)
export const getSchedule = async (userId: string): Promise<Schedule | null> => {
  try {
    const schedulesCol = adminDb.collection('schedules');
    const snapshot = await schedulesCol.where('user_id', '==', userId).get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      schedule_id: doc.id,
      user_id: data.user_id,
      reminder_time: data.reminder_time,
      summary_time: data.summary_time,
      email_enabled: data.email_enabled,
      reminder_email_template: data.reminder_email_template,
      summary_email_template: data.summary_email_template,
    };
  } catch (error) {
    console.error('Error fetching schedule (server):', error);
    return null;
  }
};

// Add a new schedule (server-side)
export const addSchedule = async (userId: string, data: { reminder_time: string; summary_time: string; email_enabled: boolean; reminder_email_template?: string; summary_email_template?: string }): Promise<string> => {
  try {
    const schedulesCol = adminDb.collection('schedules');
    
    const docData = {
      user_id: userId,
      reminder_time: normalizeTimeFormat(data.reminder_time),
      summary_time: normalizeTimeFormat(data.summary_time),
      email_enabled: data.email_enabled,
      reminder_email_template: data.reminder_email_template,
      summary_email_template: data.summary_email_template,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };
    
    const docRef = await schedulesCol.add(docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating schedule (server):', error);
    throw error;
  }
};

// Update a schedule (server-side)
export const updateSchedule = async (userId: string, scheduleId: string, data: Partial<{ reminder_time: string; summary_time: string; email_enabled: boolean; reminder_email_template?: string; summary_email_template?: string }>): Promise<void> => {
  try {
    const scheduleRef = adminDb.collection('schedules').doc(scheduleId);
    const updateData: any = {};
    
    // Normalize time format (ensure HH:mm format)
    if (data.reminder_time !== undefined) {
      const normalizedReminder = normalizeTimeFormat(data.reminder_time);
      updateData.reminder_time = normalizedReminder;
      console.log(`🕐 Updating reminder_time: ${data.reminder_time} → ${normalizedReminder}`);
    }
    if (data.summary_time !== undefined) {
      const normalizedSummary = normalizeTimeFormat(data.summary_time);
      updateData.summary_time = normalizedSummary;
      console.log(`🕐 Updating summary_time: ${data.summary_time} → ${normalizedSummary}`);
    }
    if (data.email_enabled !== undefined) updateData.email_enabled = data.email_enabled;
    if (data.reminder_email_template !== undefined) updateData.reminder_email_template = data.reminder_email_template;
    if (data.summary_email_template !== undefined) updateData.summary_email_template = data.summary_email_template;
    
    // Add updated_at timestamp
    updateData.updated_at = Timestamp.now();
    
    console.log(`💾 Updating schedule ${scheduleId} with data:`, updateData);
    await scheduleRef.update(updateData);
    console.log(`✅ Schedule ${scheduleId} updated successfully`);
  } catch (error) {
    console.error('Error updating schedule (server):', error);
    throw error;
  }
};
