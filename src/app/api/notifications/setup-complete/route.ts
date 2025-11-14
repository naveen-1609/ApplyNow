import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp } from '@/lib/firebase-admin';

/**
 * Complete setup endpoint - creates user document, schedule, and target if missing
 * 
 * Usage:
 * GET /api/notifications/setup-complete?email=naveenvenkat58@gmail.com&userId=USER_ID&name=Name&reminderTime=09:00&summaryTime=21:00&dailyTarget=5
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');
    const name = searchParams.get('name') || 'User';
    const reminderTime = searchParams.get('reminderTime') || '09:00';
    const summaryTime = searchParams.get('summaryTime') || '21:00';
    const dailyTarget = parseInt(searchParams.get('dailyTarget') || '5');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json({
        error: 'userId parameter is required',
        help: 'Get your Firebase Auth UID from browser console: firebase.auth().currentUser?.uid',
        alternative: 'Or sign up through the app first, which will create the user document automatically',
      }, { status: 400 });
    }

    const isAdminEmail = email.toLowerCase() === 'naveenvenkat58@gmail.com';
    const results: any = {
      email,
      userId,
      actions: [],
    };

    // ============================================
    // STEP 1: Create/Update User Document
    // ============================================
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      // Create user document
      await adminDb.collection('users').doc(userId).set({
        email: email,
        name: name,
        subscriptionPlan: isAdminEmail ? 'ADMIN' : 'FREE',
        subscriptionStatus: 'active',
        isAdmin: isAdminEmail,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      results.actions.push('✅ Created user document');

      // Create admin user record if admin
      if (isAdminEmail) {
        try {
          await adminDb.collection('admin_users').doc(userId).set({
            email: email,
            name: name,
            role: 'admin',
            isActive: true,
            createdBy: 'system',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
          results.actions.push('✅ Created admin user record');
        } catch (error) {
          console.error('Error creating admin user record:', error);
        }
      }
    } else {
      // Update email if missing
      const userData = userDoc.data();
      if (!userData?.email) {
        await adminDb.collection('users').doc(userId).update({
          email: email,
          updatedAt: Timestamp.now(),
        });
        results.actions.push('✅ Updated user document email');
      } else {
        results.actions.push('✅ User document already exists');
      }
    }

    // ============================================
    // STEP 2: Create/Update Schedule
    // ============================================
    const scheduleSnapshot = await adminDb.collection('schedules')
      .where('user_id', '==', userId)
      .limit(1)
      .get();

    if (scheduleSnapshot.empty) {
      // Create schedule
      await adminDb.collection('schedules').add({
        user_id: userId,
        reminder_time: reminderTime,
        summary_time: summaryTime,
        email_enabled: true,
        reminder_email_template: 'Hi! This is your daily reminder to apply to jobs. You have {{daily_target}} applications to complete today. You\'ve already applied to {{applications_today}} jobs today. Keep going! {{motivational_message}}',
        summary_email_template: 'Great work today! You applied to {{applications_today}} out of {{daily_target}} target applications today. {{progress_percentage}}% complete. {{motivational_message}}',
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });
      results.actions.push(`✅ Created schedule (reminder: ${reminderTime}, summary: ${summaryTime})`);
    } else {
      // Update schedule
      const scheduleDoc = scheduleSnapshot.docs[0];
      await scheduleDoc.ref.update({
        reminder_time: reminderTime,
        summary_time: summaryTime,
        email_enabled: true,
        updated_at: Timestamp.now(),
      });
      results.actions.push(`✅ Updated schedule (reminder: ${reminderTime}, summary: ${summaryTime})`);
    }

    // ============================================
    // STEP 3: Create/Update Today's Target
    // ============================================
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetSnapshot = await adminDb.collection('targets')
      .where('user_id', '==', userId)
      .where('current_date', '==', Timestamp.fromDate(today))
      .limit(1)
      .get();

    if (targetSnapshot.empty) {
      // Create target for today
      await adminDb.collection('targets').add({
        user_id: userId,
        daily_target: dailyTarget,
        applications_done: 0,
        current_date: Timestamp.fromDate(today),
        status_color: 'Green',
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });
      results.actions.push(`✅ Created target for today (${dailyTarget} applications)`);
    } else {
      // Update target
      const targetDoc = targetSnapshot.docs[0];
      await targetDoc.ref.update({
        daily_target: dailyTarget,
        updated_at: Timestamp.now(),
      });
      results.actions.push(`✅ Updated target for today (${dailyTarget} applications)`);
    }

    // ============================================
    // SUMMARY
    // ============================================
    results.success = true;
    results.message = 'Complete setup finished successfully';
    results.schedule = {
      reminderTime,
      summaryTime,
      emailEnabled: true,
    };
    results.target = {
      dailyTarget,
      applicationsDone: 0,
    };
    results.nextSteps = [
      '✅ Everything is set up!',
      `📧 Reminder emails will send at ${reminderTime} UTC`,
      `📧 Summary emails will send at ${summaryTime} UTC`,
      `🎯 Daily target set to ${dailyTarget} applications`,
      '🧪 Test emails: /api/notifications/test?email=' + email + '&type=both&force=true',
    ];

    return NextResponse.json(results);

  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to complete setup',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

