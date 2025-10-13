'use server';

import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { sendReminderEmail, sendSummaryEmail } from './email';
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

// Simple scheduler that checks for emails to send
export async function checkAndSendScheduledEmails(): Promise<{ emailsSent: number, details: string[] }> {
  const result = { emailsSent: 0, details: [] as string[] };
  
  try {
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;
    
    console.log(`🕰️  Checking for scheduled emails at ${currentTime}`);
    
    // Get all users with email notifications enabled
    const usersQuery = query(
      collection(db, 'users'),
      where('schedule.email_enabled', '==', true)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    result.details.push(`Found ${usersSnapshot.docs.length} users with email notifications enabled`);
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const schedule = userData.schedule as Schedule;
      const target = userData.target as Target;
      const userEmail = userData.email as string;
      
      if (!userEmail || !schedule || !target) {
        result.details.push(`Skipping user ${userDoc.id} - missing email, schedule, or target data`);
        continue;
      }
      
      const userId = userDoc.id;
      
      // Check if it's time for reminder email
      if (schedule.reminder_time === currentTime) {
        try {
          await sendReminderEmail(userId, userEmail, schedule, target);
          result.emailsSent++;
          result.details.push(`✅ Reminder email sent to ${userEmail} at ${currentTime}`);
        } catch (error) {
          result.details.push(`❌ Failed to send reminder email to ${userEmail}: ${error}`);
        }
      }
      
      // Check if it's time for summary email
      if (schedule.summary_time === currentTime) {
        try {
          await sendSummaryEmail(userId, userEmail, schedule, target);
          result.emailsSent++;
          result.details.push(`✅ Summary email sent to ${userEmail} at ${currentTime}`);
        } catch (error) {
          result.details.push(`❌ Failed to send summary email to ${userEmail}: ${error}`);
        }
      }
    }
    
    if (result.emailsSent === 0) {
      result.details.push(`No emails scheduled for ${currentTime}`);
    }
    
  } catch (error) {
    result.details.push(`❌ Error checking scheduled emails: ${error}`);
  }
  
  return result;
}

// Manual trigger for testing
export async function triggerEmailForUser(userId: string, type: 'reminder' | 'summary'): Promise<{ success: boolean, message: string }> {
  try {
    // For now, use mock data since we don't have the user ID
    // In a real implementation, you'd fetch user data from Firebase
    
    const mockUser = {
      userId: userId,
      email: 'naveenvenkat58@gmail.com',
      schedule: {
        schedule_id: 'mock-schedule',
        user_id: userId,
        reminder_time: '09:00',
        summary_time: '19:50',
        email_enabled: true
      } as Schedule,
      target: {
        daily_target: 5
      } as Target
    };
    
    if (type === 'reminder') {
      await sendReminderEmail(mockUser.userId, mockUser.email, mockUser.schedule, mockUser.target);
    } else {
      await sendSummaryEmail(mockUser.userId, mockUser.email, mockUser.schedule, mockUser.target);
    }
    
    return {
      success: true,
      message: `${type} email sent successfully to ${mockUser.email}`
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Failed to send ${type} email: ${error}`
    };
  }
}
