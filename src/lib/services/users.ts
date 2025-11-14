'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';
import { getSchedule } from './schedules-server';
import { getTodayTarget } from './targets-server';


const getUserDoc = (userId: string) => {
    return adminDb.collection('users').doc(userId);
}

const fromFirestore = (doc: any): Partial<User> => {
    const data = doc.data();
    if (!data) return {};

    return {
        user_id: doc.id,
        name: data.name,
        email: data.email,
        created_at: data.created_at.toDate(),
    };
}

// Get user settings, including schedule and target
export const getUserSettings = async (userId: string): Promise<{ schedule?: any, target?: any }> => {
    const userDocRef = getUserDoc(userId);
    const docSnap = await userDocRef.get();
    
    // Get schedule and target from separate collections
    const schedule = await getSchedule(userId);
    const target = await getTodayTarget(userId);
    
    return { 
        schedule: schedule || undefined,
        target: target || { daily_target: 3 }
    };
};

// Update or create user settings
export const updateUserSettings = async (userId: string, settings: { schedule?: any, target?: any }): Promise<void> => {
    const userDocRef = getUserDoc(userId);
    
    // Update user document with basic info only
    const userData: any = {};
    if (settings.schedule) {
        // Update schedule in schedules collection
        const { updateSchedule, addSchedule } = await import('./schedules-server');
        const existingSchedule = await getSchedule(userId);
        
        console.log('📝 Updating schedule from Settings UI:', {
            userId,
            existingScheduleId: existingSchedule?.schedule_id,
            scheduleData: settings.schedule,
            reminder_time: settings.schedule.reminder_time,
            summary_time: settings.schedule.summary_time,
            email_enabled: settings.schedule.email_enabled,
        });
        
        if (existingSchedule) {
            await updateSchedule(userId, existingSchedule.schedule_id, settings.schedule);
            console.log('✅ Schedule updated successfully');
        } else {
            const scheduleId = await addSchedule(userId, settings.schedule);
            console.log('✅ Schedule created successfully:', scheduleId);
        }
    }
    if (settings.target) {
        // Update target in targets collection
        const { updateTarget, addTarget } = await import('./targets-server');
        const existingTarget = await getTodayTarget(userId);
        if (existingTarget) {
            await updateTarget(userId, existingTarget.target_id, settings.target);
        } else {
            // When creating a new target, make sure to set current_date to today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            await addTarget(userId, {
                ...settings.target,
                current_date: today
            });
        }
    }
    
    // Use set with merge: true to create or update the document
    await userDocRef.set(userData, { merge: true });
};
