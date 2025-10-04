'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, Timestamp, type DocumentData, type DocumentSnapshot } from 'firebase/firestore';
import type { Schedule, User } from '@/lib/types';


const getUserDoc = (userId: string) => {
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }
    return doc(db, `users/${userId}`);
}

const fromFirestore = (doc: DocumentSnapshot<DocumentData>): Partial<User> & { schedule?: Schedule } => {
    const data = doc.data();
    if (!data) return {};
    return {
        schedule: data.schedule,
    };
}

// Get user settings, including schedule
export const getUserSettings = async (userId: string): Promise<{ schedule?: Schedule }> => {
    const userDocRef = getUserDoc(userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        return fromFirestore(docSnap);
    }
    return { schedule: undefined };
};

// Update or create user schedule settings
export const updateUserSettings = async (userId: string, settings: { schedule: Schedule }): Promise<void> => {
    const userDocRef = getUserDoc(userId);
    
    // Use setDoc with merge: true to create or update the document
    await setDoc(userDocRef, settings, { merge: true });
};
