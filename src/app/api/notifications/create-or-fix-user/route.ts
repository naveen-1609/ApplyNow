import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp } from '@/lib/firebase-admin';

/**
 * Create or fix user endpoint - creates user document if missing or fixes email
 * 
 * Usage:
 * GET /api/notifications/create-or-fix-user?email=naveenvenkat58@gmail.com
 * OR
 * GET /api/notifications/create-or-fix-user?email=naveenvenkat58@gmail.com&userId=USER_ID&name=User Name
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');
    const name = searchParams.get('name') || 'User';

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const isAdminEmail = email.toLowerCase() === 'naveenvenkat58@gmail.com';

    // Try to find existing user by email
    let targetUserId = userId;
    let userDoc = null;
    let userExists = false;

    if (targetUserId) {
      userDoc = await adminDb.collection('users').doc(targetUserId).get();
      userExists = userDoc.exists;
    }

    // If not found by userId, try to find by email
    if (!userExists) {
      const emailQuery = await adminDb.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (!emailQuery.empty) {
        userDoc = emailQuery.docs[0];
        targetUserId = userDoc.id;
        userExists = true;
      }
    }

    // If user doesn't exist, we need to create it
    if (!userExists) {
      if (!targetUserId) {
        return NextResponse.json({
          error: 'User document not found and userId not provided',
          suggestion: 'Please provide userId parameter, or the user needs to sign up first through the app',
          instructions: [
            'Option 1: Sign up through the app first (this will create the user document)',
            'Option 2: Provide userId parameter: /api/notifications/create-or-fix-user?email=your@email.com&userId=YOUR_FIREBASE_AUTH_UID',
            'Option 3: Manually create user document in Firestore users collection',
          ],
          help: {
            getUserId: 'Get your Firebase Auth UID from browser console: firebase.auth().currentUser.uid',
            createManually: 'Go to Firebase Console → Firestore → users collection → Add document with your Firebase Auth UID as document ID',
          }
        }, { status: 404 });
      }

      // Create new user document
      const userData = {
        email: email,
        name: name,
        subscriptionPlan: isAdminEmail ? 'ADMIN' : 'FREE',
        subscriptionStatus: 'active',
        isAdmin: isAdminEmail,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await adminDb.collection('users').doc(targetUserId).set(userData);

      // Also create admin user record if admin
      if (isAdminEmail) {
        try {
          await adminDb.collection('admin_users').doc(targetUserId).set({
            email: email,
            name: name,
            role: 'admin',
            isActive: true,
            createdBy: 'system',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        } catch (error) {
          console.error('Error creating admin user record:', error);
        }
      }

      return NextResponse.json({
        success: true,
        message: `User document created successfully`,
        userId: targetUserId,
        email: email,
        action: 'created',
        isAdmin: isAdminEmail,
        nextSteps: [
          'User document created - you can now test emails',
          'Try: /api/notifications/test?email=' + email + '&type=both&force=true',
        ],
      });
    }

    // User exists - check and fix email if needed
    const userData = userDoc!.data();
    const currentEmail = userData?.email || userData?.Email;

    if (!currentEmail || currentEmail.toLowerCase() !== email.toLowerCase()) {
      // Update email
      await adminDb.collection('users').doc(targetUserId!).update({
        email: email,
        updatedAt: Timestamp.now(),
      });

      // Also update admin status if admin email
      if (isAdminEmail) {
        await adminDb.collection('users').doc(targetUserId!).update({
          subscriptionPlan: SubscriptionPlan.ADMIN,
          isAdmin: true,
          subscriptionStatus: 'active',
        });
      }

      return NextResponse.json({
        success: true,
        message: `Email updated successfully`,
        userId: targetUserId,
        email: email,
        action: currentEmail ? 'updated' : 'added',
        previousEmail: currentEmail || 'none',
        isAdmin: isAdminEmail,
      });
    }

    // User exists and email matches - just confirm
    return NextResponse.json({
      success: true,
      message: 'User document exists and email is correct',
      userId: targetUserId,
      email: email,
      action: 'no_change',
      isAdmin: isAdminEmail,
      userData: {
        name: userData?.name,
        subscriptionPlan: userData?.subscriptionPlan,
        isAdmin: userData?.isAdmin,
      },
    });

  } catch (error: any) {
    console.error('Error creating/fixing user:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create/fix user',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

