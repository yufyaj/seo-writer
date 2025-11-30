/**
 * WordPress投稿のステータス
 */
export type WPPostStatus = 'publish' | 'draft' | 'pending' | 'private' | 'future'

/**
 * WordPress投稿作成のパラメータ
 */
export interface WPCreatePostParams {
  /** 記事タイトル */
  title: string
  /** 記事本文（HTML） */
  content: string
  /** 投稿ステータス */
  status: WPPostStatus
  /** カテゴリーID配列 */
  categories?: number[]
  /** アイキャッチ画像のメディアID */
  featured_media?: number
  /** 抜粋 */
  excerpt?: string
}

/**
 * WordPress投稿のレスポンス
 */
export interface WPPost {
  id: number
  link: string
  title: {
    rendered: string
    raw?: string
  }
  content: {
    rendered: string
    raw?: string
  }
  status: WPPostStatus
  featured_media: number
}

/**
 * WordPressメディアアップロードのレスポンス
 */
export interface WPMedia {
  id: number
  source_url: string
  title: {
    rendered: string
    raw?: string
  }
  alt_text: string
}

/**
 * WordPress API エラー
 */
export interface WPAPIError {
  code: string
  message: string
  data?: {
    status: number
  }
}

/**
 * WordPress接続設定
 */
export interface WPConnectionConfig {
  /** WordPressのベースURL */
  baseUrl: string
  /** REST API用ユーザー名 */
  username: string
  /** Application Password */
  appPassword: string
}
