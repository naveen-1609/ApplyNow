import { adminDb } from '@/lib/firebase-admin';

export interface Schedule {
  schedule_id: string;
  user_id: string;
  reminder_time: string;
  summary_time: string;
  email_enabled: boolean;
  reminder_email_template?: string;
  summary_email_template?: string;
}

export interface CreateScheduleData {
  reminder_time: string;
  summary_time: string;
  email_enabled: boolean;
  reminder_email_template?: string;
  summary_email_template?: string;
}

const getSchedulesCollection = () => {
    return adminDb.collection('schedules');
}

// Function to convert Firestore document to Schedule type
const fromFirestore = (doc: any): Schedule => {
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
};

// Get schedule for a user
export const getSchedule = async (userId: string): Promise<Schedule | null> => {
    const schedulesCol = getSchedulesCollection();
    const snapshot = await schedulesCol.where('user_id', '==', userId).get();
    
    if (snapshot.empty) {
        return null;
    }
    
    return fromFirestore(snapshot.docs[0]);
};

// Add a new schedule
export const addSchedule = async (userId: string, data: CreateScheduleData): Promise<string> => {
    const schedulesCol = getSchedulesCollection();
    
    const docData = {
        ...data,
        user_id: userId,
    };
    
    const docRef = await schedulesCol.add(docData);
    return docRef.id;
};

// Update a schedule
export const updateSchedule = async (userId: string, scheduleId: string, data: Partial<CreateScheduleData>): Promise<void> => {
    const scheduleDocRef = adminDb.collection('schedules').doc(scheduleId);
    await scheduleDocRef.update(data);
};

// Delete a schedule
export const deleteSchedule = async (userId: string, scheduleId: string): Promise<void> => {
    const scheduleDocRef = adminDb.collection('schedules').doc(scheduleId);
    await scheduleDocRef.delete();
};
