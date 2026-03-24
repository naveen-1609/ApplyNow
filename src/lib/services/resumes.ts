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

const MAX_RESUME_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_RESUME_EXTENSIONS = ['pdf', 'doc', 'docx'] as const;

const getFileExtension = (fileName: string) => {
    const parts = fileName.toLowerCase().split('.');
    return parts.length > 1 ? parts.pop() ?? '' : '';
};

const sanitizeFileName = (fileName: string) =>
    fileName
        .trim()
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/-+/g, '-');

export const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(sizeInBytes / 1024))} KB`;
    }
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const validateResumeFile = (file: File | null) => {
    if (!file) {
        return 'Choose a resume file to continue.';
    }

    if (file.size === 0) {
        return 'This file is empty. Please select a valid PDF, DOC, or DOCX file.';
    }

    const extension = getFileExtension(file.name);
    if (!ALLOWED_RESUME_EXTENSIONS.includes(extension as typeof ALLOWED_RESUME_EXTENSIONS[number])) {
        return 'Unsupported file type. Please upload a PDF, DOC, or DOCX resume.';
    }

    if (file.size > MAX_RESUME_FILE_SIZE_BYTES) {
        return `File is too large (${formatFileSize(file.size)}). Please keep resume uploads under ${formatFileSize(MAX_RESUME_FILE_SIZE_BYTES)}.`;
    }

    return null;
};

const getResumesCollection = () => {
    if (!db) throw new Error("Firestore is not initialized.");
    return collection(db, 'resumes');
}

const getStorageInstance = () => {
    if (!storage) throw new Error("Firebase Storage is not initialized.");
    return storage;
}

const toStorageErrorMessage = (error: any) => {
    const errorCode = error?.code || '';
    const serverMessage =
        error?.customData?.serverResponse ||
        error?.serverResponse ||
        error?.message ||
        '';

    if (errorCode === 'storage/unauthorized') {
        return 'Upload blocked by Firebase Storage rules. Make sure the signed-in user is allowed to write to this bucket.';
    }

    if (errorCode === 'storage/unauthenticated') {
        return 'Upload requires a signed-in user. Please sign in again and retry.';
    }

    if (errorCode === 'storage/object-not-found' || serverMessage.includes('Not Found')) {
        return 'Firebase Storage bucket was not found. Confirm Storage is enabled for this Firebase project and the bucket name is correct.';
    }

    if (serverMessage.includes('billing') || serverMessage.includes('Blaze')) {
        return 'Firebase Storage is not fully enabled for this project. New default buckets require the Blaze plan before uploads will work.';
    }

    if (serverMessage.includes('firebasestorage.googleapis.com') || serverMessage.includes('bucket')) {
        return `Firebase Storage upload failed: ${serverMessage}`;
    }

    return error?.message || 'Could not upload to Firebase Storage.';
};

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
    const validationError = validateResumeFile(file);

    if (validationError) {
        throw new Error(validationError);
    }

    const trimmedResumeName = resumeName.trim();
    if (!trimmedResumeName) {
        throw new Error('Resume name is required.');
    }

    // 1. Upload file to Firebase Storage
    const safeFileName = sanitizeFileName(file.name) || 'resume';
    const filePath = `users/${userId}/resumes/${Date.now()}-${safeFileName}`;
    const storageRef = ref(storage, filePath);
    let file_url = '';

    try {
        const uploadResult = await uploadBytes(storageRef, file);
        file_url = await getDownloadURL(uploadResult.ref);
    } catch (error: any) {
        throw new Error(toStorageErrorMessage(error));
    }

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
        resume_name: trimmedResumeName,
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
