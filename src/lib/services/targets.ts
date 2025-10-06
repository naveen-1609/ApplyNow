import { adminDb, Timestamp } from '@/lib/firebase-admin';

export interface Target {
  target_id: string;
  user_id: string;
  daily_target: number;
  current_date: Date;
  applications_done: number;
  status_color: 'Green' | 'Yellow' | 'Red';
}

export interface CreateTargetData {
  daily_target: number;
  current_date: Date;
  applications_done: number;
  status_color: 'Green' | 'Yellow' | 'Red';
}

const getTargetsCollection = () => {
    return adminDb.collection('targets');
}

// Function to convert Firestore document to Target type
const fromFirestore = (doc: any): Target => {
    const data = doc.data();
    return {
        target_id: doc.id,
        user_id: data.user_id,
        daily_target: data.daily_target,
        current_date: data.current_date.toDate(),
        applications_done: data.applications_done,
        status_color: data.status_color,
    };
};

// Get all targets for a user
export const getTargets = async (userId: string): Promise<Target[]> => {
    const targetsCol = getTargetsCollection();
    const snapshot = await targetsCol.where('user_id', '==', userId).get();
    return snapshot.docs.map(fromFirestore);
};

// Get today's target for a user
export const getTodayTarget = async (userId: string): Promise<Target | null> => {
    const targetsCol = getTargetsCollection();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const snapshot = await targetsCol
        .where('user_id', '==', userId)
        .where('current_date', '==', Timestamp.fromDate(today))
        .get();
    
    if (snapshot.empty) {
        return null;
    }
    
    return fromFirestore(snapshot.docs[0]);
};

// Add a new target
export const addTarget = async (userId: string, data: CreateTargetData): Promise<string> => {
    const targetsCol = getTargetsCollection();
    
    const docData = {
        ...data,
        user_id: userId,
        current_date: Timestamp.fromDate(data.current_date),
    };
    
    const docRef = await targetsCol.add(docData);
    return docRef.id;
};

// Update a target
export const updateTarget = async (userId: string, targetId: string, data: Partial<CreateTargetData>): Promise<void> => {
    const targetDocRef = adminDb.collection('targets').doc(targetId);
    
    const updateData: { [key: string]: any } = {
        ...data,
    };

    if (data.current_date) {
        updateData.current_date = Timestamp.fromDate(data.current_date);
    }

    await targetDocRef.update(updateData);
};

// Delete a target
export const deleteTarget = async (userId: string, targetId: string): Promise<void> => {
    const targetDocRef = adminDb.collection('targets').doc(targetId);
    await targetDocRef.delete();
};
