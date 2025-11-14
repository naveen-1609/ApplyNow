import { NextRequest, NextResponse } from 'next/server';
import { adminDb, getAuth } from '@/lib/firebase-admin';

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await getAuth().verifyIdToken(token);
      return decodedToken.uid;
    }
    // Fallback: Allow userId from query/body for backward compatibility
    // In production, this should be removed and require auth token
    return null;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user ID
    const authenticatedUserId = await getUserIdFromRequest(request);
    
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    // Use authenticated user ID if available, otherwise use requested userId (for backward compatibility)
    const userId = authenticatedUserId || requestedUserId;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // If we have an authenticated user, verify they match the requested userId
    if (authenticatedUserId && requestedUserId && authenticatedUserId !== requestedUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const schedulesCol = adminDb.collection('schedules');
    const snapshot = await schedulesCol.where('user_id', '==', userId).get();
    
    if (snapshot.empty) {
      return NextResponse.json({ schedule: null });
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    const schedule = {
      schedule_id: doc.id,
      user_id: data.user_id,
      reminder_time: data.reminder_time,
      summary_time: data.summary_time,
      email_enabled: data.email_enabled,
      reminder_email_template: data.reminder_email_template,
      summary_email_template: data.summary_email_template,
    };

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user ID
    const authenticatedUserId = await getUserIdFromRequest(request);
    
    const body = await request.json();
    const { userId: requestedUserId, reminder_time, summary_time, email_enabled, reminder_email_template, summary_email_template } = body;

    // Use authenticated user ID if available, otherwise use requested userId (for backward compatibility)
    const userId = authenticatedUserId || requestedUserId;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // If we have an authenticated user, verify they match the requested userId
    if (authenticatedUserId && requestedUserId && authenticatedUserId !== requestedUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const schedulesCol = adminDb.collection('schedules');
    
    const docData = {
      user_id: userId,
      reminder_time,
      summary_time,
      email_enabled,
      reminder_email_template,
      summary_email_template,
    };
    
    const docRef = await schedulesCol.add(docData);
    
    return NextResponse.json({ 
      success: true, 
      schedule_id: docRef.id 
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user ID
    const authenticatedUserId = await getUserIdFromRequest(request);
    
    const body = await request.json();
    const { scheduleId, ...updateData } = body;

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    // Verify the schedule exists and belongs to the authenticated user (if authenticated)
    const scheduleDoc = await adminDb.collection('schedules').doc(scheduleId).get();
    if (!scheduleDoc.exists) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }
    
    const scheduleUserId = scheduleDoc.data()?.user_id;
    if (authenticatedUserId && scheduleUserId !== authenticatedUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const scheduleDocRef = adminDb.collection('schedules').doc(scheduleId);
    await scheduleDocRef.update(updateData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user ID
    const authenticatedUserId = await getUserIdFromRequest(request);
    
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    // Verify the schedule exists and belongs to the authenticated user (if authenticated)
    const scheduleDoc = await adminDb.collection('schedules').doc(scheduleId).get();
    if (!scheduleDoc.exists) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }
    
    const scheduleUserId = scheduleDoc.data()?.user_id;
    if (authenticatedUserId && scheduleUserId !== authenticatedUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const scheduleDocRef = adminDb.collection('schedules').doc(scheduleId);
    await scheduleDocRef.delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
