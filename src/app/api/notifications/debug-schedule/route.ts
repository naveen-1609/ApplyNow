import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Debug endpoint to check what's actually saved in the schedule
 * 
 * Usage:
 * GET /api/notifications/debug-schedule?email=naveenvenkat58@gmail.com
 * OR
 * GET /api/notifications/debug-schedule?userId=USER_ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');

    if (!email && !userId) {
      return NextResponse.json(
        { error: 'Email or userId parameter is required' },
        { status: 400 }
      );
    }

    let targetUserId = userId;

    // Find user by email if needed
    if (email && !targetUserId) {
      const emailQuery = await adminDb.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (!emailQuery.empty) {
        targetUserId = emailQuery.docs[0].id;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all schedules for this user
    const schedulesSnapshot = await adminDb.collection('schedules')
      .where('user_id', '==', targetUserId)
      .get();

    const schedules = schedulesSnapshot.docs.map(doc => ({
      schedule_id: doc.id,
      ...doc.data(),
    }));

    // Get user document
    const userDoc = await adminDb.collection('users').doc(targetUserId).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    return NextResponse.json({
      userId: targetUserId,
      email: userData?.email || email,
      schedules,
      scheduleCount: schedules.length,
      currentSchedule: schedules[0] || null,
      rawData: schedules.length > 0 ? schedulesSnapshot.docs[0].data() : null,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Debug schedule error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to debug schedule',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

