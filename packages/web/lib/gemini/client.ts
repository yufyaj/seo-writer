import { GoogleGenAI } from '@google/genai'

/**
 * Gemini APIクライアントのシングルトンインスタンス
 */
let geminiClient: GoogleGenAI | null = null

/**
 * Gemini APIクライアントを取得
 */
export function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set')
    }
    geminiClient = new GoogleGenAI({ apiKey })
  }
  return geminiClient
}

/**
 * テスト用にクライアントをリセット
 */
export function resetGeminiClient(): void {
  geminiClient = null
}

/**
 * テキスト生成用モデル名 (Gemini 3 Pro)
 */
export const TEXT_MODEL = 'gemini-3-pro-preview'

/**
 * 画像生成用モデル名 (Nano Banana Pro / Gemini 3 Pro Image)
 */
export const IMAGE_MODEL = 'gemini-3-pro-image-preview'

/**
 * リトライ設定
 */
export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
}

export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
}

/**
 * エクスポネンシャルバックオフでリトライ
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // レート制限エラー（429）またはサーバーエラー（500, 503）の場合のみリトライ
      const errorMessage = lastError.message.toLowerCase()
      const isRetryable =
        errorMessage.includes('429') ||
        errorMessage.includes('500') ||
        errorMessage.includes('503') ||
        errorMessage.includes('rate') ||
        errorMessage.includes('quota')

      if (!isRetryable) {
        throw lastError
      }

      const backoffMs = Math.min(
        config.initialDelayMs * Math.pow(2, attempt),
        config.maxDelayMs
      )

      console.warn(
        `Gemini API error. Retrying in ${backoffMs}ms... (attempt ${attempt + 1}/${config.maxRetries})`
      )

      await new Promise((resolve) => setTimeout(resolve, backoffMs))
    }
  }

  throw new Error(`Max retries exceeded: ${lastError?.message}`)
}
