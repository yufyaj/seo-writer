import {
  scheduleSchema,
  scheduleTypes,
  daysOfWeek,
  type ScheduleInput,
} from '@/lib/schedule/validation'

describe('scheduleSchema', () => {
  const baseInput: ScheduleInput = {
    post_profile_id: '1',
    schedule_type: 'none',
    daily_time: null,
    weekly_day_of_week: null,
    weekly_time: null,
    cron_expression: null,
    is_enabled: false,
  }

  describe('schedule_type: none', () => {
    it('有効な入力を受け入れる', () => {
      const result = scheduleSchema.safeParse(baseInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.schedule_type).toBe('none')
        expect(result.data.is_enabled).toBe(false)
      }
    })

    it('is_enabledがtrueでも受け入れる', () => {
      const input = { ...baseInput, is_enabled: true }
      const result = scheduleSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })

  describe('schedule_type: daily', () => {
    it('daily_timeが設定されていれば受け入れる', () => {
      const input = {
        ...baseInput,
        schedule_type: 'daily' as const,
        daily_time: '09:00',
      }
      const result = scheduleSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('daily_timeがなければ拒否', () => {
      const input = {
        ...baseInput,
        schedule_type: 'daily' as const,
        daily_time: null,
      }
      const result = scheduleSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        const dailyTimeError = result.error.issues.find(
          (issue) => issue.path[0] === 'daily_time'
        )
        expect(dailyTimeError?.message).toBe(
          '毎日実行の場合は実行時刻を指定してください'
        )
      }
    })

    it('不正な時刻形式を拒否', () => {
      const input = {
        ...baseInput,
        schedule_type: 'daily' as const,
        daily_time: '25:00',
      }
      const result = scheduleSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('有効な時刻形式を受け入れる（00:00〜23:59）', () => {
      const validTimes = ['00:00', '09:30', '12:00', '23:59']
      validTimes.forEach((time) => {
        const input = {
          ...baseInput,
          schedule_type: 'daily' as const,
          daily_time: time,
        }
        const result = scheduleSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('schedule_type: weekly', () => {
    it('weekly_day_of_weekとweekly_timeが設定されていれば受け入れる', () => {
      const input = {
        ...baseInput,
        schedule_type: 'weekly' as const,
        weekly_day_of_week: 1,
        weekly_time: '10:00',
      }
      const result = scheduleSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('weekly_day_of_weekがなければ拒否', () => {
      const input = {
        ...baseInput,
        schedule_type: 'weekly' as const,
        weekly_day_of_week: null,
        weekly_time: '10:00',
      }
      const result = scheduleSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = result.error.issues.find(
          (issue) => issue.path[0] === 'weekly_day_of_week'
        )
        expect(error?.message).toBe('毎週実行の場合は曜日を指定してください')
      }
    })

    it('weekly_timeがなければ拒否', () => {
      const input = {
        ...baseInput,
        schedule_type: 'weekly' as const,
        weekly_day_of_week: 1,
        weekly_time: null,
      }
      const result = scheduleSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = result.error.issues.find(
          (issue) => issue.path[0] === 'weekly_time'
        )
        expect(error?.message).toBe(
          '毎週実行の場合は実行時刻を指定してください'
        )
      }
    })

    it('曜日1〜7を受け入れる', () => {
      daysOfWeek.forEach((day) => {
        const input = {
          ...baseInput,
          schedule_type: 'weekly' as const,
          weekly_day_of_week: day,
          weekly_time: '10:00',
        }
        const result = scheduleSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })

    it('曜日0を拒否', () => {
      const input = {
        ...baseInput,
        schedule_type: 'weekly' as const,
        weekly_day_of_week: 0,
        weekly_time: '10:00',
      }
      const result = scheduleSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('曜日8を拒否', () => {
      const input = {
        ...baseInput,
        schedule_type: 'weekly' as const,
        weekly_day_of_week: 8,
        weekly_time: '10:00',
      }
      const result = scheduleSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  describe('schedule_type: cron', () => {
    it('cron_expressionが設定されていれば受け入れる', () => {
      const input = {
        ...baseInput,
        schedule_type: 'cron' as const,
        cron_expression: '0 9 * * 1-5',
      }
      const result = scheduleSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('cron_expressionがなければ拒否', () => {
      const input = {
        ...baseInput,
        schedule_type: 'cron' as const,
        cron_expression: null,
      }
      const result = scheduleSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = result.error.issues.find(
          (issue) => issue.path[0] === 'cron_expression'
        )
        expect(error?.message).toBe('cron形式の場合はcron式を指定してください')
      }
    })

    it('空文字のcron_expressionを拒否', () => {
      const input = {
        ...baseInput,
        schedule_type: 'cron' as const,
        cron_expression: '',
      }
      const result = scheduleSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  describe('post_profile_id', () => {
    it('空文字を拒否', () => {
      const input = { ...baseInput, post_profile_id: '' }
      const result = scheduleSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('プロファイルIDが必要です')
      }
    })
  })

  describe('scheduleTypes', () => {
    it('全てのスケジュールタイプが定義されている', () => {
      expect(scheduleTypes).toEqual(['none', 'daily', 'weekly', 'cron'])
    })
  })

  describe('時刻フォーマット', () => {
    const invalidTimes = [
      '9:00', // 1桁の時間
      '09:0', // 1桁の分
      '24:00', // 24時
      '12:60', // 60分
      '12:00:00', // 秒付き
      'abc', // 文字列
      '', // 空文字
    ]

    invalidTimes.forEach((time) => {
      it(`不正な時刻形式「${time}」を拒否`, () => {
        const input = {
          ...baseInput,
          schedule_type: 'daily' as const,
          daily_time: time,
        }
        const result = scheduleSchema.safeParse(input)
        expect(result.success).toBe(false)
      })
    })
  })
})
