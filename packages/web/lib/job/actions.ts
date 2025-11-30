'use server'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import {
  generateArticleRequestSchema,
  type GenerateArticleRequest,
  type TriggerType,
} from './validation'
import { articleGenerationService } from './article-generation-service'

export type JobActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/**
 * シリアライズ可能なジョブ
 */
export interface SerializedJob {
  id: string
  post_profile_id: string
  trigger_type: string
  status: string
  started_at: string
  finished_at: string | null
  error_message: string | null
}

/**
 * シリアライズ可能なジョブアイテム
 */
export interface SerializedJobItem {
  id: string
  job_id: string
  post_profile_id: string
  post_profile_article_type_id: string
  keyword: string | null
  title: string | null
  wp_post_id: string | null
  wp_post_url: string | null
  wp_media_id: string | null
  status: string
  error_message: string | null
  created_at: string
}

/**
 * ジョブ詳細（ジョブアイテム含む）
 */
export interface SerializedJobWithItems extends SerializedJob {
  items: SerializedJobItem[]
}

/**
 * 記事生成結果
 */
export interface ArticleGenerationResult {
  jobId: string
  jobItemId: string
  success: boolean
  article?: {
    title: string
    content: string
    meta_description?: string
  }
  wpPostId?: number
  wpPostUrl?: string
  wpMediaId?: number
  errorMessage?: string
}

/**
 * 記事生成・WordPress投稿を実行
 */
export async function generateAndPublishArticle(
  postProfileId: bigint | string,
  articleTypeId: bigint | string
): Promise<JobActionResult<ArticleGenerationResult>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: '認証が必要です' }
  }

  // 入力をBigIntに変換
  const profileId = typeof postProfileId === 'string' ? BigInt(postProfileId) : postProfileId
  const typeId = typeof articleTypeId === 'string' ? BigInt(articleTypeId) : articleTypeId

  // 投稿プロファイルの所有権確認
  const postProfile = await prisma.postProfile.findUnique({
    where: { id: profileId },
    include: { company: true },
  })

  if (!postProfile) {
    return { success: false, error: '投稿プロファイルが見つかりません' }
  }

  if (postProfile.company.user_id !== BigInt(session.user.id)) {
    return { success: false, error: 'この投稿プロファイルへのアクセス権がありません' }
  }

  // 記事タイプの存在確認
  const articleType = await prisma.postProfileArticleType.findFirst({
    where: {
      id: typeId,
      post_profile_id: profileId,
    },
  })

  if (!articleType) {
    return { success: false, error: '記事タイプが見つかりません' }
  }

  // バリデーション
  const request: GenerateArticleRequest = {
    postProfileId: profileId,
    articleTypeId: typeId,
    triggerType: 'manual' as TriggerType,
  }

  const validated = generateArticleRequestSchema.safeParse(request)
  if (!validated.success) {
    return {
      success: false,
      error: 'バリデーションエラー',
      fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // ジョブ実行
  const result = await articleGenerationService.executeJob(validated.data)

  revalidatePath('/dashboard/jobs')

  if (result.success) {
    return {
      success: true,
      data: {
        jobId: result.jobId.toString(),
        jobItemId: result.jobItemId.toString(),
        success: true,
        article: result.article
          ? {
              title: result.article.title,
              content: result.article.content,
              meta_description: result.article.meta_description,
            }
          : undefined,
        wpPostId: result.wpPostId,
        wpPostUrl: result.wpPostUrl,
        wpMediaId: result.wpMediaId,
      },
    }
  }

  return {
    success: true,
    data: {
      jobId: result.jobId.toString(),
      jobItemId: result.jobItemId.toString(),
      success: false,
      errorMessage: result.errorMessage,
    },
  }
}

/**
 * ジョブ一覧を取得
 */
export async function getJobs(
  page: number = 1,
  limit: number = 20
): Promise<JobActionResult<{ jobs: SerializedJob[]; total: number }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: '認証が必要です' }
  }

  const userId = BigInt(session.user.id)

  // ユーザーの会社に紐づく投稿プロファイルIDを取得
  const company = await prisma.company.findUnique({
    where: { user_id: userId },
    include: {
      postProfiles: {
        select: { id: true },
      },
    },
  })

  if (!company) {
    return { success: true, data: { jobs: [], total: 0 } }
  }

  const profileIds = company.postProfiles.map((p) => p.id)

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where: { post_profile_id: { in: profileIds } },
      orderBy: { started_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.job.count({
      where: { post_profile_id: { in: profileIds } },
    }),
  ])

  const serializedJobs: SerializedJob[] = jobs.map((job) => ({
    id: job.id.toString(),
    post_profile_id: job.post_profile_id.toString(),
    trigger_type: job.trigger_type,
    status: job.status,
    started_at: job.started_at.toISOString(),
    finished_at: job.finished_at?.toISOString() || null,
    error_message: job.error_message,
  }))

  return { success: true, data: { jobs: serializedJobs, total } }
}

/**
 * ジョブ詳細を取得
 */
export async function getJobDetail(
  jobId: bigint | string
): Promise<JobActionResult<SerializedJobWithItems>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: '認証が必要です' }
  }

  const id = typeof jobId === 'string' ? BigInt(jobId) : jobId

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      jobItems: true,
      postProfile: {
        include: { company: true },
      },
    },
  })

  if (!job) {
    return { success: false, error: 'ジョブが見つかりません' }
  }

  if (job.postProfile.company.user_id !== BigInt(session.user.id)) {
    return { success: false, error: 'このジョブへのアクセス権がありません' }
  }

  const serializedJob: SerializedJobWithItems = {
    id: job.id.toString(),
    post_profile_id: job.post_profile_id.toString(),
    trigger_type: job.trigger_type,
    status: job.status,
    started_at: job.started_at.toISOString(),
    finished_at: job.finished_at?.toISOString() || null,
    error_message: job.error_message,
    items: job.jobItems.map((item) => ({
      id: item.id.toString(),
      job_id: item.job_id.toString(),
      post_profile_id: item.post_profile_id.toString(),
      post_profile_article_type_id: item.post_profile_article_type_id.toString(),
      keyword: item.keyword,
      title: item.title,
      wp_post_id: item.wp_post_id?.toString() || null,
      wp_post_url: item.wp_post_url,
      wp_media_id: item.wp_media_id?.toString() || null,
      status: item.status,
      error_message: item.error_message,
      created_at: item.created_at.toISOString(),
    })),
  }

  return { success: true, data: serializedJob }
}

/**
 * WordPress接続テスト
 */
export async function testWordPressConnection(): Promise<JobActionResult<{ connected: boolean }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: '認証が必要です' }
  }

  const company = await prisma.company.findUnique({
    where: { user_id: BigInt(session.user.id) },
  })

  if (!company) {
    return { success: false, error: '会社設定が見つかりません。先に設定を完了してください。' }
  }

  try {
    const connected = await articleGenerationService.testWordPressConnection(company.id)
    return { success: true, data: { connected } }
  } catch (error) {
    const message = error instanceof Error ? error.message : '接続テストに失敗しました'
    return { success: false, error: message }
  }
}
