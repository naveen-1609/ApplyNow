'use server';

import { adminDb, Timestamp } from '@/lib/firebase-admin';

export interface Target {
  target_id: string;
  user_id: string;
  daily_target: number;
  current_date: Date;
  applications_done: number;
  status_color: 'Green' | 'Yellow' | 'Red';
}

// Get today's target for a user (server-side)
export const getTodayTarget = async (userId: string): Promise<Target | null> => {
  try {
    const targetsCol = adminDb.collection('targets');
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    const snapshot = await targetsCol
      .where('user_id', '==', userId)
      .where('current_date', '==', Timestamp.fromDate(todayDate))
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      target_id: doc.id,
      user_id: data.user_id,
      daily_target: data.daily_target,
      current_date: data.current_date.toDate(),
      applications_done: data.applications_done,
      status_color: data.status_color,
    };
  } catch (error) {
    console.error('Error fetching today target (server):', error);
    return null;
  }
};

// Add a new target (server-side)
export const addTarget = async (userId: string, data: { daily_target: number; current_date?: Date; applications_done?: number; status_color?: string }): Promise<string> => {
  try {
    const targetsCol = adminDb.collection('targets');
    
    const docData = {
      user_id: userId,
      daily_target: data.daily_target,
      current_date: data.current_date ? Timestamp.fromDate(new Date(data.current_date)) : Timestamp.fromDate(new Date()),
      applications_done: data.applications_done || 0,
      status_color: data.status_color || 'Green',
    };
    
    const docRef = await targetsCol.add(docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating target (server):', error);
    throw error;
  }
};

// Update a target (server-side)
export const updateTarget = async (userId: string, targetId: string, data: Partial<{ daily_target: number; current_date: Date; applications_done: number; status_color: string }>): Promise<void> => {
  try {
    const targetRef = adminDb.collection('targets').doc(targetId);
    const updateData: any = {};
    
    if (data.daily_target !== undefined) updateData.daily_target = data.daily_target;
    if (data.current_date !== undefined) updateData.current_date = Timestamp.fromDate(new Date(data.current_date));
    if (data.applications_done !== undefined) updateData.applications_done = data.applications_done;
    if (data.status_color !== undefined) updateData.status_color = data.status_color;
    
    await targetRef.update(updateData);
  } catch (error) {
    console.error('Error updating target (server):', error);
    throw error;
  }
};

