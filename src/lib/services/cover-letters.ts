import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
  query,
  where,
  orderBy,
  getDoc,
} from 'firebase/firestore';
import type { CoverLetter } from '@/lib/types';
import { detectTemplateVariables, mergeTemplateVariables } from '@/lib/utils/cover-letter-template';
import { logger } from '@/lib/utils/logger';

const getCoverLettersCollection = () => {
    if (!db) throw new Error("Firestore is not initialized.");
    return collection(db, 'cover_letters');
}

const fromFirestore = (doc: any): CoverLetter => {
    const data = doc.data();
    return {
        cover_letter_id: doc.id,
        ...data,
        cover_letter_text: data.cover_letter_text || '',
        is_template: data.is_template === true,
        template_variables: Array.isArray(data.template_variables) ? data.template_variables : [],
        source_file_name: data.source_file_name || null,
        company_name: data.company_name || null,
        job_title: data.job_title || null,
        created_at: data.created_at?.toDate ? data.created_at.toDate() : new Date(),
    };
}

export const getCoverLetters = async (userId: string): Promise<CoverLetter[]> => {
    try {
        if (!db) return [];
        const coverLettersCol = getCoverLettersCollection();
        
        // Try query with orderBy first (requires index)
        // If it fails, fall back to query without orderBy and sort in memory
        try {
            const q = query(
                coverLettersCol, 
                where('user_id', '==', userId),
                orderBy('created_at', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(fromFirestore);
        } catch (indexError: any) {
            // If index error, try without orderBy and sort in memory
            if (indexError?.code === 'failed-precondition' || indexError?.message?.includes('index')) {
                logger.warn('Cover letter index not ready, fetching without orderBy and sorting in memory');
                const q = query(
                    coverLettersCol, 
                    where('user_id', '==', userId)
                );
                const snapshot = await getDocs(q);
                const coverLetters = snapshot.docs.map(fromFirestore);
                // Sort in memory by created_at descending
                return coverLetters.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
            }
            throw indexError;
        }
    } catch (error) {
        logger.error('Error fetching cover letters', error);
        return [];
    }
};

export const addCoverLetter = async (
    userId: string, 
    coverLetterName: string, 
    coverLetterText: string,
    companyName?: string,
    jobTitle?: string,
    options?: {
        sourceFileName?: string;
        additionalTemplateVariables?: string[];
    }
): Promise<string> => {
    if (!db) throw new Error("Firestore is not initialized.");
    
    const coverLettersCol = getCoverLettersCollection();

    const templateVariables = mergeTemplateVariables(
        detectTemplateVariables(coverLetterText),
        options?.additionalTemplateVariables || []
    );
    const docData = {
        user_id: userId,
        cover_letter_name: coverLetterName,
        cover_letter_text: coverLetterText,
        is_template: templateVariables.length > 0,
        template_variables: templateVariables,
        source_file_name: options?.sourceFileName || null,
        company_name: companyName || null,
        job_title: jobTitle || null,
        created_at: Timestamp.now(),
    };
    
    logger.info('Adding cover letter', {
        user_id: userId,
        cover_letter_name: coverLetterName,
        has_text: !!coverLetterText && coverLetterText.length > 0,
        text_length: coverLetterText?.length || 0,
        is_template: templateVariables.length > 0,
        template_variables: templateVariables,
    });
    
    try {
        const docRef = await addDoc(coverLettersCol, docData);
        logger.info('Cover letter added successfully', { cover_letter_id: docRef.id });
        return docRef.id;
    } catch (error: any) {
        logger.error('Error adding cover letter', {
            error,
            code: error?.code,
            message: error?.message,
        });
        throw error;
    }
};

export const deleteCoverLetter = async (userId: string, coverLetterId: string): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");
    
    const coverLetterDocRef = doc(db, 'cover_letters', coverLetterId);
    
    // Verify the cover letter belongs to the user before deleting
    const docSnapshot = await getDoc(coverLetterDocRef);
    if (!docSnapshot.exists()) {
        throw new Error("Cover letter not found");
    }
    const data = docSnapshot.data();
    if (data.user_id !== userId) {
        throw new Error("Unauthorized: Cover letter does not belong to this user");
    }

    await deleteDoc(coverLetterDocRef);
};

export const updateCoverLetter = async (
    userId: string, 
    coverLetterId: string, 
    newText: string,
    coverLetterName?: string,
    options?: {
        additionalTemplateVariables?: string[];
    }
): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");
    const coverLetterDocRef = doc(db, 'cover_letters', coverLetterId);
    
    // Verify the cover letter belongs to the user before updating
    const docSnapshot = await getDoc(coverLetterDocRef);
    if (!docSnapshot.exists()) {
        throw new Error("Cover letter not found");
    }
    const data = docSnapshot.data();
    if (data.user_id !== userId) {
        throw new Error("Unauthorized: Cover letter does not belong to this user");
    }
    
    const templateVariables = mergeTemplateVariables(
        detectTemplateVariables(newText),
        options?.additionalTemplateVariables || []
    );
    const updateData: any = {
        cover_letter_text: newText,
        is_template: templateVariables.length > 0,
        template_variables: templateVariables,
    };
    
    if (coverLetterName) {
        updateData.cover_letter_name = coverLetterName;
    }
    
    await updateDoc(coverLetterDocRef, updateData);
};
