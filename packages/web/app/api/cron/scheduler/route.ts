import { NextResponse } from 'next/server'
import { schedulerService } from '@/lib/scheduler/scheduler-service'

/**
 * スケジューラーエンドポイント
 * Cloud Schedulerから毎時呼び出される
 *
 * GET /api/cron/scheduler
 */
export async function GET(request: Request) {
  // 認証チェック（Cloud Schedulerからの呼び出しを検証）
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Scheduler] Starting scheduled job execution...')

    const result = await schedulerService.executeScheduledJobs()

    console.log('[Scheduler] Execution completed:', {
      executed: result.executed,
      successful: result.successful,
      failed: result.failed,
    })

    if (result.errors.length > 0) {
      console.error('[Scheduler] Errors:', result.errors)
    }

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[Scheduler] Fatal error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Cloud Runのタイムアウト設定用
 * 長時間実行を許可
 */
export const maxDuration = 300 // 5分
