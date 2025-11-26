'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  toggleScheduleEnabled,
  deleteSchedule,
  type SerializedSchedule,
} from '@/lib/schedule/actions'
import type { ScheduleType } from '@/lib/schedule/validation'

type Props = {
  profileId: string
  schedule: SerializedSchedule | null
}

const scheduleTypeLabels: Record<ScheduleType, string> = {
  none: 'スケジュールなし',
  daily: '毎日',
  weekly: '毎週',
  cron: 'cron形式',
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

function formatScheduleDescription(schedule: SerializedSchedule): string {
  const type = schedule.schedule_type as ScheduleType

  switch (type) {
    case 'none':
      return '手動実行のみ'
    case 'daily':
      return `毎日 ${schedule.daily_time} に実行`
    case 'weekly':
      return `毎週 ${dayOfWeekLabels[schedule.weekly_day_of_week ?? 1]} ${schedule.weekly_time} に実行`
    case 'cron':
      return `cron: ${schedule.cron_expression}`
    default:
      return '不明'
  }
}

export function ScheduleDisplay({ profileId, schedule }: Props) {
  const [currentSchedule, setCurrentSchedule] = useState(schedule)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleToggleEnabled = async () => {
    if (!currentSchedule) return

    setIsLoading(true)
    setError('')

    try {
      const result = await toggleScheduleEnabled(profileId)
      if (result.success && result.data) {
        setCurrentSchedule(result.data)
      } else if (!result.success) {
        setError(result.error)
      }
    } catch {
      setError('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!currentSchedule) return
    if (!confirm('スケジュールを削除してもよろしいですか？')) return

    setIsLoading(true)
    setError('')

    try {
      const result = await deleteSchedule(profileId)
      if (result.success) {
        setCurrentSchedule(null)
      } else {
        setError(result.error)
      }
    } catch {
      setError('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  if (!currentSchedule) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="mb-4 text-gray-500">スケジュールが設定されていません</p>
          <Link
            href={`/dashboard/profiles/${profileId}/schedule/edit`}
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            スケジュールを設定する
          </Link>
        </div>
      </div>
    )
  }

  const scheduleType = currentSchedule.schedule_type as ScheduleType

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">現在のスケジュール</h3>
          <div className="flex items-center gap-2">
            {scheduleType !== 'none' && (
              <button
                onClick={handleToggleEnabled}
                disabled={isLoading}
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                  currentSchedule.is_enabled
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {currentSchedule.is_enabled ? '有効' : '無効'}
              </button>
            )}
          </div>
        </div>

        <dl className="space-y-3">
          <div className="flex">
            <dt className="w-32 flex-shrink-0 text-sm font-medium text-gray-500">
              タイプ
            </dt>
            <dd className="text-sm text-gray-900">
              {scheduleTypeLabels[scheduleType]}
            </dd>
          </div>
          <div className="flex">
            <dt className="w-32 flex-shrink-0 text-sm font-medium text-gray-500">
              説明
            </dt>
            <dd className="text-sm text-gray-900">
              {formatScheduleDescription(currentSchedule)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex gap-2">
          <Link
            href={`/dashboard/profiles/${profileId}/schedule/edit`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            編集
          </Link>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  )
}
