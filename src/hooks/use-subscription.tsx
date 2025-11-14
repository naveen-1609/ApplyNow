'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-optimized-auth';
import { subscriptionService, UserProfile } from '@/lib/subscription/subscription-service';
import { SubscriptionPlan, getUserLimits, canUseFeature } from '@/lib/types/subscription';

interface SubscriptionContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  upgradeSubscription: (plan: SubscriptionPlan) => Promise<void>;
  canUseAIFeatures: boolean;
  canUseNotifications: boolean;
  hasUnlimitedAccess: boolean;
  hasFutureFeatures: boolean;
  maxApplications: number;
  isAdmin: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let profile = await subscriptionService.getUserProfile(user.uid);
      
      if (!profile) {
        // Create profile if it doesn't exist
        try {
          profile = await subscriptionService.createUserProfile(
            user.uid,
            user.email || '',
            user.displayName || 'User'
          );
        } catch (createError) {
          console.error('Error creating user profile:', createError);
          // If profile creation fails, create a default profile object
          // Check if this is admin email
          const isAdminEmail = user.email?.toLowerCase() === 'naveenvenkat58@gmail.com';
          profile = {
            id: user.uid,
            email: user.email || '',
            name: user.displayName || 'User',
            subscriptionPlan: isAdminEmail ? SubscriptionPlan.ADMIN : SubscriptionPlan.FREE,
            subscriptionStatus: 'active',
            isAdmin: isAdminEmail,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
      }
      
      setUserProfile(profile);
    } catch (error) {
      console.error('Error refreshing profile:', error);
      // Set a default profile to prevent crashes
      // Check if this is admin email
      const isAdminEmail = user.email?.toLowerCase() === 'naveenvenkat58@gmail.com';
      setUserProfile({
        id: user.uid,
        email: user.email || '',
        name: user.displayName || 'User',
        subscriptionPlan: isAdminEmail ? SubscriptionPlan.ADMIN : SubscriptionPlan.FREE,
        subscriptionStatus: 'active',
        isAdmin: isAdminEmail,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  const upgradeSubscription = async (plan: SubscriptionPlan) => {
    if (!user || !userProfile) return;

    try {
      const startDate = new Date();
      let endDate: Date | undefined;

      // Set end date based on plan
      if (plan === SubscriptionPlan.PLUS) {
        endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // Monthly
      } else if (plan === SubscriptionPlan.PRO) {
        // Pro is one-time, no end date
        endDate = undefined;
      }

      await subscriptionService.updateSubscription(
        user.uid,
        plan,
        'active',
        startDate,
        endDate
      );

      // Refresh profile to get updated data
      await refreshProfile();
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshProfile();
  }, [user]);

  // Check if user is admin email (as fallback for immediate recognition)
  const isAdminEmail = user?.email?.toLowerCase() === 'naveenvenkat58@gmail.com';
  
  // Determine the effective subscription plan
  // Priority: 1) Admin email -> ADMIN, 2) User profile plan, 3) FREE
  const effectivePlan = isAdminEmail 
    ? SubscriptionPlan.ADMIN 
    : (userProfile?.subscriptionPlan || SubscriptionPlan.FREE);
  
  // Computed values based on effective subscription
  const limits = getUserLimits(effectivePlan);
  
  // Admin status: check profile first, then email as fallback
  const effectiveIsAdmin = userProfile?.isAdmin || isAdminEmail;
  
  const contextValue: SubscriptionContextType = {
    userProfile,
    loading,
    refreshProfile,
    upgradeSubscription,
    canUseAIFeatures: limits?.hasAIFeatures || false,
    canUseNotifications: limits?.hasNotifications || false,
    hasUnlimitedAccess: limits?.hasUnlimitedAccess || false,
    hasFutureFeatures: limits?.hasFutureFeatures || false,
    maxApplications: limits?.maxApplications || 100,
    isAdmin: effectiveIsAdmin,
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

// Helper hook for checking specific features
export function useFeatureAccess() {
  const { userProfile } = useSubscription();
  
  const canUse = (feature: keyof ReturnType<typeof getUserLimits>) => {
    if (!userProfile) return false;
    return canUseFeature(userProfile.subscriptionPlan, feature);
  };

  const limits = userProfile ? getUserLimits(userProfile.subscriptionPlan) : getUserLimits(SubscriptionPlan.FREE);

  return {
    canUseAIFeatures: limits?.hasAIFeatures || false,
    canUseNotifications: limits?.hasNotifications || false,
    hasUnlimitedAccess: limits?.hasUnlimitedAccess || false,
    hasFutureFeatures: limits?.hasFutureFeatures || false,
    maxApplications: limits?.maxApplications || 100,
  };
}
