// @google/genaiをモック（ESMモジュールのため）
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn(),
    },
  })),
}))

import {
  getGeminiClient,
  resetGeminiClient,
  TEXT_MODEL,
  IMAGE_MODEL,
  withRetry,
  defaultRetryConfig,
  type RetryConfig,
} from '@/lib/gemini/client'

describe('Gemini Client', () => {
  const originalEnv = process.env.GEMINI_API_KEY

  beforeEach(() => {
    resetGeminiClient()
  })

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalEnv
    resetGeminiClient()
  })

  describe('getGeminiClient', () => {
    it('should throw error when GEMINI_API_KEY is not set', () => {
      delete process.env.GEMINI_API_KEY

      expect(() => getGeminiClient()).toThrow(
        'GEMINI_API_KEY environment variable is not set'
      )
    })

    it('should return a client when API key is set', () => {
      process.env.GEMINI_API_KEY = 'test-api-key'

      const client = getGeminiClient()
      expect(client).toBeDefined()
    })

    it('should return the same instance on multiple calls (singleton)', () => {
      process.env.GEMINI_API_KEY = 'test-api-key'

      const client1 = getGeminiClient()
      const client2 = getGeminiClient()

      expect(client1).toBe(client2)
    })
  })

  describe('resetGeminiClient', () => {
    it('should reset the client instance', () => {
      process.env.GEMINI_API_KEY = 'test-api-key'

      const client1 = getGeminiClient()
      resetGeminiClient()
      const client2 = getGeminiClient()

      expect(client1).not.toBe(client2)
    })
  })

  describe('model constants', () => {
    it('should have correct TEXT_MODEL', () => {
      expect(TEXT_MODEL).toBe('gemini-2.0-flash')
    })

    it('should have correct IMAGE_MODEL', () => {
      expect(IMAGE_MODEL).toBe('gemini-2.5-flash-image')
    })
  })

  describe('defaultRetryConfig', () => {
    it('should have expected default values', () => {
      expect(defaultRetryConfig.maxRetries).toBe(3)
      expect(defaultRetryConfig.initialDelayMs).toBe(1000)
      expect(defaultRetryConfig.maxDelayMs).toBe(10000)
    })
  })

  describe('withRetry', () => {
    const fastConfig: RetryConfig = {
      maxRetries: 3,
      initialDelayMs: 10,
      maxDelayMs: 100,
    }

    it('should return result on success', async () => {
      const fn = jest.fn().mockResolvedValue('success')

      const result = await withRetry(fn, fastConfig)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on rate limit error (429)', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Error 429: Rate limit exceeded'))
        .mockResolvedValueOnce('success')

      const result = await withRetry(fn, fastConfig)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should retry on server error (500)', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Error 500: Internal server error'))
        .mockResolvedValueOnce('success')

      const result = await withRetry(fn, fastConfig)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should retry on service unavailable (503)', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Error 503: Service unavailable'))
        .mockResolvedValueOnce('success')

      const result = await withRetry(fn, fastConfig)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should retry on quota exceeded error', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Quota exceeded'))
        .mockResolvedValueOnce('success')

      const result = await withRetry(fn, fastConfig)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should NOT retry on non-retryable errors', async () => {
      const fn = jest
        .fn()
        .mockRejectedValue(new Error('Invalid API key'))

      await expect(withRetry(fn, fastConfig)).rejects.toThrow('Invalid API key')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should throw after max retries exceeded', async () => {
      const fn = jest
        .fn()
        .mockRejectedValue(new Error('Error 429: Rate limit'))

      await expect(withRetry(fn, fastConfig)).rejects.toThrow(
        'Max retries exceeded'
      )
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should handle non-Error objects', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce('string error')
        .mockResolvedValueOnce('success')

      // String errorはretryableではないので即座にthrow
      await expect(withRetry(fn, fastConfig)).rejects.toThrow('string error')
    })

    it('should use custom retry config', async () => {
      const customConfig: RetryConfig = {
        maxRetries: 2,
        initialDelayMs: 5,
        maxDelayMs: 50,
      }

      const fn = jest
        .fn()
        .mockRejectedValue(new Error('Error 429'))

      await expect(withRetry(fn, customConfig)).rejects.toThrow()
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })
})
