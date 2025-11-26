import { z } from 'zod'

/**
 * スケジュールタイプの定義
 */
export const scheduleTypes = ['none', 'daily', 'weekly', 'cron'] as const
export type ScheduleType = (typeof scheduleTypes)[number]

/**
 * 曜日の定義（1=月曜日〜7=日曜日）
 */
export const daysOfWeek = [1, 2, 3, 4, 5, 6, 7] as const
export type DayOfWeek = (typeof daysOfWeek)[number]

/**
 * 時刻のバリデーション（HH:MM形式）
 */
const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, '時刻はHH:MM形式で入力してください')
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
    daily_time: timeSchema,
    weekly_day_of_week: z
      .number()
      .int()
      .min(1, '曜日は1〜7で指定してください')
      .max(7, '曜日は1〜7で指定してください')
      .optional()
      .nullable(),
    weekly_time: timeSchema,
    cron_expression: z.string().optional().nullable(),
    is_enabled: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    // dailyの場合はdaily_timeが必須
    if (data.schedule_type === 'daily' && !data.daily_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '毎日実行の場合は実行時刻を指定してください',
        path: ['daily_time'],
      })
    }

    // weeklyの場合はweekly_day_of_weekとweekly_timeが必須
    if (data.schedule_type === 'weekly') {
      if (!data.weekly_day_of_week) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '毎週実行の場合は曜日を指定してください',
          path: ['weekly_day_of_week'],
        })
      }
      if (!data.weekly_time) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '毎週実行の場合は実行時刻を指定してください',
          path: ['weekly_time'],
        })
      }
    }

    // cronの場合はcron_expressionが必須
    if (data.schedule_type === 'cron' && !data.cron_expression) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'cron形式の場合はcron式を指定してください',
        path: ['cron_expression'],
      })
    }
  })

/**
 * スケジュールの入力型
 */
export type ScheduleInput = z.infer<typeof scheduleSchema>
