import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp } from '@/lib/firebase-admin';

/**
 * Fix user email endpoint - adds email to user document if missing
 * 
 * Usage:
 * GET /api/notifications/fix-user-email?userId=USER_ID&email=user@email.com
 * OR
 * GET /api/notifications/fix-user-email?email=user@email.com
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    let targetUserId = userId;

    // Find user by email if userId not provided
    if (!targetUserId) {
      const emailQuery = await adminDb.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (!emailQuery.empty) {
        targetUserId = emailQuery.docs[0].id;
      }
    }

    // If still no userId, try to find by Firebase Auth
    if (!targetUserId) {
      // Get all users and check their auth email
      const allUsers = await adminDb.collection('users').get();
      for (const doc of allUsers.docs) {
        const data = doc.data();
        // Check if this might be the user (by checking if email matches in any field)
        if (data.email?.toLowerCase() === email.toLowerCase() || 
            data.Email?.toLowerCase() === email.toLowerCase()) {
          targetUserId = doc.id;
          break;
        }
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { 
          error: 'User not found. Please provide userId or ensure user exists in Firestore.',
          suggestion: 'The user document might not exist. Check Firestore users collection.'
        },
        { status: 404 }
      );
    }

    // Get user document
    const userDoc = await adminDb.collection('users').doc(targetUserId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User document does not exist' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const currentEmail = userData?.email || userData?.Email;

    // Update email if missing or different
    if (!currentEmail || currentEmail.toLowerCase() !== email.toLowerCase()) {
      await adminDb.collection('users').doc(targetUserId).update({
        email: email,
        updatedAt: Timestamp.now(),
      });

      return NextResponse.json({
        success: true,
        message: `Email updated successfully for user ${targetUserId}`,
        userId: targetUserId,
        email: email,
        action: currentEmail ? 'updated' : 'added',
        previousEmail: currentEmail || 'none',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Email already exists and matches',
      userId: targetUserId,
      email: email,
      action: 'no_change',
    });

  } catch (error: any) {
    console.error('Error fixing user email:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fix user email',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

