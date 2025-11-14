/**
 * API Route Protection Utilities
 * Use these helpers to protect API routes that require subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyFeatureAccess, verifyApplicationLimit, verifyMinimumPlan } from './subscription-verification';
import { SubscriptionPlan } from '@/lib/types/subscription';

/**
 * Get user ID from request
 * This should extract from auth token in production
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  // Option 1: From auth header (if using Firebase Admin)
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    // Extract user ID from token (implement based on your auth system)
    // For now, we'll use a custom header
  }

  // Option 2: From custom header (for testing)
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return userId;
  }

  // Option 3: From query parameter (less secure, for testing only)
  const searchParams = request.nextUrl.searchParams;
  const queryUserId = searchParams.get('userId');
  if (queryUserId) {
    return queryUserId;
  }

  return null;
}

/**
 * Middleware to protect API routes requiring AI features
 */
export async function requireAIFeatures(request: NextRequest): Promise<NextResponse | null> {
  const userId = getUserIdFromRequest(request);
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const check = await verifyFeatureAccess(userId, 'ai');
  
  if (!check.hasAccess) {
    return NextResponse.json(
      { 
        error: check.reason || 'AI features require PLUS or PRO plan',
        requiredPlan: 'PLUS',
        upgradeUrl: '/subscriptions'
      },
      { status: 403 }
    );
  }

  return null; // Access granted
}

/**
 * Middleware to protect API routes requiring minimum plan
 */
export async function requireMinimumPlan(
  request: NextRequest,
  requiredPlan: SubscriptionPlan
): Promise<NextResponse | null> {
  const userId = getUserIdFromRequest(request);
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const check = await verifyMinimumPlan(userId, requiredPlan);
  
  if (!check.hasAccess) {
    return NextResponse.json(
      { 
        error: check.reason || `This feature requires ${requiredPlan} plan`,
        requiredPlan,
        upgradeUrl: '/subscriptions'
      },
      { status: 403 }
    );
  }

  return null; // Access granted
}

/**
 * Middleware to check application limits before allowing new applications
 */
export async function checkApplicationLimit(request: NextRequest): Promise<NextResponse | null> {
  const userId = getUserIdFromRequest(request);
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const check = await verifyApplicationLimit(userId);
  
  if (!check.hasAccess) {
    return NextResponse.json(
      { 
        error: check.reason || 'Application limit reached',
        upgradeUrl: '/subscriptions',
        currentLimit: check.limits?.maxApplications,
      },
      { status: 403 }
    );
  }

  return null; // Access granted
}

/**
 * Example usage in API route:
 * 
 * export async function POST(request: NextRequest) {
 *   // Check subscription
 *   const accessCheck = await requireAIFeatures(request);
 *   if (accessCheck) return accessCheck; // Returns error response if no access
 *   
 *   // Proceed with protected feature...
 * }
 */

