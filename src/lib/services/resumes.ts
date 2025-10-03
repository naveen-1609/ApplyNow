import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import type { Resume } from '@/lib/types';
import { pdfToText } from '@/lib/services/pdf-parser';

const getResumesCollection = (userId: string) => {
    if (!db) throw new Error("Firestore is not initialized.");
    return collection(db, `users/${userId}/resumes`);
}

const getStorageInstance = () => {
    if (!storage) throw new Error("Firebase Storage is not initialized.");
    return storage;
}

const fromFirestore = (doc: any): Resume => {
    const data = doc.data();
    return {
        resume_id: doc.id,
        ...data,
        created_at: data.created_at.toDate(),
    };
}

export const getResumes = async (userId: string): Promise<Resume[]> => {
    if (!db) return [];
    const resumesCol = getResumesCollection(userId);
    const snapshot = await getDocs(resumesCol);
    return snapshot.docs.map(fromFirestore);
};

export const addResume = async (userId: string, resumeName: string, file: File): Promise<string> => {
    const storage = getStorageInstance();
    const resumesCol = getResumesCollection(userId);

    // 1. Upload file to Firebase Storage
    const filePath = `users/${userId}/resumes/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);
    const uploadResult = await uploadBytes(storageRef, file);
    const file_url = await getDownloadURL(uploadResult.ref);

    // 2. Extract text from PDF
    const editable_text = await pdfToText(file);

    // 3. Create document in Firestore
    const docData = {
        user_id: userId,
        resume_name: resumeName,
        file_url: file_url,
        storage_path: filePath, // Store path for deletion
        editable_text: editable_text,
        created_at: Timestamp.now(),
    };
    const docRef = await addDoc(resumesCol, docData);
    return docRef.id;
};

export const deleteResume = async (userId: string, resumeId: string): Promise<void> => {
    if (!db || !storage) throw new Error("Firebase is not initialized.");
    
    const resumeDocRef = doc(db, `users/${userId}/resumes`, resumeId);
    
    try {
        const docSnapshot = await getDoc(resumeDocRef);
        
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            if (data.storage_path) {
                const fileRef = ref(storage, data.storage_path);
                await deleteObject(fileRef);
            }
        }
    } catch(error) {
        console.error("Error deleting file from storage:", error);
        // We can choose to continue and delete the firestore doc anyway
    }

    await deleteDoc(resumeDocRef);
};

export const updateResumeText = async (userId: string, resumeId: string, newText: string): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");
    const resumeDocRef = doc(db, `users/${userId}/resumes`, resumeId);
    await updateDoc(resumeDocRef, {
        editable_text: newText,
    });
};
