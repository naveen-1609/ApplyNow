import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export async function testFirebaseConnection() {
  try {
    console.log('🔍 Testing Firebase connection...');
    
    // Test if Firebase is initialized
    if (!auth || !db) {
      throw new Error('Firebase not initialized');
    }
    
    console.log('✅ Firebase initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return { success: false, error: error.message };
  }
}

export async function testAdminUserCreation() {
  try {
    console.log('🔍 Testing admin user creation...');
    
    const adminEmail = 'naveenvenkat58@gmail.com';
    const adminPassword = '123123123';
    
    // Try to create the admin user
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const user = userCredential.user;
      
      console.log('✅ Admin user created:', user.uid);
      
      // Create user profile
      await setDoc(doc(db, 'users', user.uid), {
        email: adminEmail,
        name: 'Naveen Venkat',
        subscriptionPlan: 'ADMIN',
        subscriptionStatus: 'active',
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log('✅ Admin user profile created');
      return { success: true, userId: user.uid };
      
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('ℹ️ Admin user already exists, testing login...');
        
        // Try to sign in
        const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        const user = userCredential.user;
        
        console.log('✅ Admin user login successful:', user.uid);
        
        // Check if profile exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          console.log('✅ Admin user profile exists');
          return { success: true, userId: user.uid, profileExists: true };
        } else {
          console.log('⚠️ Admin user profile missing, creating...');
          
          // Create user profile
          await setDoc(doc(db, 'users', user.uid), {
            email: adminEmail,
            name: 'Naveen Venkat',
            subscriptionPlan: 'ADMIN',
            subscriptionStatus: 'active',
            isAdmin: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          
          console.log('✅ Admin user profile created');
          return { success: true, userId: user.uid, profileCreated: true };
        }
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('❌ Admin user test failed:', error);
    return { success: false, error: error.message };
  }
}

export async function testFirestoreAccess() {
  try {
    console.log('🔍 Testing Firestore access...');
    
    // Test reading from users collection
    const testDoc = await getDoc(doc(db, 'users', 'test'));
    console.log('✅ Firestore read access working');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Firestore access failed:', error);
    return { success: false, error: error.message };
  }
}
