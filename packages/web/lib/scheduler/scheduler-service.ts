import { prisma } from '@/lib/prisma'
import { articleGenerationService } from '@/lib/job/article-generation-service'
import type { ScheduleType } from '@/lib/schedule/validation'

/**
 * スケジューラー実行結果
 */
export interface SchedulerExecutionResult {
  executed: number
  successful: number
  failed: number
  errors: string[]
}

/**
 * スケジューラーサービス
 * 有効なスケジュールをチェックし、該当するものを実行する
 */
export class SchedulerService {
  /**
   * 現在時刻に実行すべきスケジュールをチェックして実行
   */
  async executeScheduledJobs(): Promise<SchedulerExecutionResult> {
    // 日本時間で計算（UTC+9）
    const now = new Date()
    const jstOffset = 9 * 60 // 日本時間はUTC+9
    const jstDate = new Date(now.getTime() + jstOffset * 60 * 1000)
    const currentHour = jstDate.getUTCHours()
    const currentDayOfWeek = jstDate.getUTCDay() === 0 ? 7 : jstDate.getUTCDay() // 日曜=0を7に変換

    const result: SchedulerExecutionResult = {
      executed: 0,
      successful: 0,
      failed: 0,
      errors: [],
    }

    // 有効なスケジュールを取得
    const schedules = await prisma.postProfileSchedule.findMany({
      where: {
        is_enabled: true,
        schedule_type: { not: 'none' },
      },
      include: {
        postProfile: {
          include: {
            articleTypes: {
              where: { is_enabled: true },
            },
          },
        },
      },
    })

    for (const schedule of schedules) {
      const shouldRun = this.shouldRunSchedule(
        schedule.schedule_type as ScheduleType,
        schedule.daily_hour,
        schedule.weekly_day_of_week,
        schedule.weekly_hour,
        currentHour,
        currentDayOfWeek
      )

      if (!shouldRun) continue

      // 有効な記事タイプがあるか確認
      const enabledArticleTypes = schedule.postProfile.articleTypes
      if (enabledArticleTypes.length === 0) {
        result.errors.push(
          `プロファイル ${schedule.post_profile_id}: 有効な記事タイプがありません`
        )
        continue
      }

      // ランダムに記事タイプを選択
      const randomIndex = Math.floor(Math.random() * enabledArticleTypes.length)
      const selectedArticleType = enabledArticleTypes[randomIndex]

      try {
        result.executed++

        const jobResult = await articleGenerationService.executeJob({
          postProfileId: schedule.post_profile_id,
          articleTypeId: selectedArticleType.id,
          triggerType: 'scheduler',
        })

        if (jobResult.success) {
          result.successful++
        } else {
          result.failed++
          result.errors.push(
            `プロファイル ${schedule.post_profile_id}: ${jobResult.errorMessage}`
          )
        }
      } catch (error) {
        result.failed++
        result.errors.push(
          `プロファイル ${schedule.post_profile_id}: ${error instanceof Error ? error.message : '不明なエラー'}`
        )
      }
    }

    return result
  }

  /**
   * スケジュールが現在時刻に実行すべきかどうかを判定
   */
  private shouldRunSchedule(
    scheduleType: ScheduleType,
    dailyHour: number | null,
    weeklyDayOfWeek: number | null,
    weeklyHour: number | null,
    currentHour: number,
    currentDayOfWeek: number
  ): boolean {
    switch (scheduleType) {
      case 'daily':
        return dailyHour === currentHour

      case 'weekly':
        return (
          weeklyDayOfWeek === currentDayOfWeek && weeklyHour === currentHour
        )

      default:
        return false
    }
  }
}

/**
 * サービスのシングルトンインスタンス
 */
export const schedulerService = new SchedulerService()
