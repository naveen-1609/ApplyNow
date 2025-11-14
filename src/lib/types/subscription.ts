export enum SubscriptionPlan {
  FREE = 'FREE',
  PLUS = 'PLUS',
  PRO = 'PRO',
  ADMIN = 'ADMIN'
}

export interface SubscriptionLimits {
  maxApplications: number;
  hasAIFeatures: boolean;
  hasNotifications: boolean;
  hasUnlimitedAccess: boolean;
  hasFutureFeatures: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionPlan, SubscriptionLimits> = {
  [SubscriptionPlan.FREE]: {
    maxApplications: 100,
    hasAIFeatures: false,
    hasNotifications: true,
    hasUnlimitedAccess: false,
    hasFutureFeatures: false
  },
  [SubscriptionPlan.PLUS]: {
    maxApplications: 1000,
    hasAIFeatures: true,
    hasNotifications: true,
    hasUnlimitedAccess: false,
    hasFutureFeatures: false
  },
  [SubscriptionPlan.PRO]: {
    maxApplications: -1, // Unlimited
    hasAIFeatures: true,
    hasNotifications: true,
    hasUnlimitedAccess: true,
    hasFutureFeatures: true
  },
  [SubscriptionPlan.ADMIN]: {
    maxApplications: -1, // Unlimited
    hasAIFeatures: true,
    hasNotifications: true,
    hasUnlimitedAccess: true,
    hasFutureFeatures: true
  }
};

export interface SubscriptionPlanDetails {
  id: SubscriptionPlan;
  name: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly' | 'one-time';
  description: string;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
  buttonVariant: 'default' | 'outline' | 'secondary';
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanDetails[] = [
  {
    id: SubscriptionPlan.FREE,
    name: 'Free',
    price: 0,
    billingPeriod: 'monthly',
    description: 'Perfect for getting started with your job search',
    features: [
      'Up to 100 applications',
      'Basic notifications',
      'Resume storage',
      'Application tracking',
      'Basic analytics'
    ],
    buttonText: 'Get Started Free',
    buttonVariant: 'outline'
  },
  {
    id: SubscriptionPlan.PLUS,
    name: 'Plus',
    price: 5,
    billingPeriod: 'monthly',
    description: 'Unlock AI-powered features for better results',
    features: [
      'Up to 1,000 applications',
      'All AI features',
      'Advanced notifications',
      'Priority support',
      'Advanced analytics',
      'ATS optimization'
    ],
    isPopular: true,
    buttonText: 'Upgrade to Plus',
    buttonVariant: 'default'
  },
  {
    id: SubscriptionPlan.PRO,
    name: 'Pro',
    price: 50,
    billingPeriod: 'one-time',
    description: 'Unlimited access with lifetime benefits',
    features: [
      'Unlimited applications',
      'All AI features',
      'All notifications',
      'Priority support',
      'Advanced analytics',
      'Future feature access',
      'Lifetime updates'
    ],
    buttonText: 'Go Pro (One-time)',
    buttonVariant: 'default'
  },
  {
    id: SubscriptionPlan.ADMIN,
    name: 'Admin',
    price: 0,
    billingPeriod: 'monthly',
    description: 'Full administrative access with all features',
    features: [
      'Unlimited applications',
      'All AI features',
      'All notifications',
      'Admin dashboard access',
      'Advanced analytics',
      'Future feature access',
      'System management tools'
    ],
    buttonText: 'Admin Access',
    buttonVariant: 'default'
  }
];

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  startDate?: Date;
  endDate?: Date;
  isAdmin: boolean;
}

export function getUserLimits(plan: SubscriptionPlan): SubscriptionLimits {
  return SUBSCRIPTION_LIMITS[plan];
}

export function canUseFeature(plan: SubscriptionPlan, feature: keyof SubscriptionLimits): boolean {
  const limits = getUserLimits(plan);
  return limits[feature];
}

export function getRemainingApplications(plan: SubscriptionPlan, currentCount: number): number {
  const limits = getUserLimits(plan);
  if (limits.maxApplications === -1) return -1; // Unlimited
  return Math.max(0, limits.maxApplications - currentCount);
}
