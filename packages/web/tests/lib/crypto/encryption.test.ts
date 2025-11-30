import { encrypt, decrypt, generateEncryptionKey } from '@/lib/crypto/encryption'

describe('Encryption', () => {
  const originalEnv = process.env.ENCRYPTION_KEY

  beforeAll(() => {
    // テスト用の暗号化キーを設定（32バイト = 256ビット）
    const testKey = Buffer.from('12345678901234567890123456789012').toString('base64')
    process.env.ENCRYPTION_KEY = testKey
  })

  afterAll(() => {
    process.env.ENCRYPTION_KEY = originalEnv
  })

  describe('generateEncryptionKey', () => {
    it('should generate a valid base64 encoded key', () => {
      const key = generateEncryptionKey()
      expect(typeof key).toBe('string')

      // Base64デコードして32バイトであることを確認
      const decoded = Buffer.from(key, 'base64')
      expect(decoded.length).toBe(32)
    })

    it('should generate unique keys each time', () => {
      const key1 = generateEncryptionKey()
      const key2 = generateEncryptionKey()
      expect(key1).not.toBe(key2)
    })
  })

  describe('encrypt', () => {
    it('should encrypt a string and return base64 encoded result', () => {
      const plaintext = 'Hello, World!'
      const encrypted = encrypt(plaintext)

      expect(typeof encrypted).toBe('string')
      expect(encrypted).not.toBe(plaintext)

      // Base64形式であることを確認
      expect(() => Buffer.from(encrypted, 'base64')).not.toThrow()
    })

    it('should produce different ciphertext for same plaintext (due to random IV)', () => {
      const plaintext = 'Same message'
      const encrypted1 = encrypt(plaintext)
      const encrypted2 = encrypt(plaintext)

      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should handle empty string', () => {
      const encrypted = encrypt('')
      expect(typeof encrypted).toBe('string')
    })

    it('should handle Japanese text', () => {
      const plaintext = 'こんにちは世界'
      const encrypted = encrypt(plaintext)
      expect(typeof encrypted).toBe('string')
      expect(encrypted).not.toBe(plaintext)
    })

    it('should handle special characters', () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const encrypted = encrypt(plaintext)
      expect(typeof encrypted).toBe('string')
    })
  })

  describe('decrypt', () => {
    it('should decrypt an encrypted string back to original', () => {
      const plaintext = 'Hello, World!'
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(plaintext)
    })

    it('should correctly decrypt Japanese text', () => {
      const plaintext = 'こんにちは世界！日本語テスト'
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(plaintext)
    })

    it('should correctly decrypt empty string', () => {
      const plaintext = ''
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(plaintext)
    })

    it('should correctly decrypt long text', () => {
      const plaintext = 'A'.repeat(10000)
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(plaintext)
    })

    it('should throw error for tampered ciphertext', () => {
      const encrypted = encrypt('test')
      const tampered = encrypted.slice(0, -5) + 'XXXXX'

      expect(() => decrypt(tampered)).toThrow()
    })

    it('should throw error for invalid base64', () => {
      expect(() => decrypt('not-valid-base64!!!')).toThrow()
    })
  })

  describe('encrypt/decrypt roundtrip', () => {
    const testCases = [
      'simple text',
      'WordPress App Password: xxxx xxxx xxxx xxxx',
      '日本語のパスワード',
      'émojis: 🔐🔑🔒',
      'mixed: Hello世界123!@#',
      ' leading and trailing spaces ',
      'line\nbreaks\nincluded',
    ]

    testCases.forEach((testCase) => {
      it(`should roundtrip: "${testCase.slice(0, 30)}..."`, () => {
        const encrypted = encrypt(testCase)
        const decrypted = decrypt(encrypted)
        expect(decrypted).toBe(testCase)
      })
    })
  })

  describe('error handling', () => {
    it('should throw error when ENCRYPTION_KEY is not set', () => {
      const originalKey = process.env.ENCRYPTION_KEY
      delete process.env.ENCRYPTION_KEY

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY environment variable is not set')

      process.env.ENCRYPTION_KEY = originalKey
    })

    it('should throw error when ENCRYPTION_KEY is wrong length', () => {
      const originalKey = process.env.ENCRYPTION_KEY
      process.env.ENCRYPTION_KEY = Buffer.from('short').toString('base64')

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must be 32 bytes')

      process.env.ENCRYPTION_KEY = originalKey
    })
  })
})
