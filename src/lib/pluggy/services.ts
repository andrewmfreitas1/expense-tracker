import { getPluggyClient } from './client';
import { prisma } from '@/lib/prisma';
import { encryptBankToken, decryptBankToken } from '@/lib/encryption';

/**
 * Create a Connect Token for Pluggy Widget
 * This token is used to initialize the Pluggy Connect Widget in the frontend
 */
export async function createConnectToken(userId: string) {
  try {
    const client = getPluggyClient();
    
    // Create a connect token that will be used by the widget
    const connectToken = await client.createConnectToken({
      // Optional: specify which types of accounts to allow
      // products: ['ACCOUNTS', 'TRANSACTIONS', 'PAYMENTS'],
    });

    return {
      accessToken: connectToken.accessToken,
    };
  } catch (error) {
    console.error('Error creating connect token:', error);
    throw new Error('Failed to create connect token');
  }
}

/**
 * Save bank connection after user authorizes access
 */
export async function saveBankConnection(
  userId: string,
  itemId: string,
  accessToken: string,
  institutionName: string,
  institutionId: string,
  ipAddress: string,
  userAgent: string
) {
  try {
    // Encrypt the access token
    const { encrypted, iv, tag } = encryptBankToken(accessToken);

    // Calculate consent expiration (12 months from now)
    const consentExpiresAt = new Date();
    consentExpiresAt.setMonth(consentExpiresAt.getMonth() + 12);

    // Save connection to database
    const connection = await prisma.bankConnection.create({
      data: {
        userId,
        itemId,
        accessTokenEnc: encrypted,
        accessTokenIV: iv,
        accessTokenTag: tag,
        institutionName,
        institutionId,
        consentExpiresAt,
        status: 'ACTIVE',
      },
    });

    // Log consent action
    await prisma.consentLog.create({
      data: {
        userId,
        action: 'GRANTED',
        itemId,
        institution: institutionName,
        ipAddress,
        userAgent,
        expiresAt: consentExpiresAt,
      },
    });

    return connection;
  } catch (error) {
    console.error('Error saving bank connection:', error);
    throw new Error('Failed to save bank connection');
  }
}

/**
 * Get decrypted access token for a connection
 */
export async function getConnectionAccessToken(connectionId: string, userId: string): Promise<string> {
  const connection = await prisma.bankConnection.findFirst({
    where: {
      id: connectionId,
      userId,
      status: 'ACTIVE',
    },
  });

  if (!connection) {
    throw new Error('Connection not found or inactive');
  }

  // Check if consent has expired
  if (new Date() > connection.consentExpiresAt) {
    await prisma.bankConnection.update({
      where: { id: connectionId },
      data: { status: 'EXPIRED' },
    });
    throw new Error('Connection consent has expired');
  }

  // Decrypt and return access token
  return decryptBankToken(
    connection.accessTokenEnc,
    connection.accessTokenIV,
    connection.accessTokenTag
  );
}

/**
 * Get all active connections for a user
 */
export async function getUserConnections(userId: string) {
  return prisma.bankConnection.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      itemId: true,
      institutionName: true,
      institutionId: true,
      consentExpiresAt: true,
      lastSyncAt: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      // Don't expose encrypted tokens
    },
  });
}

/**
 * Revoke a bank connection
 */
export async function revokeConnection(
  connectionId: string,
  userId: string,
  ipAddress: string,
  userAgent: string
) {
  const connection = await prisma.bankConnection.findFirst({
    where: {
      id: connectionId,
      userId,
    },
  });

  if (!connection) {
    throw new Error('Connection not found');
  }

  // Update connection status
  await prisma.bankConnection.update({
    where: { id: connectionId },
    data: { status: 'REVOKED' },
  });

  // Log revocation
  await prisma.consentLog.create({
    data: {
      userId,
      action: 'REVOKED',
      itemId: connection.itemId,
      institution: connection.institutionName,
      ipAddress,
      userAgent,
    },
  });

  // TODO: Also revoke on Pluggy side if needed
  // const client = getPluggyClient();
  // await client.deleteItem(connection.itemId);

  return { success: true };
}

/**
 * Fetch bills/boletos from Pluggy for a connection
 */
export async function fetchBills(connectionId: string, userId: string) {
  const startTime = Date.now();
  
  try {
    const accessToken = await getConnectionAccessToken(connectionId, userId);
    const connection = await prisma.bankConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    const client = getPluggyClient();
    
    // Fetch accounts first to get account IDs
    const accounts = await client.fetchAccounts(connection.itemId);
    
    let allBills: any[] = [];
    
    // Fetch bills for each account
    for (const account of accounts) {
      try {
        // @ts-ignore - SDK might have different method names
        const bills = await client.fetchPaymentInvoices(account.id);
        allBills = allBills.concat(bills);
      } catch (err) {
        console.warn(`Failed to fetch bills for account ${account.id}:`, err);
      }
    }

    const duration = Date.now() - startTime;

    // Log successful sync
    await prisma.syncLog.create({
      data: {
        userId,
        connectionId,
        syncType: 'BILLS',
        status: 'SUCCESS',
        itemsImported: allBills.length,
        duration,
      },
    });

    // Update last sync time
    await prisma.bankConnection.update({
      where: { id: connectionId },
      data: { lastSyncAt: new Date() },
    });

    return allBills;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log failed sync
    await prisma.syncLog.create({
      data: {
        userId,
        connectionId,
        syncType: 'BILLS',
        status: 'ERROR',
        itemsImported: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        duration,
      },
    });

    throw error;
  }
}

/**
 * Map bill type from Pluggy to our category
 */
export function mapBillTypeToCategory(billType: string): string {
  const categoryMap: Record<string, string> = {
    'ELECTRICITY': 'Luz',
    'WATER': 'Água',
    'INTERNET': 'Internet',
    'PHONE': 'Telefone',
    'MOBILE_PHONE': 'Telefone',
    'CREDIT_CARD': 'Cartão de Crédito',
    'RENT': 'Aluguel',
    'CONDOMINIUM': 'Condomínio',
    'GAS': 'Gás',
    'TV': 'TV/Streaming',
    'INSURANCE': 'Seguro',
    'OTHER': 'Outros',
  };

  return categoryMap[billType] || 'Outros';
}

/**
 * Import bills as expenses into our database
 */
export async function importBillsAsExpenses(
  bills: any[],
  userId: string,
  connectionId: string
) {
  const imported: string[] = [];
  const skipped: string[] = [];

  for (const bill of bills) {
    try {
      // Check if already imported
      const existing = await prisma.expense.findFirst({
        where: {
          userId,
          externalId: bill.id,
        },
      });

      if (existing) {
        skipped.push(bill.id);
        continue;
      }

      // Create expense
      await prisma.expense.create({
        data: {
          userId,
          title: bill.description || 'Boleto importado',
          amount: bill.amount || 0,
          category: mapBillTypeToCategory(bill.type),
          date: bill.dueDate ? new Date(bill.dueDate) : new Date(),
          description: bill.description,
          source: 'OPEN_FINANCE',
          externalId: bill.id,
          barcode: bill.barcode,
          isPaid: bill.isPaid || false,
          paidDate: bill.paidDate ? new Date(bill.paidDate) : null,
          connectionId,
        },
      });

      imported.push(bill.id);
    } catch (error) {
      console.error(`Failed to import bill ${bill.id}:`, error);
      skipped.push(bill.id);
    }
  }

  return {
    imported: imported.length,
    skipped: skipped.length,
    total: bills.length,
  };
}
