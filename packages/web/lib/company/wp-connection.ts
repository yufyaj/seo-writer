'use server'

import { auth } from '@/lib/auth/auth'

export type WpConnectionTestResult =
  | { success: true; message: string; siteTitle?: string }
  | { success: false; error: string }

/**
 * WordPress接続テスト（フォーム入力値を使用）
 */
export async function testWpConnection(
  wpBaseUrl: string,
  wpUsername: string,
  wpAppPassword: string
): Promise<WpConnectionTestResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: '認証が必要です' }
  }

  // 入力値の検証
  if (!wpBaseUrl || !wpUsername || !wpAppPassword) {
    return { success: false, error: '接続情報を入力してください' }
  }

  try {
    const normalizedUrl = wpBaseUrl.replace(/\/$/, '')
    const apiUrl = `${normalizedUrl}/wp-json/wp/v2/posts?per_page=1`

    const credentials = Buffer.from(`${wpUsername}:${wpAppPassword}`).toString(
      'base64'
    )

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (response.ok) {
      // サイト情報を取得
      let siteTitle: string | undefined
      try {
        const siteInfoResponse = await fetch(`${normalizedUrl}/wp-json`, {
          signal: AbortSignal.timeout(5000),
        })
        if (siteInfoResponse.ok) {
          const siteInfo = await siteInfoResponse.json()
          siteTitle = siteInfo.name
        }
      } catch {
        // サイト情報の取得に失敗しても接続自体は成功
      }

      return {
        success: true,
        message: 'WordPress接続に成功しました',
        siteTitle,
      }
    }

    // エラーレスポンスの処理
    if (response.status === 401) {
      return {
        success: false,
        error:
          '認証に失敗しました。ユーザー名またはアプリパスワードを確認してください',
      }
    }
    if (response.status === 403) {
      return {
        success: false,
        error: 'アクセス権限がありません。ユーザーの権限を確認してください',
      }
    }
    if (response.status === 404) {
      return {
        success: false,
        error: 'WordPress REST APIが見つかりません。URLを確認してください',
      }
    }

    return { success: false, error: `接続エラー: HTTP ${response.status}` }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return { success: false, error: '接続がタイムアウトしました' }
      }
      if (error.message.includes('fetch failed')) {
        return {
          success: false,
          error: 'サーバーに接続できません。URLを確認してください',
        }
      }
      return { success: false, error: `接続エラー: ${error.message}` }
    }
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}
