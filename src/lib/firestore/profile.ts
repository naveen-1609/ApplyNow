import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';

export interface UserProfile {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  photoUrl: string;
  portfolioUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  customLinks: Array<{ label: string; url: string }>;
  updatedAt: number;
}

export interface CreateProfileData {
  name: string;
  headline: string;
  email: string;
  phone?: string;
  location?: string;
  photoUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  customLinks?: Array<{ label: string; url: string }>;
}

export interface UpdateProfileData {
  name?: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  photoUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  customLinks?: Array<{ label: string; url: string }>;
}

// Get user profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    const profileDoc = doc(db, 'users', uid);
    const profileSnap = await getDoc(profileDoc);
    
    if (profileSnap.exists()) {
      const data = profileSnap.data();
      return {
        name: data.name || '',
        headline: data.headline || '',
        email: data.email || '',
        phone: data.phone || '',
        location: data.location || '',
        photoUrl: data.photoUrl || '',
        portfolioUrl: data.portfolioUrl || '',
        linkedinUrl: data.linkedinUrl || '',
        githubUrl: data.githubUrl || '',
        customLinks: data.customLinks || [],
        updatedAt: data.updatedAt || Date.now(),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Create user profile
export const createUserProfile = async (uid: string, data: CreateProfileData): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    const profileDoc = doc(db, 'users', uid);
    const profileData = {
      ...data,
      customLinks: data.customLinks || [],
      updatedAt: Timestamp.now(),
    };
    
    await setDoc(profileDoc, profileData);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (uid: string, data: UpdateProfileData): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    const profileDoc = doc(db, 'users', uid);
    const updateData = {
      ...data,
      updatedAt: Timestamp.now(),
    };
    
    await updateDoc(profileDoc, updateData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Add custom link
export const addCustomLink = async (uid: string, link: { label: string; url: string }): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    const profileDoc = doc(db, 'users', uid);
    const profileSnap = await getDoc(profileDoc);
    
    if (profileSnap.exists()) {
      const currentData = profileSnap.data();
      const currentLinks = currentData.customLinks || [];
      
      // Check if link already exists
      const linkExists = currentLinks.some((l: any) => l.url === link.url);
      if (linkExists) {
        throw new Error('Link already exists');
      }
      
      const updatedLinks = [...currentLinks, link];
      
      await updateDoc(profileDoc, {
        customLinks: updatedLinks,
        updatedAt: Timestamp.now(),
      });
    } else {
      throw new Error('Profile not found');
    }
  } catch (error) {
    console.error('Error adding custom link:', error);
    throw error;
  }
};

// Update custom link
export const updateCustomLink = async (uid: string, index: number, link: { label: string; url: string }): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    const profileDoc = doc(db, 'users', uid);
    const profileSnap = await getDoc(profileDoc);
    
    if (profileSnap.exists()) {
      const currentData = profileSnap.data();
      const currentLinks = currentData.customLinks || [];
      
      if (index >= 0 && index < currentLinks.length) {
        const updatedLinks = [...currentLinks];
        updatedLinks[index] = link;
        
        await updateDoc(profileDoc, {
          customLinks: updatedLinks,
          updatedAt: Timestamp.now(),
        });
      } else {
        throw new Error('Invalid link index');
      }
    } else {
      throw new Error('Profile not found');
    }
  } catch (error) {
    console.error('Error updating custom link:', error);
    throw error;
  }
};

// Remove custom link
export const removeCustomLink = async (uid: string, index: number): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    const profileDoc = doc(db, 'users', uid);
    const profileSnap = await getDoc(profileDoc);
    
    if (profileSnap.exists()) {
      const currentData = profileSnap.data();
      const currentLinks = currentData.customLinks || [];
      
      if (index >= 0 && index < currentLinks.length) {
        const updatedLinks = currentLinks.filter((_: any, i: number) => i !== index);
        
        await updateDoc(profileDoc, {
          customLinks: updatedLinks,
          updatedAt: Timestamp.now(),
        });
      } else {
        throw new Error('Invalid link index');
      }
    } else {
      throw new Error('Profile not found');
    }
  } catch (error) {
    console.error('Error removing custom link:', error);
    throw error;
  }
};

// Validation helpers
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// Get user's resumes for integration
export const getUserResumes = async (uid: string): Promise<any[]> => {
  if (!db) return [];
  
  try {
    const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
    const resumesCol = collection(db, 'resumes');
    const q = query(
      resumesCol,
      where('user_id', '==', uid),
      orderBy('created_at', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      resume_id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at.toDate(),
    }));
  } catch (error) {
    console.error('Error getting user resumes:', error);
    return [];
  }
};
