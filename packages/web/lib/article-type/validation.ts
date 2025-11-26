import { z } from 'zod'

/**
 * 記事タイプのバリデーションスキーマ（共通）
 */
const articleTypeBaseSchema = z.object({
  name: z
    .string()
    .min(1, '記事タイプ名を入力してください')
    .max(255, '記事タイプ名は255文字以内で入力してください'),
  description: z.string().optional().or(z.literal('')),
  prompt_template: z
    .string()
    .min(1, 'プロンプトテンプレートを入力してください'),
  is_enabled: z.boolean().optional().default(true),
})

/**
 * 記事タイプの新規作成スキーマ
 */
export const articleTypeCreateSchema = articleTypeBaseSchema.extend({
  post_profile_id: z.string().min(1, 'プロファイルIDが必要です'),
})

/**
 * 記事タイプの更新スキーマ
 */
export const articleTypeUpdateSchema = articleTypeBaseSchema.extend({
  id: z.string().min(1, '記事タイプIDが必要です'),
})

/**
 * 記事タイプの入力型
 */
export type ArticleTypeCreateInput = z.infer<typeof articleTypeCreateSchema>
export type ArticleTypeUpdateInput = z.infer<typeof articleTypeUpdateSchema>
