import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';

export interface Note {
  id: string;
  title: string;
  content: string; // Markdown or TipTap JSON
  tags: string[];
  pinned: boolean;
  version: number;
  updatedAt: number;
  deletedAt: number | null;
  shared: boolean;
  shareToken?: string;
}

export interface CreateNoteData {
  title: string;
  content: string;
  tags?: string[];
  pinned?: boolean;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  tags?: string[];
  pinned?: boolean;
  shared?: boolean;
}

export interface NoteVersion {
  id: string;
  noteId: string;
  title: string;
  content: string;
  version: number;
  createdAt: number;
}

// Get all notes for a user
export const getUserNotes = async (uid: string): Promise<Note[]> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    console.log('📚 Loading notes for user:', uid);
    const notesCol = collection(db, 'users', uid, 'notes');
    const q = query(
      notesCol,
      where('deletedAt', '==', null),
      orderBy('updatedAt', 'desc')
    );
    
    console.log('📚 Executing Firestore query...');
    const snapshot = await getDocs(q);
    console.log('✅ Found', snapshot.docs.length, 'notes');
    
    const notes = snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title || '',
      content: doc.data().content || '',
      tags: doc.data().tags || [],
      pinned: doc.data().pinned || false,
      version: doc.data().version || 1,
      updatedAt: doc.data().updatedAt?.toDate?.()?.getTime() || Date.now(),
      deletedAt: doc.data().deletedAt?.toDate?.()?.getTime() || null,
      shared: doc.data().shared || false,
      shareToken: doc.data().shareToken,
    }));
    
    // Sort by pinned first, then by updatedAt
    const sortedNotes = notes.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
    
    console.log('✅ Notes loaded and sorted successfully');
    return sortedNotes;
  } catch (error) {
    console.error('❌ Error getting user notes:', error);
    throw error;
  }
};

// Get a single note
export const getNote = async (uid: string, noteId: string): Promise<Note | null> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    const noteDoc = doc(db, 'users', uid, 'notes', noteId);
    const noteSnap = await getDoc(noteDoc);
    
    if (noteSnap.exists()) {
      const data = noteSnap.data();
      return {
        id: noteSnap.id,
        title: data.title || '',
        content: data.content || '',
        tags: data.tags || [],
        pinned: data.pinned || false,
        version: data.version || 1,
        updatedAt: data.updatedAt?.toDate?.()?.getTime() || Date.now(),
        deletedAt: data.deletedAt?.toDate?.()?.getTime() || null,
        shared: data.shared || false,
        shareToken: data.shareToken,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting note:', error);
    throw error;
  }
};

// Create a new note
export const createNote = async (uid: string, data: CreateNoteData): Promise<string> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    console.log('📝 Creating note for user:', uid);
    const notesCol = collection(db, 'users', uid, 'notes');
    const noteData = {
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      pinned: data.pinned || false,
      version: 1,
      updatedAt: Timestamp.now(),
      deletedAt: null,
      shared: false,
    };
    
    console.log('📝 Adding note to Firestore...');
    const docRef = await addDoc(notesCol, noteData);
    console.log('✅ Note created with ID:', docRef.id);
    
    // Create initial version
    try {
      await createNoteVersion(uid, docRef.id, data.title, data.content, 1);
      console.log('✅ Note version created');
    } catch (versionError) {
      console.warn('⚠️ Failed to create note version:', versionError);
      // Don't fail the entire operation if versioning fails
    }
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating note:', error);
    throw error;
  }
};

// Update a note
export const updateNote = async (uid: string, noteId: string, data: UpdateNoteData): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    const noteDoc = doc(db, 'users', uid, 'notes', noteId);
    const noteSnap = await getDoc(noteDoc);
    
    if (noteSnap.exists()) {
      const currentData = noteSnap.data();
      const currentVersion = currentData.version || 1;
      const newVersion = currentVersion + 1;
      
      const updateData: any = {
        ...data,
        version: newVersion,
        updatedAt: Timestamp.now(),
      };
      
      await updateDoc(noteDoc, updateData);
      
      // Create new version if content changed
      if (data.content !== undefined && data.content !== currentData.content) {
        await createNoteVersion(uid, noteId, data.title || currentData.title, data.content, newVersion);
      }
    } else {
      throw new Error('Note not found');
    }
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

// Soft delete a note
export const deleteNote = async (uid: string, noteId: string): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    const noteDoc = doc(db, 'users', uid, 'notes', noteId);
    await updateDoc(noteDoc, {
      deletedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

// Restore a deleted note
export const restoreNote = async (uid: string, noteId: string): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    const noteDoc = doc(db, 'users', uid, 'notes', noteId);
    await updateDoc(noteDoc, {
      deletedAt: null,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error restoring note:', error);
    throw error;
  }
};

// Permanently delete a note
export const permanentlyDeleteNote = async (uid: string, noteId: string): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    const noteDoc = doc(db, 'users', uid, 'notes', noteId);
    await deleteDoc(noteDoc);
    
    // Also delete all versions
    await deleteNoteVersions(uid, noteId);
  } catch (error) {
    console.error('Error permanently deleting note:', error);
    throw error;
  }
};

// Get deleted notes (trash)
export const getDeletedNotes = async (uid: string): Promise<Note[]> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    const notesCol = collection(db, 'users', uid, 'notes');
    const q = query(
      notesCol,
      where('deletedAt', '!=', null)
    );
    
    const snapshot = await getDocs(q);
    const notes = snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title || '',
      content: doc.data().content || '',
      tags: doc.data().tags || [],
      pinned: doc.data().pinned || false,
      version: doc.data().version || 1,
      updatedAt: doc.data().updatedAt?.toDate?.()?.getTime() || Date.now(),
      deletedAt: doc.data().deletedAt?.toDate?.()?.getTime() || null,
      shared: doc.data().shared || false,
      shareToken: doc.data().shareToken,
    }));
    
    // Sort by deletedAt descending
    return notes.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
  } catch (error) {
    console.error('Error getting deleted notes:', error);
    throw error;
  }
};

