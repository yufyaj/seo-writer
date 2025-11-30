import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto/encryption'
import { generateArticle, selectKeyword } from '@/lib/gemini/article-generator'
import { generateImage, base64ToBuffer } from '@/lib/gemini/image-generator'
import { createWordPressClient } from '@/lib/wordpress/client'
import type { WPPostStatus } from '@/lib/wordpress/types'
import type {
  JobStatus,
  JobItemStatus,
  GenerateArticleRequest,
  GeneratedArticle,
} from './validation'

/**
 * H2タグの情報
 */
interface H2Info {
  fullMatch: string  // マッチした全体（<h2>...</h2>）
  text: string       // 見出しテキスト
  index: number      // 記事内での位置
}

/**
 * 記事本文からH2タグを抽出
 */
function extractH2Tags(content: string): H2Info[] {
  const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi
  const results: H2Info[] = []
  let match

  while ((match = h2Regex.exec(content)) !== null) {
    results.push({
      fullMatch: match[0],
      text: match[1].replace(/<[^>]*>/g, '').trim(), // HTMLタグを除去
      index: match.index,
    })
  }

  return results
}

/**
 * H2タグの直下に画像を挿入
 */
function insertImagesAfterH2(
  content: string,
  h2Tags: H2Info[],
  imageUrls: string[]
): string {
  let result = content
  let offset = 0

  for (let i = 0; i < h2Tags.length && i < imageUrls.length; i++) {
    const h2 = h2Tags[i]
    const imageUrl = imageUrls[i]
    const insertPosition = h2.index + h2.fullMatch.length + offset

    const imageHtml = `\n<figure class="wp-block-image"><img src="${imageUrl}" alt="${h2.text}" /></figure>\n`

    result =
      result.slice(0, insertPosition) +
      imageHtml +
      result.slice(insertPosition)

    offset += imageHtml.length
  }

  return result
}

/**
 * ジョブ実行結果
 */
export interface JobExecutionResult {
  success: boolean
  jobId: bigint
  jobItemId: bigint
  article?: GeneratedArticle
  wpPostId?: number
  wpPostUrl?: string
  wpMediaId?: number
  errorMessage?: string
}

/**
 * 記事生成・投稿サービス
 */
