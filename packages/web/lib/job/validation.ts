import { z } from 'zod'

/**
 * ジョブトリガータイプの定義
 */
export const triggerTypes = ['manual', 'scheduler'] as const
export type TriggerType = (typeof triggerTypes)[number]

/**
 * ジョブステータスの定義
 */
export const jobStatuses = [
  'running',
  'success',
  'partial_failed',
  'failed',
] as const
export type JobStatus = (typeof jobStatuses)[number]

/**
 * ジョブアイテムステータスの定義
 */
export const jobItemStatuses = ['success', 'failed'] as const
export type JobItemStatus = (typeof jobItemStatuses)[number]

/**
 * ジョブ作成のバリデーションスキーマ
 */
export const jobCreateSchema = z.object({
  post_profile_id: z.string().min(1, 'プロファイルIDが必要です'),
  trigger_type: z.enum(triggerTypes, {
    message: 'トリガータイプを選択してください',
  }),
})

export type JobCreateInput = z.infer<typeof jobCreateSchema>

/**
 * ジョブアイテム作成のバリデーションスキーマ
 */
export const jobItemCreateSchema = z.object({
  job_id: z.string().min(1, 'ジョブIDが必要です'),
  post_profile_id: z.string().min(1, 'プロファイルIDが必要です'),
  post_profile_article_type_id: z.string().min(1, '記事タイプIDが必要です'),
  keyword: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  wp_post_id: z.number().optional().nullable(),
  wp_post_url: z.string().url('有効なURLを入力してください').optional().nullable(),
  wp_media_id: z.number().optional().nullable(),
  status: z.enum(jobItemStatuses, {
    message: 'ステータスを選択してください',
  }),
  error_message: z.string().optional().nullable(),
})

export type JobItemCreateInput = z.infer<typeof jobItemCreateSchema>

/**
 * 記事生成リクエストのバリデーションスキーマ
 */
export const generateArticleRequestSchema = z.object({
  postProfileId: z.bigint({ coerce: true }),
  articleTypeId: z.bigint({ coerce: true }),
  triggerType: z.enum(triggerTypes),
})

export type GenerateArticleRequest = z.infer<typeof generateArticleRequestSchema>

/**
 * 生成された記事のスキーマ（Gemini APIからの出力）
 */
export const generatedArticleSchema = z.object({
  title: z.string().min(1, 'タイトルが必要です'),
  content: z.string().min(1, '本文が必要です'),
  meta_description: z.string().optional(),
  excerpt: z.string().optional(),
})

export type GeneratedArticle = z.infer<typeof generatedArticleSchema>
