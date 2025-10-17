import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
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
    const body = await request.json();
    const { userId, reminder_time, summary_time, email_enabled, reminder_email_template, summary_email_template } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
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
    const body = await request.json();
    const { scheduleId, ...updateData } = body;

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
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
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    const scheduleDocRef = adminDb.collection('schedules').doc(scheduleId);
    await scheduleDocRef.delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