export class ArticleGenerationService {
  /**
   * 記事生成ジョブを実行
   * 1ジョブ = 1記事固定
   */
  async executeJob(request: GenerateArticleRequest): Promise<JobExecutionResult> {
    const { postProfileId, articleTypeId, triggerType } = request

    // ジョブを作成（running状態）
    const job = await prisma.job.create({
      data: {
        post_profile_id: postProfileId,
        trigger_type: triggerType,
        status: 'running' as JobStatus,
      },
    })

    // ジョブアイテムを作成
    const jobItem = await prisma.jobItem.create({
      data: {
        job_id: job.id,
        post_profile_id: postProfileId,
        post_profile_article_type_id: articleTypeId,
        status: 'failed' as JobItemStatus, // デフォルトは失敗（成功時に更新）
      },
    })

    try {
      // 投稿プロファイルと関連データを取得
      const postProfile = await prisma.postProfile.findUnique({
        where: { id: postProfileId },
        include: {
          company: true,
          articleTypes: {
            where: { id: articleTypeId },
          },
        },
      })

      if (!postProfile) {
        throw new Error('投稿プロファイルが見つかりません')
      }

      if (!postProfile.articleTypes[0]) {
        throw new Error('記事タイプが見つかりません')
      }

      const company = postProfile.company
      const articleType = postProfile.articleTypes[0]

      // キーワード戦略からキーワードを選択
      const keywordStrategy = postProfile.keyword_strategy as {
        strategy_concept?: string
        head_middle?: string[]
        transactional_cv?: string[]
        informational_knowhow?: string[]
        business_specific?: string[]
      }
      const keyword = selectKeyword(keywordStrategy) || ''

      // ジョブアイテムにキーワードを記録
      await prisma.jobItem.update({
        where: { id: jobItem.id },
        data: { keyword: keyword || null },
      })

      // 記事を生成
      const article = await generateArticle({
        company: {
          companyName: company.company_name,
          brandName: company.brand_name,
          aboutText: company.about_text,
          siteUrl: company.site_url,
        },
        profile: {
          name: postProfile.name,
          description: postProfile.description,
        },
        keywordStrategy,
        keyword,
        promptTemplate: articleType.prompt_template,
      })

      // ジョブアイテムにタイトルを記録
      await prisma.jobItem.update({
        where: { id: jobItem.id },
        data: { title: article.title },
      })

      // WordPressに接続
      const wpClient = createWordPressClient({
        baseUrl: company.wp_base_url,
        username: company.wp_username,
        appPassword: decrypt(company.wp_app_password_secret_name),
      })

      // H2タグを抽出
      const h2Tags = extractH2Tags(article.content)

      // アイキャッチ画像を生成
      const featuredImage = await generateImage({
        title: article.title,
        content: article.content,
        keyword: keyword || undefined,
      })

      // アイキャッチ画像をWordPressにアップロード
      const featuredImageBuffer = base64ToBuffer(featuredImage.data)
      const wpFeaturedMedia = await wpClient.uploadMedia(
        featuredImageBuffer,
        `article-${job.id}-featured-${Date.now()}.png`,
        featuredImage.mimeType,
        article.title
      )

      // H2ごとに画像を生成してアップロード
      const h2ImageUrls: string[] = []
      for (let i = 0; i < h2Tags.length; i++) {
        const h2 = h2Tags[i]

        // H2の内容に基づいて画像を生成
        const sectionImage = await generateImage({
          title: h2.text,
          content: article.content,
          keyword: keyword || undefined,
        })

        // 画像をWordPressにアップロード
        const sectionImageBuffer = base64ToBuffer(sectionImage.data)
        const wpSectionMedia = await wpClient.uploadMedia(
          sectionImageBuffer,
          `article-${job.id}-section-${i + 1}-${Date.now()}.png`,
          sectionImage.mimeType,
          h2.text
        )

        h2ImageUrls.push(wpSectionMedia.source_url)
      }

      // 記事本文にH2直下の画像を挿入
      const contentWithImages = insertImagesAfterH2(
        article.content,
        h2Tags,
        h2ImageUrls
      )

      // 記事をWordPressに投稿
      const wpPost = await wpClient.createPost({
        title: article.title,
        content: contentWithImages,
        status: company.wp_default_status as WPPostStatus,
        categories: postProfile.wp_category_id
          ? [Number(postProfile.wp_category_id)]
          : undefined,
        featured_media: wpFeaturedMedia.id,
        excerpt: article.meta_description,
      })

      // ジョブアイテムを成功で更新
      await prisma.jobItem.update({
        where: { id: jobItem.id },
        data: {
          status: 'success' as JobItemStatus,
          wp_post_id: BigInt(wpPost.id),
          wp_post_url: wpPost.link,
          wp_media_id: BigInt(wpFeaturedMedia.id),
        },
      })

      // ジョブを成功で完了
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'success' as JobStatus,
          finished_at: new Date(),
        },
      })

      return {
        success: true,
        jobId: job.id,
        jobItemId: jobItem.id,
        article,
        wpPostId: wpPost.id,
        wpPostUrl: wpPost.link,
        wpMediaId: wpFeaturedMedia.id,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '不明なエラーが発生しました'

      // ジョブアイテムをエラーで更新
      await prisma.jobItem.update({
        where: { id: jobItem.id },
        data: {
          status: 'failed' as JobItemStatus,
          error_message: errorMessage,
        },
      })

      // ジョブを失敗で完了
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'failed' as JobStatus,
          finished_at: new Date(),
          error_message: errorMessage,
        },
      })

      return {
        success: false,
        jobId: job.id,
        jobItemId: jobItem.id,
        errorMessage,
      }
    }
  }

  /**
   * WordPress接続テスト
   */
  async testWordPressConnection(companyId: bigint): Promise<boolean> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      throw new Error('会社設定が見つかりません')
    }

    const wpClient = createWordPressClient({
      baseUrl: company.wp_base_url,
      username: company.wp_username,
      appPassword: decrypt(company.wp_app_password_secret_name),
    })

    return wpClient.testConnection()
  }
}

/**
 * サービスのシングルトンインスタンス
 */
export const articleGenerationService = new ArticleGenerationService()
