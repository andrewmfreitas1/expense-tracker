import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchBills, importBillsAsExpenses } from '@/lib/pluggy/services';

/**
 * POST /api/open-finance/sync
 * Manually trigger synchronization of bills from a bank connection
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
    const { connectionId } = body;

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Missing connectionId' },
        { status: 400 }
      );
    }

    // Fetch bills from Pluggy
    const bills = await fetchBills(connectionId, session.user.id);

    // Import bills as expenses
    const importResult = await importBillsAsExpenses(
      bills,
      session.user.id,
      connectionId
    );

    return NextResponse.json({
      success: true,
      billsFetched: bills.length,
      ...importResult,
      message: `Imported ${importResult.imported} new bills, skipped ${importResult.skipped} duplicates`,
    });
  } catch (error) {
    console.error('Error in /api/open-finance/sync:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to sync bills',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
