import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp, getAuth } from '@/lib/firebase-admin';

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
    const today = searchParams.get('today') === 'true';

    // Use authenticated user ID if available, otherwise use requested userId (for backward compatibility)
    const userId = authenticatedUserId || requestedUserId;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // If we have an authenticated user, verify they match the requested userId
    if (authenticatedUserId && requestedUserId && authenticatedUserId !== requestedUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    // Get authenticated user ID
    const authenticatedUserId = await getUserIdFromRequest(request);
    
    const body = await request.json();
    const { userId: requestedUserId, daily_target, current_date, applications_done, status_color } = body;

    // Use authenticated user ID if available, otherwise use requested userId (for backward compatibility)
    const userId = authenticatedUserId || requestedUserId;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // If we have an authenticated user, verify they match the requested userId
    if (authenticatedUserId && requestedUserId && authenticatedUserId !== requestedUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    // Get authenticated user ID
    const authenticatedUserId = await getUserIdFromRequest(request);
    
    const body = await request.json();
    const { targetId, ...updateData } = body;

    if (!targetId) {
      return NextResponse.json({ error: 'Target ID is required' }, { status: 400 });
    }

    // Verify the target exists and belongs to the authenticated user (if authenticated)
    const targetDoc = await adminDb.collection('targets').doc(targetId).get();
    if (!targetDoc.exists) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 });
    }
    
    const targetUserId = targetDoc.data()?.user_id;
    if (authenticatedUserId && targetUserId !== authenticatedUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    // Get authenticated user ID
    const authenticatedUserId = await getUserIdFromRequest(request);
    
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('targetId');

    if (!targetId) {
      return NextResponse.json({ error: 'Target ID is required' }, { status: 400 });
    }

    // Verify the target exists and belongs to the authenticated user (if authenticated)
    const targetDoc = await adminDb.collection('targets').doc(targetId).get();
    if (!targetDoc.exists) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 });
    }
    
    const targetUserId = targetDoc.data()?.user_id;
    if (authenticatedUserId && targetUserId !== authenticatedUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetDocRef = adminDb.collection('targets').doc(targetId);
    await targetDocRef.delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting target:', error);
    return NextResponse.json({ error: 'Failed to delete target' }, { status: 500 });
  }
}
