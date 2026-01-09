import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserConnections, revokeConnection } from '@/lib/pluggy/services';

/**
 * GET /api/open-finance/connections
 * Get all bank connections for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get connections
    const connections = await getUserConnections(session.user.id);

    return NextResponse.json({
      success: true,
      connections,
    });
  } catch (error) {
    console.error('Error in GET /api/open-finance/connections:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch connections',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/open-finance/connections?id=xxx
 * Revoke a bank connection
 */
export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get connection ID from query params
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get('id');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Missing connection ID' },
        { status: 400 }
      );
    }

    // Get client info for audit log
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Revoke connection
    const result = await revokeConnection(
      connectionId,
      session.user.id,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      message: 'Connection revoked successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/open-finance/connections:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to revoke connection',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
