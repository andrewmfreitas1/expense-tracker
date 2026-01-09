import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createConnectToken } from '@/lib/pluggy/services';

/**
 * POST /api/open-finance/connect
 * Create a connect token for Pluggy Widget
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create connect token
    const result = await createConnectToken(session.user.id);

    return NextResponse.json({
      success: true,
      accessToken: result.accessToken,
    });
  } catch (error) {
    console.error('Error in /api/open-finance/connect:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create connect token',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
