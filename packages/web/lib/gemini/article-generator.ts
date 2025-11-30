import { getGeminiClient, TEXT_MODEL, withRetry } from './client'
import {
  generatedArticleSchema,
  type GeneratedArticle,
} from '@/lib/job/validation'

/**
 * 記事生成の入力パラメータ
 */
export interface ArticleGenerationParams {
  /** 会社情報 */
  company: {
    companyName: string
    brandName?: string | null
    aboutText?: string | null
    siteUrl?: string | null
  }
  /** 投稿プロファイル情報 */
  profile: {
    name: string
    description?: string | null
  }
  /** キーワード戦略 */
  keywordStrategy: {
    strategy_concept?: string
    head_middle?: string[]
    transactional_cv?: string[]
    informational_knowhow?: string[]
    business_specific?: string[]
  }
  /** 選択されたキーワード */
  keyword: string
  /** 記事タイプのプロンプトテンプレート */
  promptTemplate: string
}

/**
 * キーワード戦略からランダムにキーワードを選択
 */
export function selectKeyword(
  keywordStrategy: ArticleGenerationParams['keywordStrategy']
): string | null {
  const allKeywords: string[] = [
    ...(keywordStrategy.head_middle || []),
    ...(keywordStrategy.transactional_cv || []),
    ...(keywordStrategy.informational_knowhow || []),
    ...(keywordStrategy.business_specific || []),
  ]

  if (allKeywords.length === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * allKeywords.length)
  return allKeywords[randomIndex]
}

/**
 * 記事生成用のプロンプトを構築
 */
export function buildArticlePrompt(params: ArticleGenerationParams): string {
  const { company, profile, keywordStrategy, keyword, promptTemplate } = params

  const companyInfo = [
    `会社名: ${company.companyName}`,
    company.brandName && `ブランド名: ${company.brandName}`,
    company.aboutText && `会社紹介: ${company.aboutText}`,
    company.siteUrl && `サイトURL: ${company.siteUrl}`,
  ]
    .filter(Boolean)
    .join('\n')

  const strategyInfo = keywordStrategy.strategy_concept
    ? `SEO戦略: ${keywordStrategy.strategy_concept}`
    : ''

  return `
あなたはSEOに精通したプロのWebライターです。
以下の情報を基に、高品質なブログ記事を生成してください。

## 会社情報
${companyInfo}

## 投稿プロファイル
名前: ${profile.name}
${profile.description ? `説明: ${profile.description}` : ''}

## SEO戦略
${strategyInfo}

## ターゲットキーワード
${keyword}

## 記事タイプ・構成指示
${promptTemplate}

## 出力形式
以下のJSON形式で出力してください:
{
  "title": "記事タイトル（SEOを意識した魅力的なタイトル）",
  "content": "記事本文（HTML形式、<h2>, <h3>, <p>, <ul>, <li>などを使用）",
  "meta_description": "160文字以内のメタディスクリプション",
  "excerpt": "記事の要約（100文字程度）"
}

重要:
- 必ず有効なJSONのみを出力してください
- 記事本文はHTML形式で出力してください
- 日本語で執筆してください
- SEOを意識した構成にしてください
- 読者にとって価値のある内容にしてください
- 「お問い合わせはこちら」などのCTAセクションは含めないでください
`.trim()
}

/**
 * Gemini APIを使用して記事を生成
 */
export async function generateArticle(
  params: ArticleGenerationParams
): Promise<GeneratedArticle> {
  const client = getGeminiClient()
  const prompt = buildArticlePrompt(params)

  const result = await withRetry(async () => {
    const response = await client.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    })

    // レスポンスからテキストを取得
    const text = response.text
    if (!text) {
      throw new Error('Empty response from Gemini API')
    }

    return text
  })

  // JSONをパース
  let parsed: unknown
  try {
    parsed = JSON.parse(result)
  } catch {
    throw new Error(`Failed to parse Gemini response as JSON: ${result}`)
  }

  // Zodでバリデーション
  const validated = generatedArticleSchema.safeParse(parsed)
  if (!validated.success) {
    throw new Error(
      `Invalid article format: ${validated.error.issues.map((e) => e.message).join(', ')}`
    )
  }

  return validated.data
}
