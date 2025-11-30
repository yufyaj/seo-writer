'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  saveSchedule,
  type SerializedSchedule,
} from '@/lib/schedule/actions'
import {
  scheduleTypes,
  daysOfWeek,
  hours,
  type ScheduleType,
} from '@/lib/schedule/validation'

type Props = {
  profileId: string
  schedule?: SerializedSchedule | null
}

const scheduleTypeLabels: Record<ScheduleType, string> = {
  none: 'スケジュールなし（手動のみ）',
  daily: '毎日',
  weekly: '毎週',
}

const dayOfWeekLabels: Record<number, string> = {
  1: '月曜日',
  2: '火曜日',
  3: '水曜日',
  4: '木曜日',
  5: '金曜日',
  6: '土曜日',
  7: '日曜日',
}

export function ScheduleForm({ profileId, schedule }: Props) {
  const router = useRouter()

  // フォーム状態
  const [scheduleType, setScheduleType] = useState<ScheduleType>(
    (schedule?.schedule_type as ScheduleType) ?? 'none'
  )
  const [dailyHour, setDailyHour] = useState<number | ''>(
    schedule?.daily_hour ?? ''
  )
  const [weeklyDayOfWeek, setWeeklyDayOfWeek] = useState<number | ''>(
    schedule?.weekly_day_of_week ?? ''
  )
  const [weeklyHour, setWeeklyHour] = useState<number | ''>(
    schedule?.weekly_hour ?? ''
  )
  const [isEnabled, setIsEnabled] = useState(schedule?.is_enabled ?? false)

  // UI状態
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setIsLoading(true)

    try {
      const result = await saveSchedule({
        post_profile_id: profileId,
        schedule_type: scheduleType,
        daily_hour: dailyHour !== '' ? Number(dailyHour) : null,
        weekly_day_of_week:
          weeklyDayOfWeek !== '' ? Number(weeklyDayOfWeek) : null,
        weekly_hour: weeklyHour !== '' ? Number(weeklyHour) : null,
        is_enabled: isEnabled,
      })

      if (result.success) {
        router.push(`/dashboard/profiles/${profileId}/schedule`)
        router.refresh()
      } else {
        setError(result.error)
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors)
        }
      }
    } catch {
      setError('予期しないエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* スケジュールタイプ */}
      <div>
        <label htmlFor="schedule_type" className="block text-sm font-medium">
          スケジュールタイプ <span className="text-red-500">*</span>
        </label>
        <select
          id="schedule_type"
          value={scheduleType}
          onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          disabled={isLoading}
        >
          {scheduleTypes.map((type) => (
            <option key={type} value={type}>
              {scheduleTypeLabels[type]}
            </option>
          ))}
        </select>
        {fieldErrors.schedule_type && (
          <p className="mt-1 text-sm text-red-600">
            {fieldErrors.schedule_type[0]}
          </p>
        )}
      </div>

      {/* Daily設定 */}
      {scheduleType === 'daily' && (
        <div>
          <label htmlFor="daily_hour" className="block text-sm font-medium">
            実行時刻 <span className="text-red-500">*</span>
          </label>
          <select
            id="daily_hour"
            value={dailyHour}
            onChange={(e) =>
              setDailyHour(e.target.value !== '' ? Number(e.target.value) : '')
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            disabled={isLoading}
          >
            <option value="">選択してください</option>
            {hours.map((hour) => (
              <option key={hour} value={hour}>
                {hour}時
              </option>
            ))}
          </select>
          {fieldErrors.daily_hour && (
            <p className="mt-1 text-sm text-red-600">
              {fieldErrors.daily_hour[0]}
            </p>
          )}
        </div>
      )}

      {/* Weekly設定 */}
      {scheduleType === 'weekly' && (
        <>
          <div>
            <label
              htmlFor="weekly_day_of_week"
              className="block text-sm font-medium"
            >
              曜日 <span className="text-red-500">*</span>
            </label>
            <select
              id="weekly_day_of_week"
              value={weeklyDayOfWeek}
              onChange={(e) =>
                setWeeklyDayOfWeek(
                  e.target.value !== '' ? Number(e.target.value) : ''
                )
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              disabled={isLoading}
            >
              <option value="">選択してください</option>
              {daysOfWeek.map((day) => (
                <option key={day} value={day}>
                  {dayOfWeekLabels[day]}
                </option>
              ))}
            </select>
            {fieldErrors.weekly_day_of_week && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.weekly_day_of_week[0]}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="weekly_hour" className="block text-sm font-medium">
              実行時刻 <span className="text-red-500">*</span>
            </label>
            <select
              id="weekly_hour"
              value={weeklyHour}
              onChange={(e) =>
                setWeeklyHour(
                  e.target.value !== '' ? Number(e.target.value) : ''
                )
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              disabled={isLoading}
            >
              <option value="">選択してください</option>
              {hours.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}時
                </option>
              ))}
            </select>
            {fieldErrors.weekly_hour && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.weekly_hour[0]}
              </p>
            )}
          </div>
        </>
      )}

      {/* 有効フラグ */}
      {scheduleType !== 'none' && (
        <div className="flex items-center gap-2">
          <input
            id="is_enabled"
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
            disabled={isLoading}
          />
          <label htmlFor="is_enabled" className="text-sm font-medium">
            スケジュールを有効にする
          </label>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      {/* ボタン */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? '保存中...' : '保存する'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}
