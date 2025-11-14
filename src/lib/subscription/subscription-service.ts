import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  Timestamp 
} from 'firebase/firestore';
import { SubscriptionPlan, UserSubscription } from '@/lib/types/subscription';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: string;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionTransaction {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  paymentMethod?: string;
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
}

export class SubscriptionService {
  private static instance: SubscriptionService;

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      if (!db) {
        console.warn('Firebase not initialized, returning null profile');
        return null;
      }

      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        return null;
      }
      
      const data = userDoc.data();
      const email = data.email?.toLowerCase() || '';
      
      // Check if this is the admin email and upgrade if needed
      const isAdminEmail = email === 'naveenvenkat58@gmail.com';
      const isCurrentlyAdmin = data.isAdmin || data.subscriptionPlan === SubscriptionPlan.ADMIN;
      
      // Auto-upgrade admin email to ADMIN plan if not already
      // Always ensure admin email has ADMIN plan and isAdmin flag
      if (isAdminEmail) {
        if (!isCurrentlyAdmin || data.subscriptionPlan !== SubscriptionPlan.ADMIN) {
          try {
            console.log(`🔧 Upgrading ${email} to ADMIN plan...`);
            await updateDoc(doc(db, 'users', userId), {
              subscriptionPlan: SubscriptionPlan.ADMIN,
              isAdmin: true,
              subscriptionStatus: 'active',
              updatedAt: Timestamp.fromDate(new Date()),
            });
            console.log(`✅ Successfully upgraded ${email} to ADMIN plan`);
            
            // Also create/update admin user record
            try {
              await setDoc(doc(db, 'admin_users', userId), {
                email: data.email,
                name: data.name,
                role: 'admin',
                isActive: true,
                createdBy: 'system',
                createdAt: Timestamp.fromDate(new Date()),
                updatedAt: Timestamp.fromDate(new Date()),
              }, { merge: true });
            } catch (error) {
              console.error('Error creating/updating admin user record:', error);
            }
          } catch (error) {
            console.error('Error upgrading user to admin:', error);
          }
        }
      }
      
      return {
        id: userDoc.id,
        email: data.email,
        name: data.name,
        subscriptionPlan: isAdminEmail ? SubscriptionPlan.ADMIN : (data.subscriptionPlan as SubscriptionPlan),
        subscriptionStatus: data.subscriptionStatus,
        subscriptionStartDate: data.subscriptionStartDate?.toDate(),
        subscriptionEndDate: data.subscriptionEndDate?.toDate(),
        isAdmin: isAdminEmail || (data.isAdmin || false),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Return null instead of throwing to prevent app crashes
      return null;
    }
  }

  async createUserProfile(userId: string, email: string, name: string): Promise<UserProfile> {
    try {
      if (!db) {
        console.warn('Firebase not initialized, cannot create user profile');
        throw new Error('Firebase not initialized');
      }

      // Check if this is the admin email
      const isAdminEmail = email.toLowerCase() === 'naveenvenkat58@gmail.com';
      
      const userProfile: Partial<UserProfile> = {
        email,
        name,
        subscriptionPlan: isAdminEmail ? SubscriptionPlan.ADMIN : SubscriptionPlan.FREE,
        subscriptionStatus: 'active',
        isAdmin: isAdminEmail,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'users', userId), {
        ...userProfile,
        createdAt: Timestamp.fromDate(userProfile.createdAt!),
        updatedAt: Timestamp.fromDate(userProfile.updatedAt!),
      });

      // Also create admin user record if admin
      if (isAdminEmail) {
        try {
          await setDoc(doc(db, 'admin_users', userId), {
            email,
            name,
            role: 'admin',
            isActive: true,
            createdBy: 'system',
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
          });
        } catch (error) {
          console.error('Error creating admin user record:', error);
          // Don't fail the whole operation if admin record creation fails
        }
      }

      return {
        id: userId,
        ...userProfile,
      } as UserProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async updateSubscription(
    userId: string, 
    plan: SubscriptionPlan, 
    status: string = 'active',
    startDate?: Date,
    endDate?: Date
  ): Promise<void> {
    try {
      const updateData: any = {
        subscriptionPlan: plan,
        subscriptionStatus: status,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      if (startDate) {
        updateData.subscriptionStartDate = Timestamp.fromDate(startDate);
      }
      if (endDate) {
        updateData.subscriptionEndDate = Timestamp.fromDate(endDate);
      }

      await updateDoc(doc(db, 'users', userId), updateData);
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  async createTransaction(transaction: Omit<SubscriptionTransaction, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'subscription_transactions'), {
        ...transaction,
        createdAt: Timestamp.fromDate(new Date()),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async updateTransactionStatus(transactionId: string, status: string, completedAt?: Date): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      if (completedAt) {
        updateData.completedAt = Timestamp.fromDate(completedAt);
      }

      await updateDoc(doc(db, 'subscription_transactions', transactionId), updateData);
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  }

  async getUserTransactions(userId: string): Promise<SubscriptionTransaction[]> {
    try {
      const q = query(
        collection(db, 'subscription_transactions'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as SubscriptionTransaction[];
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<UserProfile[]> {
    try {
      if (!db) {
        console.warn('Firebase not initialized, returning empty array');
        return [];
      }

      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email || '',
          name: data.name || 'Unknown User',
          subscriptionPlan: (data.subscriptionPlan as SubscriptionPlan) || SubscriptionPlan.FREE,
          subscriptionStatus: data.subscriptionStatus || 'active',
          subscriptionStartDate: data.subscriptionStartDate?.toDate(),
          subscriptionEndDate: data.subscriptionEndDate?.toDate(),
          isAdmin: data.isAdmin || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      });
    } catch (error) {
      console.error('Error fetching all users:', error);
      return []; // Return empty array instead of throwing to prevent crashes
    }
  }

  async setAdminStatus(userId: string, isAdmin: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isAdmin,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('Error updating admin status:', error);
      throw error;
    }
  }

  async getSubscriptionUsage(userId: string): Promise<{ applications: number; resumes: number }> {
    try {
      // Get application count
      const applicationsQuery = query(
        collection(db, 'job_applications'),
        where('user_id', '==', userId)
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);
      
      // Get resume count
      const resumesQuery = query(
        collection(db, 'resumes'),
        where('user_id', '==', userId)
      );
      const resumesSnapshot = await getDocs(resumesQuery);

      return {
        applications: applicationsSnapshot.size,
        resumes: resumesSnapshot.size,
      };
    } catch (error) {
      console.error('Error fetching subscription usage:', error);
      throw error;
    }
  }
}

export const subscriptionService = SubscriptionService.getInstance();
