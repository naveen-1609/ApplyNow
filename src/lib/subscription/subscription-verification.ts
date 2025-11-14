/**
 * Server-side subscription verification utilities
 * These functions ensure users can only access features they've paid for
 */

import { subscriptionService } from './subscription-service';
import { SubscriptionPlan, getUserLimits } from '@/lib/types/subscription';
import type { UserProfile } from './subscription-service';

export interface SubscriptionCheckResult {
  hasAccess: boolean;
  reason?: string;
  userProfile?: UserProfile;
  limits?: ReturnType<typeof getUserLimits>;
}

/**
 * Verify user has access to a specific feature
 * Use this in API routes to protect premium features
 */
export async function verifyFeatureAccess(
  userId: string,
  feature: 'ai' | 'notifications' | 'unlimited' | 'future'
): Promise<SubscriptionCheckResult> {
  try {
    const userProfile = await subscriptionService.getUserProfile(userId);
    
    if (!userProfile) {
      return {
        hasAccess: false,
        reason: 'User profile not found',
      };
    }

    // Check subscription expiration
    if (userProfile.subscriptionEndDate && userProfile.subscriptionEndDate < new Date()) {
      // Subscription expired - downgrade to FREE
      if (userProfile.subscriptionPlan !== SubscriptionPlan.FREE) {
        try {
          await subscriptionService.updateSubscription(
            userId,
            SubscriptionPlan.FREE,
            'expired'
          );
          console.log(`⚠️ Subscription expired for user ${userId}, downgraded to FREE`);
        } catch (error) {
          console.error('Error downgrading expired subscription:', error);
        }
      }
      
      return {
        hasAccess: false,
        reason: 'Subscription has expired',
        userProfile: {
          ...userProfile,
          subscriptionPlan: SubscriptionPlan.FREE,
          subscriptionStatus: 'expired',
        },
      };
    }

    // Check subscription status
    if (userProfile.subscriptionStatus !== 'active' && userProfile.subscriptionStatus !== 'past_due') {
      return {
        hasAccess: false,
        reason: `Subscription status: ${userProfile.subscriptionStatus}`,
        userProfile,
      };
    }

    // Get limits for the user's plan
    const limits = getUserLimits(userProfile.subscriptionPlan);

    // Check specific feature access
    let hasAccess = false;
    switch (feature) {
      case 'ai':
        hasAccess = limits.hasAIFeatures;
        break;
      case 'notifications':
        hasAccess = limits.hasNotifications;
        break;
      case 'unlimited':
        hasAccess = limits.hasUnlimitedAccess;
        break;
      case 'future':
        hasAccess = limits.hasFutureFeatures;
        break;
    }

    if (!hasAccess) {
      return {
        hasAccess: false,
        reason: `${feature} feature requires ${getRequiredPlan(feature)} plan or higher`,
        userProfile,
        limits,
      };
    }

    return {
      hasAccess: true,
      userProfile,
      limits,
    };
  } catch (error) {
    console.error('Error verifying feature access:', error);
    return {
      hasAccess: false,
      reason: 'Error checking subscription',
    };
  }
}

/**
 * Verify user hasn't exceeded application limit
 */
export async function verifyApplicationLimit(userId: string): Promise<SubscriptionCheckResult> {
  try {
    const userProfile = await subscriptionService.getUserProfile(userId);
    
    if (!userProfile) {
      return {
        hasAccess: false,
        reason: 'User profile not found',
      };
    }

    // Check subscription expiration
    if (userProfile.subscriptionEndDate && userProfile.subscriptionEndDate < new Date()) {
      return {
        hasAccess: false,
        reason: 'Subscription has expired',
        userProfile,
      };
    }

    const limits = getUserLimits(userProfile.subscriptionPlan);
    
    // Unlimited access means no limit
    if (limits.hasUnlimitedAccess) {
      return {
        hasAccess: true,
        userProfile,
        limits,
      };
    }

    // Check current usage
    const usage = await subscriptionService.getSubscriptionUsage(userId);
    
    if (limits.maxApplications > 0 && usage.applications >= limits.maxApplications) {
      return {
        hasAccess: false,
        reason: `Application limit reached (${limits.maxApplications}). Please upgrade to continue.`,
        userProfile,
        limits,
      };
    }

    return {
      hasAccess: true,
      userProfile,
      limits,
    };
  } catch (error) {
    console.error('Error verifying application limit:', error);
    return {
      hasAccess: false,
      reason: 'Error checking application limit',
    };
  }
}

/**
 * Verify user has minimum subscription plan
 */
export async function verifyMinimumPlan(
  userId: string,
  requiredPlan: SubscriptionPlan
): Promise<SubscriptionCheckResult> {
  try {
    const userProfile = await subscriptionService.getUserProfile(userId);
    
    if (!userProfile) {
      return {
        hasAccess: false,
        reason: 'User profile not found',
      };
    }

    // Check subscription expiration
    if (userProfile.subscriptionEndDate && userProfile.subscriptionEndDate < new Date()) {
      return {
        hasAccess: false,
        reason: 'Subscription has expired',
        userProfile,
      };
    }

    const planHierarchy = {
      [SubscriptionPlan.FREE]: 0,
      [SubscriptionPlan.PLUS]: 1,
      [SubscriptionPlan.PRO]: 2,
      [SubscriptionPlan.ADMIN]: 3,
    };

    const userPlanLevel = planHierarchy[userProfile.subscriptionPlan] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan] || 0;

    if (userPlanLevel < requiredPlanLevel) {
      return {
        hasAccess: false,
        reason: `This feature requires ${requiredPlan} plan or higher`,
        userProfile,
      };
    }

    return {
      hasAccess: true,
      userProfile,
      limits: getUserLimits(userProfile.subscriptionPlan),
    };
  } catch (error) {
    console.error('Error verifying minimum plan:', error);
    return {
      hasAccess: false,
      reason: 'Error checking subscription',
    };
  }
}

/**
 * Get required plan for a feature
 */
function getRequiredPlan(feature: 'ai' | 'notifications' | 'unlimited' | 'future'): SubscriptionPlan {
  switch (feature) {
    case 'ai':
      return SubscriptionPlan.PLUS;
    case 'notifications':
      return SubscriptionPlan.FREE; // Available to all
    case 'unlimited':
      return SubscriptionPlan.PRO;
    case 'future':
      return SubscriptionPlan.PRO;
    default:
      return SubscriptionPlan.FREE;
  }
}

/**
 * Check if subscription is active and not expired
 */
export async function isSubscriptionActive(userId: string): Promise<boolean> {
  try {
    const userProfile = await subscriptionService.getUserProfile(userId);
    
    if (!userProfile) {
      return false;
    }

    // Check expiration
    if (userProfile.subscriptionEndDate && userProfile.subscriptionEndDate < new Date()) {
      return false;
    }

    // Check status
    return userProfile.subscriptionStatus === 'active' || userProfile.subscriptionStatus === 'past_due';
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

