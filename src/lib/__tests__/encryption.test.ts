import { encrypt, decrypt, generateEncryptionKey, encryptBankToken, decryptBankToken } from '../encryption';

// Mock environment variable
const originalEnv = process.env.ENCRYPTION_KEY;

describe('Encryption Module', () => {
  beforeAll(() => {
    // Generate a test key for all tests
    process.env.ENCRYPTION_KEY = generateEncryptionKey();
  });

  afterAll(() => {
    // Restore original env
    process.env.ENCRYPTION_KEY = originalEnv;
  });

  describe('generateEncryptionKey', () => {
    it('should generate a 64-character hex string', () => {
      const key = generateEncryptionKey();
      expect(key).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(key)).toBe(true);
    });

    it('should generate different keys each time', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a simple string', () => {
      const plainText = 'Hello, World!';
      const { encrypted, iv, tag } = encrypt(plainText);

      expect(encrypted).toBeTruthy();
      expect(iv).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(tag).toHaveLength(32); // 16 bytes = 32 hex chars

      const decrypted = decrypt(encrypted, iv, tag);
      expect(decrypted).toBe(plainText);
    });

    it('should encrypt and decrypt a complex access token', () => {
      const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      const { encrypted, iv, tag } = encrypt(accessToken);
      const decrypted = decrypt(encrypted, iv, tag);
      
      expect(decrypted).toBe(accessToken);
    });

    it('should encrypt and decrypt special characters', () => {
      const text = 'Special chars: !@#$%^&*()_+-=[]{}|;:",.<>?/~`ãõéü';
      
      const { encrypted, iv, tag } = encrypt(text);
      const decrypted = decrypt(encrypted, iv, tag);
      
      expect(decrypted).toBe(text);
    });

    it('should produce different encrypted values for same input', () => {
      const text = 'Same text';
      
      const result1 = encrypt(text);
      const result2 = encrypt(text);
      
      // Different IVs should produce different encrypted values
      expect(result1.iv).not.toBe(result2.iv);
      expect(result1.encrypted).not.toBe(result2.encrypted);
      
      // But both should decrypt to the same value
      expect(decrypt(result1.encrypted, result1.iv, result1.tag)).toBe(text);
      expect(decrypt(result2.encrypted, result2.iv, result2.tag)).toBe(text);
    });

    it('should throw error with invalid auth tag', () => {
      const text = 'Test';
      const { encrypted, iv } = encrypt(text);
      const invalidTag = '0'.repeat(32);
      
      expect(() => {
        decrypt(encrypted, iv, invalidTag);
      }).toThrow();
    });

    it('should throw error with wrong IV', () => {
      const text = 'Test';
      const { encrypted, tag } = encrypt(text);
      const wrongIV = '0'.repeat(32);
      
      expect(() => {
        decrypt(encrypted, wrongIV, tag);
      }).toThrow();
    });

    it('should throw error with modified encrypted data', () => {
      const text = 'Test';
      const { encrypted, iv, tag } = encrypt(text);
      
      // Modify encrypted data
      const modifiedEncrypted = encrypted.substring(0, encrypted.length - 2) + '00';
      
      expect(() => {
        decrypt(modifiedEncrypted, iv, tag);
      }).toThrow();
    });
  });

  describe('encryptBankToken and decryptBankToken', () => {
    it('should encrypt and decrypt bank access token', () => {
      const accessToken = 'pluggy_access_token_abc123xyz789';
      
      const { encrypted, iv, tag } = encryptBankToken(accessToken);
      const decrypted = decryptBankToken(encrypted, iv, tag);
      
      expect(decrypted).toBe(accessToken);
    });

    it('should handle long bank tokens', () => {
      const longToken = 'a'.repeat(500);
      
      const { encrypted, iv, tag } = encryptBankToken(longToken);
      const decrypted = decryptBankToken(encrypted, iv, tag);
      
      expect(decrypted).toBe(longToken);
    });
  });

  describe('Error handling', () => {
    it('should throw error when ENCRYPTION_KEY is not set', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;
      
      expect(() => {
        encrypt('test');
      }).toThrow('ENCRYPTION_KEY environment variable is not set');
      
      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should throw error when ENCRYPTION_KEY has wrong length', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = 'tooshort';
      
      expect(() => {
        encrypt('test');
      }).toThrow('ENCRYPTION_KEY must be 64 hex characters');
      
      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should throw error with descriptive message on encryption failure', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = 'invalid_hex_key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      
      expect(() => {
        encrypt('test');
      }).toThrow('Encryption failed');
      
      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should throw error with descriptive message on decryption failure', () => {
      expect(() => {
        decrypt('invalid', 'invalid', 'invalid');
      }).toThrow('Decryption failed');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      const { encrypted, iv, tag } = encrypt('');
      const decrypted = decrypt(encrypted, iv, tag);
      expect(decrypted).toBe('');
    });

    it('should handle very long strings', () => {
      const longText = 'x'.repeat(10000);
      const { encrypted, iv, tag } = encrypt(longText);
      const decrypted = decrypt(encrypted, iv, tag);
      expect(decrypted).toBe(longText);
    });

    it('should handle unicode characters', () => {
      const unicode = '你好世界 🌍 مرحبا العالم Здравствуй мир';
      const { encrypted, iv, tag } = encrypt(unicode);
      const decrypted = decrypt(encrypted, iv, tag);
      expect(decrypted).toBe(unicode);
    });
  });
});
