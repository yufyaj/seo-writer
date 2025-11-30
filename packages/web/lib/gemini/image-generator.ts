import { getGeminiClient, IMAGE_MODEL, withRetry } from './client'

/**
 * 画像生成の入力パラメータ
 */
export interface ImageGenerationParams {
  /** 記事タイトル */
  title: string
  /** 記事本文（要約用） */
  content: string
  /** キーワード */
  keyword?: string
}

/**
 * 画像生成の結果
 */
export interface GeneratedImage {
  /** Base64エンコードされた画像データ */
  data: string
  /** MIMEタイプ */
  mimeType: string
}

/**
 * 記事内容からアイキャッチ画像用のプロンプトを生成
 */
export function buildImagePrompt(params: ImageGenerationParams): string {
  const { title, content, keyword } = params

  // 本文から最初の200文字程度を抽出（HTMLタグを除去）
  const plainText = content
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)

  return `
プロフェッショナルなブログのアイキャッチ画像を生成してください。

記事タイトル: ${title}
${keyword ? `キーワード: ${keyword}` : ''}
記事の概要: ${plainText}

要件:
- モダンでクリーンなデザイン
- 明るく前向きな印象
- プロフェッショナルなビジネスブログに適したスタイル
- テキストは含めない（画像のみ）
- 16:9のアスペクト比に適した構図
`.trim()
}

/**
 * Gemini API（Nano Banana Pro）を使用してアイキャッチ画像を生成
 */
export async function generateImage(
  params: ImageGenerationParams
): Promise<GeneratedImage> {
  const client = getGeminiClient()
  const prompt = buildImagePrompt(params)

  const result = await withRetry(async () => {
    const response = await client.models.generateContent({
      model: IMAGE_MODEL,
      contents: prompt,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '16:9',
        },
      },
    })

    // レスポンスから画像データを取得
    const candidates = response.candidates
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidates in Gemini image response')
    }

    const content = candidates[0].content
    if (!content || !content.parts || content.parts.length === 0) {
      throw new Error('No content parts in Gemini image response')
    }

    // 画像パートを探す
    for (const part of content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return {
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png',
        }
      }
    }

    throw new Error('No image data found in Gemini response')
  })

  return result
}

/**
 * Base64画像データをBufferに変換
 */
export function base64ToBuffer(base64Data: string): Buffer {
  return Buffer.from(base64Data, 'base64')
}
