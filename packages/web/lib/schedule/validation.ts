import { z } from 'zod'

/**
 * スケジュールタイプの定義
 */
export const scheduleTypes = ['none', 'daily', 'weekly'] as const
export type ScheduleType = (typeof scheduleTypes)[number]

/**
 * 曜日の定義（1=月曜日〜7=日曜日）
 */
export const daysOfWeek = [1, 2, 3, 4, 5, 6, 7] as const
export type DayOfWeek = (typeof daysOfWeek)[number]

/**
 * 実行時間（0-23時）
 */
export const hours = Array.from({ length: 24 }, (_, i) => i) as number[]

/**
 * 時刻のバリデーション（0-23の整数）
 */
const hourSchema = z
  .number()
  .int()
  .min(0, '時刻は0〜23で指定してください')
  .max(23, '時刻は0〜23で指定してください')
  .optional()
  .nullable()

/**
 * スケジュールのバリデーションスキーマ
 */
export const scheduleSchema = z
  .object({
    post_profile_id: z.string().min(1, 'プロファイルIDが必要です'),
    schedule_type: z.enum(scheduleTypes, {
      message: 'スケジュールタイプを選択してください',
    }),
    daily_hour: hourSchema,
    weekly_day_of_week: z
      .number()
      .int()
      .min(1, '曜日は1〜7で指定してください')
      .max(7, '曜日は1〜7で指定してください')
      .optional()
      .nullable(),
    weekly_hour: hourSchema,
    is_enabled: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    // dailyの場合はdaily_hourが必須
    if (data.schedule_type === 'daily' && data.daily_hour === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '毎日実行の場合は実行時刻を指定してください',
        path: ['daily_hour'],
      })
    }

    // weeklyの場合はweekly_day_of_weekとweekly_hourが必須
    if (data.schedule_type === 'weekly') {
      if (!data.weekly_day_of_week) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '毎週実行の場合は曜日を指定してください',
          path: ['weekly_day_of_week'],
        })
      }
      if (data.weekly_hour === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '毎週実行の場合は実行時刻を指定してください',
          path: ['weekly_hour'],
        })
      }
    }
  })

/**
 * スケジュールの入力型
 */
export type ScheduleInput = z.infer<typeof scheduleSchema>
