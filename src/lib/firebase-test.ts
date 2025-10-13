// Firebase connection test utility
import { db, auth } from './firebase';
import { doc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';

export async function testFirebaseConnection(): Promise<{
  success: boolean;
  error?: string;
  details: {
    auth: boolean;
    firestore: boolean;
    user: boolean;
  };
}> {
  const result = {
    success: false,
    details: {
      auth: false,
      firestore: false,
      user: false,
    }
  };

  try {
    // Test Auth
    if (auth) {
      result.details.auth = true;
      console.log('✅ Firebase Auth is initialized');
    } else {
      result.error = 'Firebase Auth is not initialized';
      return result;
    }

    // Test Firestore
    if (db) {
      result.details.firestore = true;
      console.log('✅ Firebase Firestore is initialized');
    } else {
      result.error = 'Firebase Firestore is not initialized';
      return result;
    }

    // Test user authentication
    if (auth.currentUser) {
      result.details.user = true;
      console.log('✅ User is authenticated:', auth.currentUser.uid);
    } else {
      console.log('⚠️ No user is currently authenticated');
    }

    // Test Firestore read
    if (auth.currentUser && db) {
      try {
        // Try to read a simple document
        const testDoc = doc(db, 'users', auth.currentUser.uid);
        await getDoc(testDoc);
        console.log('✅ Firestore read test successful');
      } catch (error) {
        console.warn('⚠️ Firestore read test failed:', error);
        result.error = `Firestore read failed: ${error}`;
        return result;
      }
    }

    result.success = true;
    return result;
  } catch (error) {
    result.error = `Connection test failed: ${error}`;
    console.error('❌ Firebase connection test failed:', error);
    return result;
  }
}

export async function testNotesConnection(uid: string): Promise<{
  success: boolean;
  error?: string;
  noteCount?: number;
}> {
  try {
    if (!db) {
      return { success: false, error: 'Firestore not initialized' };
    }

    console.log('🔍 Testing notes connection for user:', uid);
    
    // Test reading notes collection
    const notesCol = collection(db, 'users', uid, 'notes');
    const q = query(notesCol, limit(5));
    const snapshot = await getDocs(q);
    
    console.log('✅ Notes connection successful, found', snapshot.docs.length, 'notes');
    
    return {
      success: true,
      noteCount: snapshot.docs.length
    };
  } catch (error) {
    console.error('❌ Notes connection test failed:', error);
    return {
      success: false,
      error: `Notes test failed: ${error}`
    };
  }
}
