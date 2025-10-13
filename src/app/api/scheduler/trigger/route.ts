import { NextRequest, NextResponse } from 'next/server';
import { triggerEmailForUser } from '@/lib/services/simple-scheduler';

export async function POST(request: NextRequest) {
  try {
    const { userId, type } = await request.json();
    
    if (!userId || !type) {
      return NextResponse.json({ 
        success: false, 
        error: 'userId and type are required' 
      }, { status: 400 });
    }
    
    if (type !== 'reminder' && type !== 'summary') {
      return NextResponse.json({ 
        success: false, 
        error: 'type must be "reminder" or "summary"' 
      }, { status: 400 });
    }
    
    console.log(`🧪 Manually triggering ${type} email for user ${userId}...`);
    
    const result = await triggerEmailForUser(userId, type);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: result.message
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Failed to trigger email:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to trigger email' 
    }, { status: 500 });
  }
}
