'use server';

import { adminDb, Timestamp } from '@/lib/firebase-admin';

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
      reminder_time: data.reminder_time,
      summary_time: data.summary_time,
      email_enabled: data.email_enabled,
      reminder_email_template: data.reminder_email_template,
      summary_email_template: data.summary_email_template,
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

// Helper function to normalize time format to HH:mm
function normalizeTimeFormat(time: string): string {
  if (!time) {
    console.warn('⚠️ Empty time value provided');
    return time;
  }
  
  console.log(`🕐 Normalizing time format: "${time}"`);
  
  // HTML time input returns "HH:mm" format, but might also return "H:mm" (single digit hour)
  // If already in HH:mm format, return as is
  if (/^\d{2}:\d{2}$/.test(time)) {
    console.log(`✅ Time already in HH:mm format: ${time}`);
    return time;
  }
  
  // Handle "H:mm" format (single digit hour) - HTML time input sometimes returns this
  if (/^\d{1}:\d{2}$/.test(time)) {
    const normalized = `0${time}`;
    console.log(`✅ Normalized single-digit hour: ${time} → ${normalized}`);
    return normalized;
  }
  
  // Try to parse various formats
  // Handle "8:51 PM" or "8:51PM" format
  const pmMatch = time.match(/(\d{1,2}):(\d{2})\s*PM/i);
  const amMatch = time.match(/(\d{1,2}):(\d{2})\s*AM/i);
  
  if (pmMatch) {
    let hour = parseInt(pmMatch[1]);
    const minute = pmMatch[2];
    if (hour !== 12) hour += 12; // Convert PM to 24-hour (except 12 PM = 12:00)
    const normalized = `${hour.toString().padStart(2, '0')}:${minute}`;
    console.log(`✅ Converted PM time: ${time} → ${normalized}`);
    return normalized;
  }
  
  if (amMatch) {
    let hour = parseInt(amMatch[1]);
    const minute = amMatch[2];
    if (hour === 12) hour = 0; // 12 AM = 00:00
    const normalized = `${hour.toString().padStart(2, '0')}:${minute}`;
    console.log(`✅ Converted AM time: ${time} → ${normalized}`);
    return normalized;
  }
  
  // If no match, try to extract HH:mm from the string
  const timeMatch = time.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1]).toString().padStart(2, '0');
    const minute = timeMatch[2];
    const normalized = `${hour}:${minute}`;
    console.log(`✅ Extracted time: ${time} → ${normalized}`);
    return normalized;
  }
  
  // Return as is if we can't parse it
  console.warn(`⚠️ Could not normalize time format: ${time}, returning as-is`);
  return time;
}

