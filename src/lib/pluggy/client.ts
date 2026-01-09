/**
 * Pluggy Client Configuration
 * This is a placeholder for Pluggy SDK integration
 * Install with: npm install pluggy-sdk (when available)
 */

export interface PluggyClientConfig {
  clientId: string;
  clientSecret: string;
  environment?: 'sandbox' | 'production';
}

export interface PluggyClient {
  createConnectToken: (options?: any) => Promise<{ accessToken: string }>;
  fetchAccounts: (itemId: string) => Promise<any[]>;
  fetchPaymentInvoices: (accountId: string) => Promise<any[]>;
  deleteItem: (itemId: string) => Promise<void>;
}

/**
 * Create a Pluggy client instance
 * Note: This is a placeholder. Install pluggy-sdk for actual implementation
 */
export function createPluggyClient(): PluggyClient {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;
  const environment = process.env.PLUGGY_ENVIRONMENT || 'sandbox';

  if (!clientId || !clientSecret) {
    console.warn('PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET not set. Using mock client.');
  }

  // Placeholder implementation
  // Replace with: import { PluggyClient } from 'pluggy-sdk';
  // return new PluggyClient({ clientId, clientSecret, environment });
  
  return {
    createConnectToken: async (options?: any) => {
      throw new Error('Pluggy SDK not installed. Please install pluggy-sdk package.');
    },
    fetchAccounts: async (itemId: string) => {
      throw new Error('Pluggy SDK not installed. Please install pluggy-sdk package.');
    },
    fetchPaymentInvoices: async (accountId: string) => {
      throw new Error('Pluggy SDK not installed. Please install pluggy-sdk package.');
    },
    deleteItem: async (itemId: string) => {
      throw new Error('Pluggy SDK not installed. Please install pluggy-sdk package.');
    },
  };
}

/**
 * Singleton instance of Pluggy client
 */
let pluggyInstance: PluggyClient | null = null;

/**
 * Get or create Pluggy client instance
 */
export function getPluggyClient(): PluggyClient {
  if (!pluggyInstance) {
    pluggyInstance = createPluggyClient();
  }
  return pluggyInstance;
}

/**
 * Reset Pluggy client instance (useful for testing)
 */
export function resetPluggyClient() {
  pluggyInstance = null;
}

// Export default instance getter
export const pluggy = {
  get client() {
    return getPluggyClient();
  }
};
