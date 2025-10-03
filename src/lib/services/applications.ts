
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import type { JobApplication, JobApplicationDocument, CreateJobApplicationData, UpdateJobApplicationData } from '@/lib/types';

const getApplicationsCollection = (userId: string) => {
    return collection(db!, `users/${userId}/applications`);
}

// Function to convert Firestore document to JobApplication type
const fromFirestore = (doc: any): JobApplication => {
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

// Get all applications for a user
export const getApplications = async (userId: string): Promise<JobApplication[]> => {
    if (!db) {
        console.error("Firestore is not initialized.");
        return [];
    }
    const applicationsCol = getApplicationsCollection(userId);
    const snapshot = await getDocs(applicationsCol);
    return snapshot.docs.map(doc => fromFirestore(doc));
};

// Add a new job application
export const addApplication = async (userId: string, data: CreateJobApplicationData): Promise<string> => {
    if (!db) throw new Error("Firestore is not initialized.");
    
    const applicationsCol = getApplicationsCollection(userId);
    const now = Timestamp.now();
    
    const docData: JobApplicationDocument = {
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
    
    const appDocRef = doc(db, `users/${userId}/applications`, jobId);
    
    const updateData: Partial<JobApplicationDocument> = {
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
    
    const appDocRef = doc(db, `users/${userId}/applications`, jobId);
    await deleteDoc(appDocRef);
};
