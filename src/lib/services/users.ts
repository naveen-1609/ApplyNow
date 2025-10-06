'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';
import { getSchedule } from './schedules';
import { getTodayTarget } from './targets';


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
        const { getSchedule, updateSchedule, addSchedule } = await import('./schedules');
        const existingSchedule = await getSchedule(userId);
        if (existingSchedule) {
            await updateSchedule(userId, existingSchedule.schedule_id, settings.schedule);
        } else {
            await addSchedule(userId, settings.schedule);
        }
    }
    if (settings.target) {
        // Update target in targets collection
        const { getTodayTarget, updateTarget, addTarget } = await import('./targets');
        const existingTarget = await getTodayTarget(userId);
        if (existingTarget) {
            await updateTarget(userId, existingTarget.target_id, settings.target);
        } else {
            await addTarget(userId, settings.target);
        }
    }
    
    // Use set with merge: true to create or update the document
    await userDocRef.set(userData, { merge: true });
};
