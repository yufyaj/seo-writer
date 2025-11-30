import type {
  WPConnectionConfig,
  WPCreatePostParams,
  WPPost,
  WPMedia,
  WPAPIError,
} from './types'

/**
 * WordPress REST APIクライアント
 */
export class WordPressClient {
  private baseUrl: string
  private authHeader: string

  constructor(config: WPConnectionConfig) {
    // ベースURLの末尾スラッシュを除去
    this.baseUrl = config.baseUrl.replace(/\/$/, '')

    // Basic認証ヘッダーを作成
    const credentials = Buffer.from(
      `${config.username}:${config.appPassword}`
    ).toString('base64')
    this.authHeader = `Basic ${credentials}`
  }

  /**
   * API リクエストを実行
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/wp-json/wp/v2${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: this.authHeader,
        ...options.headers,
      },
    })

    if (!response.ok) {
      let errorData: WPAPIError | null = null
      try {
        errorData = (await response.json()) as WPAPIError
      } catch {
        // JSONパース失敗は無視
      }

      const errorMessage =
        errorData?.message || `WordPress API error: ${response.status}`
      throw new Error(errorMessage)
    }

    return response.json() as Promise<T>
  }

  /**
   * 接続テスト
   */
  async testConnection(): Promise<boolean> {
    try {
      // 自分のユーザー情報を取得して認証をテスト
      await this.request('/users/me')
      return true
    } catch {
      return false
    }
  }

  /**
   * 投稿を作成
   */
  async createPost(params: WPCreatePostParams): Promise<WPPost> {
    const body: Record<string, unknown> = {
      title: params.title,
      content: params.content,
      status: params.status,
    }

    if (params.categories && params.categories.length > 0) {
      body.categories = params.categories
    }

    if (params.featured_media) {
      body.featured_media = params.featured_media
    }

    if (params.excerpt) {
      body.excerpt = params.excerpt
    }

    return this.request<WPPost>('/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  /**
   * メディア（画像）をアップロード
   */
  async uploadMedia(
    imageData: Buffer | Uint8Array,
    filename: string,
    mimeType: string = 'image/png',
    altText?: string
  ): Promise<WPMedia> {
    // Uint8Arrayに統一してからBlobを作成（fetch APIの互換性のため）
    const uint8Array = Buffer.isBuffer(imageData)
      ? new Uint8Array(imageData)
      : imageData
    const blob = new Blob([uint8Array] as BlobPart[], { type: mimeType })

    const response = await fetch(
      `${this.baseUrl}/wp-json/wp/v2/media`,
      {
        method: 'POST',
        headers: {
          Authorization: this.authHeader,
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
        body: blob,
      }
    )

    if (!response.ok) {
      let errorData: WPAPIError | null = null
      try {
        errorData = (await response.json()) as WPAPIError
      } catch {
        // JSONパース失敗は無視
      }

      const errorMessage =
        errorData?.message || `WordPress media upload error: ${response.status}`
      throw new Error(errorMessage)
    }

    const media = (await response.json()) as WPMedia

    // alt_textを設定（アップロード後に更新）
    if (altText) {
      await this.updateMediaAltText(media.id, altText)
    }

    return media
  }

  /**
   * メディアのalt_textを更新
   */
  private async updateMediaAltText(
    mediaId: number,
    altText: string
  ): Promise<void> {
    await this.request(`/media/${mediaId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ alt_text: altText }),
    })
  }

  /**
   * カテゴリー一覧を取得
   */
  async getCategories(): Promise<{ id: number; name: string }[]> {
    return this.request<{ id: number; name: string }[]>('/categories')
  }
}

/**
 * WordPress接続設定からクライアントを作成
 */
export function createWordPressClient(
  config: WPConnectionConfig
): WordPressClient {
  return new WordPressClient(config)
}
