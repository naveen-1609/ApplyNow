// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth';
import { 
  getFirestore, 
  type Firestore, 
  connectFirestoreEmulator,
  enableNetwork,
  disableNetwork,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

// Initialize Firebase with aggressive performance optimizations
function initializeFirebase() {
  if (!firebaseConfig.apiKey) {
    console.error('Firebase configuration is missing. Please check your environment variables.');
    return;
  }

  try {
    // Initialize app
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized');
    
    // Initialize auth
    auth = getAuth(app);
    console.log('✅ Firebase auth initialized');
    
    // Initialize Firestore with performance optimizations
    if (typeof window !== 'undefined') {
      try {
        // Use initializeFirestore for better control
        db = initializeFirestore(app, {
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
          ignoreUndefinedProperties: true,
        });
        console.log('✅ Firebase Firestore initialized with optimizations');
        
        // Enable offline persistence
        enableNetwork(db).then(() => {
          console.log('✅ Firestore network enabled');
        }).catch((error) => {
          console.warn('⚠️ Failed to enable Firestore network:', error);
        });
      } catch (firestoreError) {
        console.warn('⚠️ Failed to initialize Firestore with optimizations, falling back to standard initialization:', firestoreError);
        db = getFirestore(app);
        console.log('✅ Firebase Firestore initialized (standard)');
      }
    } else {
      db = getFirestore(app);
      console.log('✅ Firebase Firestore initialized (server-side)');
    }
    
    // Initialize storage
    storage = getStorage(app);
    console.log('✅ Firebase storage initialized');
    
    // Performance optimizations
    if (typeof window !== 'undefined') {
      // Preload critical data with delay
      setTimeout(() => {
        preloadCriticalData();
      }, 2000);
    }
    
    console.log('🎉 Firebase initialized successfully with optimizations');
  } catch (e) {
    console.error('❌ Firebase initialization error:', e);
  }
}

// Preload critical data for better performance
async function preloadCriticalData() {
  if (!db) return;
  
  try {
    // Preload common collections to cache
    const { collection, getDocs, query, limit } = await import('firebase/firestore');
    
    // Preload with small limits to avoid overwhelming
    const collections = ['job_applications', 'resumes', 'targets'];
    
    for (const collectionName of collections) {
      try {
        const col = collection(db, collectionName);
        const q = query(col, limit(10));
        await getDocs(q);
        console.log(`Preloaded ${collectionName} collection`);
      } catch (error) {
        console.warn(`Failed to preload ${collectionName}:`, error);
      }
    }
  } catch (error) {
    console.warn('Failed to preload critical data:', error);
  }
}

// Initialize Firebase immediately (only in browser)
if (typeof window !== 'undefined') {
  initializeFirebase();
}

export { app, auth, db, storage };
