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
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import type { Resume } from '@/lib/types';
import { extractTextFromFile } from '@/lib/services/pdf-parser';

const getResumesCollection = () => {
    if (!db) throw new Error("Firestore is not initialized.");
    return collection(db, 'resumes');
}

const getStorageInstance = () => {
    if (!storage) throw new Error("Firebase Storage is not initialized.");
    return storage;
}

const fromFirestore = (doc: any): Resume => {
    const data = doc.data();
    let editableText = data.editable_text || '';
    
    // Clean up old error messages that might be stored in editable_text
    if (editableText && typeof editableText === 'string') {
        // Check for old error messages and clear them
        if (editableText.includes('text extraction is not yet implemented') ||
            editableText.includes('has been uploaded successfully, but text extraction')) {
            console.warn(`⚠️ Detected old error message in resume ${doc.id}, clearing editable_text`);
            editableText = '';
        }
    }
    
    return {
        resume_id: doc.id,
        ...data,
        editable_text: editableText, // Use cleaned text
        extraction_warning: data.extraction_warning || null,
        created_at: data.created_at?.toDate ? data.created_at.toDate() : new Date(),
    };
}

export const getResumes = async (userId: string): Promise<Resume[]> => {
    try {
        if (!db) return [];
        const resumesCol = getResumesCollection();
        const q = query(
            resumesCol, 
            where('user_id', '==', userId),
            orderBy('created_at', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(fromFirestore);
    } catch (error) {
        console.error('Error fetching resumes:', error);
        return [];
    }
};

export const addResume = async (userId: string, resumeName: string, file: File): Promise<string> => {
    const storage = getStorageInstance();
    const resumesCol = getResumesCollection();

    // 1. Upload file to Firebase Storage
    const filePath = `users/${userId}/resumes/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);
    const uploadResult = await uploadBytes(storageRef, file);
    const file_url = await getDownloadURL(uploadResult.ref);

    // 2. Extract text from file (PDF, DOC, DOCX)
    console.log('📄 Starting text extraction for file:', file.name, 'Type:', file.type, 'Size:', file.size);
    let editable_text = '';
    let extractionWarning = '';
    
    try {
        // Validate file before extraction
        if (!file || file.size === 0) {
            throw new Error('File is empty or invalid');
        }
        
        console.log('🔄 Calling extractTextFromFile...');
        editable_text = await extractTextFromFile(file);
        const trimmedText = editable_text.trim();
        
        console.log('✅ Text extraction completed. Length:', trimmedText.length);
        console.log('📝 First 200 characters:', trimmedText.substring(0, 200));
        
        // Validate extracted text
        if (trimmedText.length === 0) {
            extractionWarning = 'No text was extracted from this file. Please manually add the resume text.';
            console.warn('⚠️ No text extracted');
        } else if (trimmedText.length < 100) {
            extractionWarning = `Very little text was extracted (${trimmedText.length} characters). Please review and manually edit if needed.`;
            console.warn('⚠️ Very little text extracted:', trimmedText.length, 'characters');
        } else if (trimmedText.includes('[DOC/DOCX file:') || trimmedText.includes('Error extracting')) {
            extractionWarning = 'Text extraction encountered issues. Please review the extracted text or manually add it.';
            console.warn('⚠️ Error message detected in extracted text');
        } else {
            console.log('✅ Text extraction successful:', trimmedText.length, 'characters');
        }
        
        // If extraction failed or returned error message, set empty string
        // Also check for old error messages that might have been stored
        if (trimmedText.includes('[DOC/DOCX file:') || 
            trimmedText.includes('Error extracting') ||
            trimmedText.includes('text extraction is not yet implemented') ||
            trimmedText.includes('has been uploaded successfully, but text extraction')) {
            editable_text = '';
            console.warn('⚠️ Setting editable_text to empty due to error message detected');
        }
    } catch (error: any) {
        console.error('❌ Text extraction failed:', error);
        console.error('Error details:', {
            message: error?.message,
            stack: error?.stack,
            name: error?.name
        });
        editable_text = '';
        extractionWarning = error?.message || 'Text extraction failed. Please manually add the resume text after upload.';
    }

    // 3. Create document in Firestore
    const docData = {
        user_id: userId,
        resume_name: resumeName,
        file_url: file_url,
        storage_path: filePath, // Store path for deletion
        editable_text: editable_text,
        extraction_warning: extractionWarning || null, // Store warning if extraction had issues
        created_at: Timestamp.now(),
    };
    const docRef = await addDoc(resumesCol, docData);
    
    // Return the resume ID and warning message
    return docRef.id;
};

export const deleteResume = async (userId: string, resumeId: string): Promise<void> => {
    if (!db || !storage) throw new Error("Firebase is not initialized.");
    
    // Fix: Use the correct collection path (resumes collection, not users/{userId}/resumes)
    const resumeDocRef = doc(db, 'resumes', resumeId);
    
    try {
        const docSnapshot = await getDoc(resumeDocRef);
        
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            // Verify the resume belongs to the user
            if (data.user_id !== userId) {
                throw new Error("Unauthorized: Resume does not belong to this user");
            }
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
    // Fix: Use the correct collection path (resumes collection, not users/{userId}/resumes)
    const resumeDocRef = doc(db, 'resumes', resumeId);
    
    // Verify the resume belongs to the user before updating
    const docSnapshot = await getDoc(resumeDocRef);
    if (!docSnapshot.exists()) {
        throw new Error("Resume not found");
    }
    const data = docSnapshot.data();
    if (data.user_id !== userId) {
        throw new Error("Unauthorized: Resume does not belong to this user");
    }
    
    await updateDoc(resumeDocRef, {
        editable_text: newText,
    });
};
