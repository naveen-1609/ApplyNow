'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, Timestamp, type DocumentData, type DocumentSnapshot } from 'firebase/firestore';
import type { Schedule, Target } from '@/lib/types';


const getUserDoc = (userId: string) => {
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }
    return doc(db, `users/${userId}`);
}

const fromFirestore = (doc: DocumentSnapshot<DocumentData>): Partial<User & { schedule?: Schedule; target?: Target }> => {
    const data = doc.data();
    if (!data) return {};

    const settings: Partial<User & { schedule?: Schedule; target?: Target }> = {};

    if (data.schedule) {
        settings.schedule = data.schedule;
    }
    if (data.target) {
        settings.target = data.target;
    }

    return settings;
}

// Get user settings, including schedule and target
export const getUserSettings = async (userId: string): Promise<{ schedule?: Schedule, target?: Target }> => {
    const userDocRef = getUserDoc(userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        return fromFirestore(docSnap);
    }
    // Return default values if no settings found
    return { 
        schedule: undefined,
        target: { daily_target: 3 }
    };
};

// Update or create user settings
export const updateUserSettings = async (userId: string, settings: { schedule?: Schedule, target?: Target }): Promise<void> => {
    const userDocRef = getUserDoc(userId);
    
    // Use setDoc with merge: true to create or update the document
    await setDoc(userDocRef, settings, { merge: true });
};
