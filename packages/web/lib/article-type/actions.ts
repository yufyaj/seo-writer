'use server'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma'
import {
  articleTypeCreateSchema,
  articleTypeUpdateSchema,
  type ArticleTypeCreateInput,
  type ArticleTypeUpdateInput,
} from './validation'
import { revalidatePath } from 'next/cache'
import type { PostProfileArticleType } from '@prisma/client'

export type ArticleTypeActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/**
 * BigIntをstringに変換したArticleType型
 */
export type SerializedArticleType = Omit<
  PostProfileArticleType,
  'id' | 'post_profile_id'
> & {
  id: string
  post_profile_id: string
}

/**
 * ArticleTypeオブジェクトをシリアライズ可能な形式に変換
 */
function serializeArticleType(
  articleType: PostProfileArticleType
): SerializedArticleType {
  return {
    ...articleType,
    id: articleType.id.toString(),
    post_profile_id: articleType.post_profile_id.toString(),
  }
}

/**
 * 現在のユーザーのCompanyIDを取得
 */
async function getCurrentUserCompanyId(): Promise<bigint | null> {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  const company = await prisma.company.findUnique({
    where: { user_id: BigInt(session.user.id) },
    select: { id: true },
  })

  return company?.id ?? null
}

/**
 * プロファイルがユーザーの会社に属しているか確認
 */
async function verifyProfileOwnership(
  profileId: string
): Promise<{ valid: boolean; companyId?: bigint }> {
  const companyId = await getCurrentUserCompanyId()
  if (!companyId) {
    return { valid: false }
  }

  const profile = await prisma.postProfile.findFirst({
    where: {
      id: BigInt(profileId),
      company_id: companyId,
    },
  })

  if (!profile) {
    return { valid: false }
  }

  return { valid: true, companyId }
}

/**
 * プロファイルの記事タイプ一覧を取得
 */
export async function getArticleTypes(
  profileId: string
): Promise<ArticleTypeActionResult<SerializedArticleType[]>> {
  const { valid } = await verifyProfileOwnership(profileId)
  if (!valid) {
    return { success: false, error: 'プロファイルが見つかりません' }
  }

  const articleTypes = await prisma.postProfileArticleType.findMany({
    where: { post_profile_id: BigInt(profileId) },
    orderBy: { created_at: 'desc' },
  })

  return {
    success: true,
    data: articleTypes.map(serializeArticleType),
  }
}

/**
 * 記事タイプを取得
 */
export async function getArticleType(
  id: string,
  profileId: string
): Promise<ArticleTypeActionResult<SerializedArticleType>> {
  const { valid } = await verifyProfileOwnership(profileId)
  if (!valid) {
    return { success: false, error: 'プロファイルが見つかりません' }
  }

  const articleType = await prisma.postProfileArticleType.findFirst({
    where: {
      id: BigInt(id),
      post_profile_id: BigInt(profileId),
    },
  })

  if (!articleType) {
    return { success: false, error: '記事タイプが見つかりません' }
  }

  return {
    success: true,
    data: serializeArticleType(articleType),
  }
}

/**
 * 記事タイプを作成
 */
export async function createArticleType(
  input: ArticleTypeCreateInput
): Promise<ArticleTypeActionResult<SerializedArticleType>> {
  const { valid } = await verifyProfileOwnership(input.post_profile_id)
  if (!valid) {
    return { success: false, error: 'プロファイルが見つかりません' }
  }

  const validatedFields = articleTypeCreateSchema.safeParse(input)
  if (!validatedFields.success) {
    return {
      success: false,
      error: 'バリデーションエラー',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const articleType = await prisma.postProfileArticleType.create({
    data: {
      post_profile_id: BigInt(validatedFields.data.post_profile_id),
      name: validatedFields.data.name,
      description: validatedFields.data.description || null,
      prompt_template: validatedFields.data.prompt_template,
      is_enabled: validatedFields.data.is_enabled,
    },
  })

  revalidatePath(`/dashboard/profiles/${input.post_profile_id}/article-types`)
  return {
    success: true,
    data: serializeArticleType(articleType),
  }
}

/**
 * 記事タイプを更新
 */
export async function updateArticleType(
  input: ArticleTypeUpdateInput,
  profileId: string
): Promise<ArticleTypeActionResult<SerializedArticleType>> {
  const { valid } = await verifyProfileOwnership(profileId)
  if (!valid) {
    return { success: false, error: 'プロファイルが見つかりません' }
  }

  const validatedFields = articleTypeUpdateSchema.safeParse(input)
  if (!validatedFields.success) {
    return {
      success: false,
      error: 'バリデーションエラー',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const existing = await prisma.postProfileArticleType.findFirst({
    where: {
      id: BigInt(validatedFields.data.id),
      post_profile_id: BigInt(profileId),
    },
  })

  if (!existing) {
    return { success: false, error: '記事タイプが見つかりません' }
  }

  const articleType = await prisma.postProfileArticleType.update({
    where: { id: BigInt(validatedFields.data.id) },
    data: {
      name: validatedFields.data.name,
      description: validatedFields.data.description || null,
      prompt_template: validatedFields.data.prompt_template,
      is_enabled: validatedFields.data.is_enabled,
    },
  })

  revalidatePath(`/dashboard/profiles/${profileId}/article-types`)
  revalidatePath(
    `/dashboard/profiles/${profileId}/article-types/${validatedFields.data.id}/edit`
  )
  return {
    success: true,
    data: serializeArticleType(articleType),
  }
}

/**
 * 記事タイプを削除
 */
export async function deleteArticleType(
  id: string,
  profileId: string
): Promise<ArticleTypeActionResult> {
  const { valid } = await verifyProfileOwnership(profileId)
  if (!valid) {
    return { success: false, error: 'プロファイルが見つかりません' }
  }

  const existing = await prisma.postProfileArticleType.findFirst({
    where: {
      id: BigInt(id),
      post_profile_id: BigInt(profileId),
    },
  })

  if (!existing) {
    return { success: false, error: '記事タイプが見つかりません' }
  }

  await prisma.postProfileArticleType.delete({
    where: { id: BigInt(id) },
  })

  revalidatePath(`/dashboard/profiles/${profileId}/article-types`)
  return { success: true }
}

/**
 * 記事タイプの有効/無効を切り替え
 */
export async function toggleArticleTypeEnabled(
  id: string,
  profileId: string
): Promise<ArticleTypeActionResult<SerializedArticleType>> {
  const { valid } = await verifyProfileOwnership(profileId)
  if (!valid) {
    return { success: false, error: 'プロファイルが見つかりません' }
  }

  const existing = await prisma.postProfileArticleType.findFirst({
    where: {
      id: BigInt(id),
      post_profile_id: BigInt(profileId),
    },
  })

  if (!existing) {
    return { success: false, error: '記事タイプが見つかりません' }
  }

  const articleType = await prisma.postProfileArticleType.update({
    where: { id: BigInt(id) },
    data: {
      is_enabled: !existing.is_enabled,
    },
  })

  revalidatePath(`/dashboard/profiles/${profileId}/article-types`)
  return {
    success: true,
    data: serializeArticleType(articleType),
  }
}
