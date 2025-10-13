'use server';

import { getFirestore, collection, doc, getDoc, getDocs, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getUsersForEmailReminder, sendReminderEmail, sendSummaryEmail } from './email';
import type { Schedule, Target } from '@/lib/types';

// Ensure Firebase is initialized for server-side use
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (getApps().length === 0 && firebaseConfig.projectId) {
  initializeApp(firebaseConfig);
}

const db = getFirestore();

// Store active timeouts for each user
const userTimeouts = new Map<string, { reminderTimeout?: NodeJS.Timeout, summaryTimeout?: NodeJS.Timeout }>();

// Convert time string (HH:mm) to milliseconds until next occurrence
function getTimeUntilNext(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  const now = new Date();
  const targetTime = new Date();
  
  targetTime.setHours(hours, minutes, 0, 0);
  
  // If the time has passed today, schedule for tomorrow
  if (targetTime <= now) {
    targetTime.setDate(targetTime.getDate() + 1);
  }
  
  return targetTime.getTime() - now.getTime();
}

// Schedule email for a specific user and time
async function scheduleUserEmail(userId: string, userEmail: string, schedule: Schedule, target: Target, type: 'reminder' | 'summary') {
  const timeString = type === 'reminder' ? schedule.reminder_time : schedule.summary_time;
  const timeUntilNext = getTimeUntilNext(timeString);
  
  console.log(`📅 Scheduling ${type} email for user ${userId} at ${timeString} (in ${Math.round(timeUntilNext / 1000 / 60)} minutes)`);
  
  const timeout = setTimeout(async () => {
    try {
      if (type === 'reminder') {
        await sendReminderEmail(userId, userEmail, schedule, target);
      } else {
        await sendSummaryEmail(userId, userEmail, schedule, target);
      }
      
      // Schedule the next occurrence
      scheduleUserEmail(userId, userEmail, schedule, target, type);
    } catch (error) {
      console.error(`Failed to send ${type} email to user ${userId}:`, error);
    }
  }, timeUntilNext);
  
  // Store the timeout so we can cancel it if needed
  const userTimeout = userTimeouts.get(userId) || {};
  if (type === 'reminder') {
    userTimeout.reminderTimeout = timeout;
  } else {
    userTimeout.summaryTimeout = timeout;
  }
  userTimeouts.set(userId, userTimeout);
}

// Cancel existing timeouts for a user
function cancelUserTimeouts(userId: string) {
  const userTimeout = userTimeouts.get(userId);
  if (userTimeout) {
    if (userTimeout.reminderTimeout) {
      clearTimeout(userTimeout.reminderTimeout);
    }
    if (userTimeout.summaryTimeout) {
      clearTimeout(userTimeout.summaryTimeout);
    }
    userTimeouts.delete(userId);
  }
}

// Initialize dynamic scheduling for all users
export async function initializeDynamicScheduling() {
  console.log('🚀 Initializing dynamic email scheduling...');
  
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('schedule.email_enabled', '==', true)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const schedule = userData.schedule as Schedule;
      const target = userData.target as Target;
      const userEmail = userData.email as string;
      
      if (!userEmail || !schedule || !target) continue;
      
      const userId = userDoc.id;
      
      // Cancel any existing timeouts for this user
      cancelUserTimeouts(userId);
      
      // Schedule both reminder and summary emails
      if (schedule.reminder_time) {
        await scheduleUserEmail(userId, userEmail, schedule, target, 'reminder');
      }
      
      if (schedule.summary_time) {
        await scheduleUserEmail(userId, userEmail, schedule, target, 'summary');
      }
    }
    
    console.log(`✅ Dynamic scheduling initialized for ${usersSnapshot.docs.length} users`);
    
    // Set up real-time listener for schedule changes
    setupRealtimeListener();
    
  } catch (error) {
    console.error('Failed to initialize dynamic scheduling:', error);
  }
}

// Set up real-time listener for schedule changes
function setupRealtimeListener() {
  console.log('👂 Setting up real-time listener for schedule changes...');
  
  const usersQuery = query(
    collection(db, 'users'),
    where('schedule.email_enabled', '==', true)
  );
  
  onSnapshot(usersQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'modified') {
        const userData = change.doc.data();
        const schedule = userData.schedule as Schedule;
        const target = userData.target as Target;
        const userEmail = userData.email as string;
        
        if (!userEmail || !schedule || !target) return;
        
        const userId = change.doc.id;
        
        console.log(`🔄 Schedule changed for user ${userId}, rescheduling emails...`);
        
        // Cancel existing timeouts
        cancelUserTimeouts(userId);
        
        // Schedule new emails
        if (schedule.reminder_time) {
          scheduleUserEmail(userId, userEmail, schedule, target, 'reminder');
        }
        
        if (schedule.summary_time) {
          scheduleUserEmail(userId, userEmail, schedule, target, 'summary');
        }
      }
    });
  });
}

// Get current scheduled times for debugging
export async function getScheduledTimes(): Promise<Array<{ userId: string, reminderTime?: string, summaryTime?: string }>> {
  const scheduledTimes: Array<{ userId: string, reminderTime?: string, summaryTime?: string }> = [];
  
  userTimeouts.forEach((timeout, userId) => {
    scheduledTimes.push({
      userId,
      reminderTime: timeout.reminderTimeout ? 'Scheduled' : undefined,
      summaryTime: timeout.summaryTimeout ? 'Scheduled' : undefined,
    });
  });
  
  return scheduledTimes;
}

// Manual trigger for testing
export async function triggerEmailNow(userId: string, type: 'reminder' | 'summary') {
  try {
    const userDoc = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDoc);
    
    if (!userSnapshot.exists()) {
      console.error(`User ${userId} not found`);
      return false;
    }
    
    const userData = userSnapshot.data();
    const schedule = userData.schedule as Schedule;
    const target = userData.target as Target;
    const userEmail = userData.email as string;
    
    if (!userEmail || !schedule || !target) {
      console.error(`Invalid user data for ${userId}`);
      return false;
    }
    
    if (type === 'reminder') {
      await sendReminderEmail(userId, userEmail, schedule, target);
    } else {
      await sendSummaryEmail(userId, userEmail, schedule, target);
    }
    
    console.log(`✅ ${type} email sent manually to user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Failed to trigger ${type} email for user ${userId}:`, error);
    return false;
  }
}