// Create note version
export const createNoteVersion = async (uid: string, noteId: string, title: string, content: string, version: number): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    const versionsCol = collection(db, 'users', uid, 'notes', noteId, 'versions');
    await addDoc(versionsCol, {
      title,
      content,
      version,
      createdAt: Timestamp.now(),
    });
    
    // Keep only last 10 versions
    await cleanupOldVersions(uid, noteId);
  } catch (error) {
    console.error('Error creating note version:', error);
    throw error;
  }
};

// Get note versions
export const getNoteVersions = async (uid: string, noteId: string): Promise<NoteVersion[]> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    const versionsCol = collection(db, 'users', uid, 'notes', noteId, 'versions');
    const q = query(versionsCol, orderBy('version', 'desc'), limit(10));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      noteId,
      title: doc.data().title || '',
      content: doc.data().content || '',
      version: doc.data().version || 1,
      createdAt: doc.data().createdAt?.toDate?.()?.getTime() || Date.now(),
    }));
  } catch (error) {
    console.error('Error getting note versions:', error);
    throw error;
  }
};

// Restore note version
export const restoreNoteVersion = async (uid: string, noteId: string, version: number): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    const versionsCol = collection(db, 'users', uid, 'notes', noteId, 'versions');
    const q = query(versionsCol, where('version', '==', version), limit(1));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const versionData = snapshot.docs[0].data();
      await updateNote(uid, noteId, {
        title: versionData.title,
        content: versionData.content,
      });
    } else {
      throw new Error('Version not found');
    }
  } catch (error) {
    console.error('Error restoring note version:', error);
    throw error;
  }
};

// Toggle note sharing
export const toggleNoteSharing = async (uid: string, noteId: string, shared: boolean): Promise<string | null> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    const noteDoc = doc(db, 'users', uid, 'notes', noteId);
    let shareToken = null;
    
    if (shared) {
      // Generate share token
      shareToken = generateShareToken();
    }
    
    await updateDoc(noteDoc, {
      shared,
      shareToken: shared ? shareToken : null,
      updatedAt: Timestamp.now(),
    });
    
    return shareToken;
  } catch (error) {
    console.error('Error toggling note sharing:', error);
    throw error;
  }
};

// Get shared note by token
export const getSharedNote = async (shareToken: string): Promise<Note | null> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    // This is a simplified implementation
    // In production, you might want to create a separate shared notes collection
    // or use a different approach for better security
    const notesCol = collection(db, 'users');
    const usersSnapshot = await getDocs(notesCol);
    
    for (const userDoc of usersSnapshot.docs) {
      const userNotesCol = collection(db, 'users', userDoc.id, 'notes');
      const q = query(userNotesCol, where('shareToken', '==', shareToken));
      const notesSnapshot = await getDocs(q);
      
      if (!notesSnapshot.empty) {
        const noteDoc = notesSnapshot.docs[0];
        const data = noteDoc.data();
        
        // Only return if the note is actually shared
        if (data.shared) {
          return {
            id: noteDoc.id,
            title: data.title || '',
            content: data.content || '',
            tags: data.tags || [],
            pinned: data.pinned || false,
            version: data.version || 1,
            updatedAt: data.updatedAt?.toDate?.()?.getTime() || Date.now(),
            deletedAt: data.deletedAt?.toDate?.()?.getTime() || null,
            shared: data.shared || false,
            shareToken: data.shareToken,
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting shared note:', error);
    throw error;
  }
};

// Helper functions
const generateShareToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const cleanupOldVersions = async (uid: string, noteId: string): Promise<void> => {
  if (!db) return;
  
  try {
    const versionsCol = collection(db, 'users', uid, 'notes', noteId, 'versions');
    const q = query(versionsCol, orderBy('version', 'desc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.docs.length > 10) {
      const versionsToDelete = snapshot.docs.slice(10);
      const deletePromises = versionsToDelete.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    }
  } catch (error) {
    console.error('Error cleaning up old versions:', error);
  }
};

const deleteNoteVersions = async (uid: string, noteId: string): Promise<void> => {
  if (!db) return;
  
  try {
    const versionsCol = collection(db, 'users', uid, 'notes', noteId, 'versions');
    const snapshot = await getDocs(versionsCol);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting note versions:', error);
  }
};

// Search notes
export const searchNotes = async (uid: string, searchTerm: string): Promise<Note[]> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    const notes = await getUserNotes(uid);
    
    if (!searchTerm.trim()) {
      return notes;
    }
    
    const term = searchTerm.toLowerCase();
    return notes.filter(note => 
      note.title.toLowerCase().includes(term) ||
      note.content.toLowerCase().includes(term) ||
      note.tags.some(tag => tag.toLowerCase().includes(term))
    );
  } catch (error) {
    console.error('Error searching notes:', error);
    throw error;
  }
};

// Filter notes by tags
export const filterNotesByTags = async (uid: string, tags: string[]): Promise<Note[]> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  try {
    const notes = await getUserNotes(uid);
    
    if (tags.length === 0) {
      return notes;
    }
    
    return notes.filter(note => 
      tags.some(tag => note.tags.includes(tag))
    );
  } catch (error) {
    console.error('Error filtering notes by tags:', error);
    throw error;
  }
};
