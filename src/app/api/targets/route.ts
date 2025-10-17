import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const today = searchParams.get('today') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetsCol = adminDb.collection('targets');

    if (today) {
      // Get today's target
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      
      const snapshot = await targetsCol
        .where('user_id', '==', userId)
        .where('current_date', '==', Timestamp.fromDate(todayDate))
        .get();
      
      if (snapshot.empty) {
        return NextResponse.json({ target: null });
      }
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      
      const target = {
        target_id: doc.id,
        user_id: data.user_id,
        daily_target: data.daily_target,
        current_date: data.current_date.toDate(),
        applications_done: data.applications_done,
        status_color: data.status_color,
      };

      return NextResponse.json({ target });
    } else {
      // Get all targets
      const snapshot = await targetsCol.where('user_id', '==', userId).get();
      const targets = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          target_id: doc.id,
          user_id: data.user_id,
          daily_target: data.daily_target,
          current_date: data.current_date.toDate(),
          applications_done: data.applications_done,
          status_color: data.status_color,
        };
      });

      return NextResponse.json({ targets });
    }
  } catch (error) {
    console.error('Error fetching targets:', error);
    return NextResponse.json({ error: 'Failed to fetch targets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, daily_target, current_date, applications_done, status_color } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetsCol = adminDb.collection('targets');
    
    const docData = {
      user_id: userId,
      daily_target,
      current_date: Timestamp.fromDate(new Date(current_date)),
      applications_done,
      status_color,
    };
    
    const docRef = await targetsCol.add(docData);
    
    return NextResponse.json({ 
      success: true, 
      target_id: docRef.id 
    });
  } catch (error) {
    console.error('Error creating target:', error);
    return NextResponse.json({ error: 'Failed to create target' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetId, ...updateData } = body;

    if (!targetId) {
      return NextResponse.json({ error: 'Target ID is required' }, { status: 400 });
    }

    const targetDocRef = adminDb.collection('targets').doc(targetId);
    
    const processedUpdateData: { [key: string]: any } = {
      ...updateData,
    };

    if (updateData.current_date) {
      processedUpdateData.current_date = Timestamp.fromDate(new Date(updateData.current_date));
    }

    await targetDocRef.update(processedUpdateData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating target:', error);
    return NextResponse.json({ error: 'Failed to update target' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('targetId');

    if (!targetId) {
      return NextResponse.json({ error: 'Target ID is required' }, { status: 400 });
    }

    const targetDocRef = adminDb.collection('targets').doc(targetId);
    await targetDocRef.delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting target:', error);
    return NextResponse.json({ error: 'Failed to delete target' }, { status: 500 });
  }
}
