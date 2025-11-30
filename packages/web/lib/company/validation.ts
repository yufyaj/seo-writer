import { z } from 'zod'

/**
 * WordPress投稿ステータスの許可値
 */
export const wpStatusValues = ['draft', 'publish', 'pending', 'private'] as const
export type WpStatus = (typeof wpStatusValues)[number]

/**
 * 会社設定のバリデーションスキーマ（共通）
 */
const companyBaseSchema = z.object({
  company_name: z
    .string()
    .min(1, '会社名を入力してください')
    .max(255, '会社名は255文字以内で入力してください'),
  brand_name: z
    .string()
    .max(255, 'ブランド名は255文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  about_text: z.string().optional().or(z.literal('')),
  site_url: z
    .string()
    .url('有効なURLを入力してください')
    .max(255, 'URLは255文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  wp_base_url: z
    .string()
    .min(1, 'WordPress URLを入力してください')
    .url('有効なURLを入力してください')
    .max(255, 'URLは255文字以内で入力してください'),
  wp_username: z
    .string()
    .min(1, 'WordPressユーザー名を入力してください')
    .max(255, 'ユーザー名は255文字以内で入力してください'),
  wp_default_status: z
    .enum(wpStatusValues, {
      error: '有効なステータスを選択してください',
    })
    .default('draft'),
})

/**
 * 会社設定の新規作成スキーマ（アプリパスワード必須）
 */
export const companyCreateSchema = companyBaseSchema.extend({
  wp_app_password: z
    .string()
    .min(1, 'WordPressアプリパスワードを入力してください'),
})

/**
 * 会社設定の更新スキーマ（アプリパスワード任意）
 */
export const companyUpdateSchema = companyBaseSchema.extend({
  wp_app_password: z.string().optional().or(z.literal('')),
})

/**
 * 会社設定の入力型
 */
export type CompanyCreateInput = z.infer<typeof companyCreateSchema>
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>
