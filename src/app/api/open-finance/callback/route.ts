import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveBankConnection } from '@/lib/pluggy/services';

/**
 * POST /api/open-finance/callback
 * Handle callback after user connects their bank account
 * This is called by the frontend after Pluggy Widget completes
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

    const body = await req.json();
    const { itemId, accessToken, institutionName, institutionId } = body;

    if (!itemId || !accessToken || !institutionName) {
      return NextResponse.json(
        { error: 'Missing required fields: itemId, accessToken, institutionName' },
        { status: 400 }
      );
    }

    // Get client info for audit log
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Save connection to database
    const connection = await saveBankConnection(
      session.user.id,
      itemId,
      accessToken,
      institutionName,
      institutionId || '',
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      connection: {
        id: connection.id,
        institutionName: connection.institutionName,
        createdAt: connection.createdAt,
      },
    });
  } catch (error) {
    console.error('Error in /api/open-finance/callback:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to save bank connection',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
