'use server'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma'
import {
  postProfileCreateSchema,
  postProfileUpdateSchema,
  type PostProfileCreateInput,
  type PostProfileUpdateInput,
  type KeywordStrategy,
} from './validation'
import { revalidatePath } from 'next/cache'
import type { PostProfile } from '@prisma/client'

export type PostProfileActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/**
 * BigIntをstringに変換したPostProfile型
 */
export type SerializedPostProfile = Omit<
  PostProfile,
  'id' | 'company_id' | 'wp_category_id' | 'keyword_strategy'
> & {
  id: string
  company_id: string
  wp_category_id: string | null
  keyword_strategy: KeywordStrategy
}

/**
 * PostProfileオブジェクトをシリアライズ可能な形式に変換
 */
function serializePostProfile(profile: PostProfile): SerializedPostProfile {
  return {
    ...profile,
    id: profile.id.toString(),
    company_id: profile.company_id.toString(),
    wp_category_id: profile.wp_category_id?.toString() ?? null,
    keyword_strategy: profile.keyword_strategy as KeywordStrategy,
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
 * プロファイル一覧を取得
 */
export async function getPostProfiles(): Promise<
  PostProfileActionResult<SerializedPostProfile[]>
> {
  const companyId = await getCurrentUserCompanyId()
  if (!companyId) {
    return { success: false, error: '会社設定が必要です' }
  }

  const profiles = await prisma.postProfile.findMany({
    where: { company_id: companyId },
    orderBy: { created_at: 'desc' },
  })

  return {
    success: true,
    data: profiles.map(serializePostProfile),
  }
}

/**
 * プロファイルを取得
 */
export async function getPostProfile(
  id: string
): Promise<PostProfileActionResult<SerializedPostProfile>> {
  const companyId = await getCurrentUserCompanyId()
  if (!companyId) {
    return { success: false, error: '会社設定が必要です' }
  }

  const profile = await prisma.postProfile.findFirst({
    where: {
      id: BigInt(id),
      company_id: companyId,
    },
  })

  if (!profile) {
    return { success: false, error: 'プロファイルが見つかりません' }
  }

  return {
    success: true,
    data: serializePostProfile(profile),
  }
}

/**
 * プロファイルを作成
 */
export async function createPostProfile(
  input: PostProfileCreateInput
): Promise<PostProfileActionResult<SerializedPostProfile>> {
  const companyId = await getCurrentUserCompanyId()
  if (!companyId) {
    return { success: false, error: '会社設定が必要です' }
  }

  const validatedFields = postProfileCreateSchema.safeParse(input)
  if (!validatedFields.success) {
    return {
      success: false,
      error: 'バリデーションエラー',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const profile = await prisma.postProfile.create({
    data: {
      company_id: companyId,
      name: validatedFields.data.name,
      description: validatedFields.data.description || null,
      wp_category_id: validatedFields.data.wp_category_id
        ? BigInt(validatedFields.data.wp_category_id)
        : null,
      keyword_strategy: validatedFields.data.keyword_strategy,
      is_active: validatedFields.data.is_active,
    },
  })

  revalidatePath('/dashboard/profiles')
  return {
    success: true,
    data: serializePostProfile(profile),
  }
}

/**
 * プロファイルを更新
 */
export async function updatePostProfile(
  input: PostProfileUpdateInput
): Promise<PostProfileActionResult<SerializedPostProfile>> {
  const companyId = await getCurrentUserCompanyId()
  if (!companyId) {
    return { success: false, error: '会社設定が必要です' }
  }

  const validatedFields = postProfileUpdateSchema.safeParse(input)
  if (!validatedFields.success) {
    return {
      success: false,
      error: 'バリデーションエラー',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const existing = await prisma.postProfile.findFirst({
    where: {
      id: BigInt(validatedFields.data.id),
      company_id: companyId,
    },
  })

  if (!existing) {
    return { success: false, error: 'プロファイルが見つかりません' }
  }

  const profile = await prisma.postProfile.update({
    where: { id: BigInt(validatedFields.data.id) },
    data: {
      name: validatedFields.data.name,
      description: validatedFields.data.description || null,
      wp_category_id: validatedFields.data.wp_category_id
        ? BigInt(validatedFields.data.wp_category_id)
        : null,
      keyword_strategy: validatedFields.data.keyword_strategy,
      is_active: validatedFields.data.is_active,
    },
  })

  revalidatePath('/dashboard/profiles')
  revalidatePath(`/dashboard/profiles/${validatedFields.data.id}/edit`)
  return {
    success: true,
    data: serializePostProfile(profile),
  }
}

/**
 * プロファイルを削除
 */
export async function deletePostProfile(
  id: string
): Promise<PostProfileActionResult> {
  const companyId = await getCurrentUserCompanyId()
  if (!companyId) {
    return { success: false, error: '会社設定が必要です' }
  }

  const existing = await prisma.postProfile.findFirst({
    where: {
      id: BigInt(id),
      company_id: companyId,
    },
  })

  if (!existing) {
    return { success: false, error: 'プロファイルが見つかりません' }
  }

  await prisma.postProfile.delete({
    where: { id: BigInt(id) },
  })

  revalidatePath('/dashboard/profiles')
  return { success: true }
}

/**
 * プロファイルの有効/無効を切り替え
 */
export async function togglePostProfileActive(
  id: string
): Promise<PostProfileActionResult<SerializedPostProfile>> {
  const companyId = await getCurrentUserCompanyId()
  if (!companyId) {
    return { success: false, error: '会社設定が必要です' }
  }

  const existing = await prisma.postProfile.findFirst({
    where: {
      id: BigInt(id),
      company_id: companyId,
    },
  })

  if (!existing) {
    return { success: false, error: 'プロファイルが見つかりません' }
  }

  const profile = await prisma.postProfile.update({
    where: { id: BigInt(id) },
    data: {
      is_active: !existing.is_active,
    },
  })

  revalidatePath('/dashboard/profiles')
  return {
    success: true,
    data: serializePostProfile(profile),
  }
}
