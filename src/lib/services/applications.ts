
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  where,
  orderBy,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { JobApplication, CreateJobApplicationData, UpdateJobApplicationData } from '@/lib/types';

const getApplicationsCollection = () => {
    if (!db) {
        throw new Error("Firestore is not initialized. Please check your Firebase configuration.");
    }
    return collection(db, 'job_applications');
}

// Function to convert Firestore document to JobApplication type
const fromFirestore = (doc: QueryDocumentSnapshot<DocumentData>): JobApplication => {
    const data = doc.data();
    return {
        job_id: doc.id,
        user_id: data.user_id,
        company_name: data.company_name,
        job_title: data.job_title,
        job_link: data.job_link,
        job_description: data.job_description,
        resume_id: data.resume_id,
        status: data.status,
        applied_date: data.applied_date.toDate(),
        last_updated: data.last_updated.toDate(),
    };
};

// Get all applications for a user with optimized query
export const getApplications = async (userId: string): Promise<JobApplication[]> => {
    try {
        const applicationsCol = getApplicationsCollection();
        const q = query(
            applicationsCol, 
            where('user_id', '==', userId),
            orderBy('last_updated', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(fromFirestore);
    } catch (error) {
        console.error('Error fetching applications:', error);
        return [];
    }
};

// Add a new job application
export const addApplication = async (userId: string, data: CreateJobApplicationData): Promise<string> => {
    const applicationsCol = getApplicationsCollection();
    const now = Timestamp.now();
    
    const docData = {
        ...data,
        user_id: userId,
        applied_date: Timestamp.fromDate(data.applied_date),
        last_updated: now,
    };
    
    const docRef = await addDoc(applicationsCol, docData);
    return docRef.id;
};

// Update a job application
export const updateApplication = async (userId: string, jobId: string, data: UpdateJobApplicationData): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");
    
    const appDocRef = doc(db, 'job_applications', jobId);
    
    const updateData: { [key: string]: any } = {
        ...data,
        last_updated: Timestamp.now(),
    };

    if (data.applied_date) {
        updateData.applied_date = Timestamp.fromDate(data.applied_date);
    }

    await updateDoc(appDocRef, updateData);
};

// Delete a job application
export const deleteApplication = async (userId: string, jobId: string): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");
    
    const appDocRef = doc(db, 'job_applications', jobId);
    await deleteDoc(appDocRef);
};
