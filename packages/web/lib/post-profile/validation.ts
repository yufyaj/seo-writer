import { z } from 'zod'

/**
 * キーワード戦略のバリデーションスキーマ
 */
export const keywordStrategySchema = z.object({
  strategy_concept: z.string().optional().default(''),
  head_middle: z.array(z.string()).optional().default([]),
  transactional_cv: z.array(z.string()).optional().default([]),
  informational_knowhow: z.array(z.string()).optional().default([]),
  business_specific: z.array(z.string()).optional().default([]),
})

/**
 * キーワード戦略の型
 */
export type KeywordStrategy = z.infer<typeof keywordStrategySchema>

/**
 * 空のキーワード戦略を生成
 */
export function createEmptyKeywordStrategy(): KeywordStrategy {
  return {
    strategy_concept: '',
    head_middle: [],
    transactional_cv: [],
    informational_knowhow: [],
    business_specific: [],
  }
}

/**
 * 投稿プロファイルのバリデーションスキーマ（共通）
 */
const postProfileBaseSchema = z.object({
  name: z
    .string()
    .min(1, 'プロファイル名を入力してください')
    .max(255, 'プロファイル名は255文字以内で入力してください'),
  description: z.string().optional().or(z.literal('')),
  wp_category_id: z
    .number()
    .int('カテゴリIDは整数で入力してください')
    .positive('カテゴリIDは正の整数で入力してください')
    .optional()
    .nullable(),
  keyword_strategy: keywordStrategySchema.optional().default(createEmptyKeywordStrategy),
  is_active: z.boolean().optional().default(true),
})

/**
 * 投稿プロファイルの新規作成スキーマ
 */
export const postProfileCreateSchema = postProfileBaseSchema

/**
 * 投稿プロファイルの更新スキーマ
 */
export const postProfileUpdateSchema = postProfileBaseSchema.extend({
  id: z.string().min(1, 'プロファイルIDが必要です'),
})

/**
 * 投稿プロファイルの入力型
 */
export type PostProfileCreateInput = z.infer<typeof postProfileCreateSchema>
export type PostProfileUpdateInput = z.infer<typeof postProfileUpdateSchema>
