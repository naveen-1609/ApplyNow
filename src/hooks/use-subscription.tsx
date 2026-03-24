'use client';

import { createContext, useContext, ReactNode, useMemo, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-optimized-auth';
import { isOwnerEmail } from '@/lib/config/app-user';
import type { PermissionLevel } from '@/lib/types';
import { getMyPermissions } from '@/lib/services/permissions-client';
import { logger } from '@/lib/utils/logger';

type SingleUserProfile = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  permissions: PermissionLevel;
};

interface SubscriptionContextType {
  userProfile: SingleUserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
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
  const isAdmin = isOwnerEmail(user?.email);
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>('records_only');
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setPermissionLevel('records_only');
      setLoading(false);
      return;
    }

    if (isAdmin) {
      setPermissionLevel('ai_features');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await getMyPermissions();
      setPermissionLevel(response.access?.permissions || 'records_only');
    } catch (error) {
      logger.warn('Failed to load permission profile', error);
      setPermissionLevel('records_only');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const userProfile = useMemo<SingleUserProfile | null>(
    () =>
      user
        ? {
            id: user.uid,
            email: user.email || '',
            name: user.displayName || 'Naveen',
            isAdmin,
            permissions: isAdmin ? 'ai_features' : permissionLevel,
          }
        : null,
    [isAdmin, permissionLevel, user]
  );

  const contextValue = useMemo<SubscriptionContextType>(
    () => ({
      userProfile,
      loading,
      refreshProfile,
      canUseAIFeatures: isAdmin || permissionLevel === 'ai_features',
      canUseNotifications: true,
      hasUnlimitedAccess: isAdmin || permissionLevel === 'ai_features',
      hasFutureFeatures: true,
      maxApplications: Number.MAX_SAFE_INTEGER,
      isAdmin,
    }),
    [isAdmin, loading, permissionLevel, refreshProfile, userProfile]
  );

  return <SubscriptionContext.Provider value={contextValue}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

export function useFeatureAccess() {
  const { canUseAIFeatures, canUseNotifications, hasUnlimitedAccess, hasFutureFeatures, maxApplications } = useSubscription();
  return {
    canUseAIFeatures,
    canUseNotifications,
    hasUnlimitedAccess,
    hasFutureFeatures,
    maxApplications,
  };
}
