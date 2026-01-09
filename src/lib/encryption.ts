import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment variable
 * @throws {Error} if ENCRYPTION_KEY is not set
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  
  // Key should be 64 hex characters (32 bytes)
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a string using AES-256-GCM
 * @param text - Plain text to encrypt
 * @returns Object containing encrypted data, IV, and auth tag
 */
export function encrypt(text: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16); // 128 bits IV for GCM
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt data encrypted with AES-256-GCM
 * @param encrypted - Encrypted data in hex format
 * @param iv - Initialization vector in hex format
 * @param tag - Authentication tag in hex format
 * @returns Decrypted plain text
 */
export function decrypt(encrypted: string, iv: string, tag: string): string {
  try {
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a new encryption key (for setup purposes)
 * Use this in development: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Encrypt sensitive bank connection data
 */
export function encryptBankToken(accessToken: string) {
  return encrypt(accessToken);
}

/**
 * Decrypt bank connection token
 */
export function decryptBankToken(encrypted: string, iv: string, tag: string): string {
  return decrypt(encrypted, iv, tag);
}
