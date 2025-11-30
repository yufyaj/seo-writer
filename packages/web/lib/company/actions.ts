'use server'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma'
import {
  companyCreateSchema,
  companyUpdateSchema,
  type CompanyCreateInput,
  type CompanyUpdateInput,
} from './validation'
import { revalidatePath } from 'next/cache'
import type { Company } from '@prisma/client'
import { encrypt } from '@/lib/crypto/encryption'

export type CompanyActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/**
 * BigIntをstringに変換したCompany型
 */
export type SerializedCompany = Omit<Company, 'id' | 'user_id'> & {
  id: string
  user_id: string
}

/**
 * Companyオブジェクトをシリアライズ可能な形式に変換
 */
function serializeCompany(company: Company): SerializedCompany {
  return {
    ...company,
    id: company.id.toString(),
    user_id: company.user_id.toString(),
  }
}

/**
 * 現在のユーザーの会社設定を取得
 */
export async function getCompany(): Promise<
  CompanyActionResult<SerializedCompany | null>
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: '認証が必要です' }
  }

  const company = await prisma.company.findUnique({
    where: { user_id: BigInt(session.user.id) },
  })

  return {
    success: true,
    data: company ? serializeCompany(company) : null,
  }
}

/**
 * 会社設定を作成
 */
export async function createCompany(
  input: CompanyCreateInput
): Promise<CompanyActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: '認証が必要です' }
  }

  const validatedFields = companyCreateSchema.safeParse(input)
  if (!validatedFields.success) {
    return {
      success: false,
      error: 'バリデーションエラー',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const userId = BigInt(session.user.id)

  const existing = await prisma.company.findUnique({
    where: { user_id: userId },
  })
  if (existing) {
    return { success: false, error: '会社設定は既に登録されています' }
  }

  // アプリパスワードを暗号化
  const encryptedPassword = encryptAppPassword(validatedFields.data.wp_app_password)

  await prisma.company.create({
    data: {
      user_id: userId,
      company_name: validatedFields.data.company_name,
      brand_name: validatedFields.data.brand_name || null,
      about_text: validatedFields.data.about_text || null,
      site_url: validatedFields.data.site_url || null,
      wp_base_url: validatedFields.data.wp_base_url,
      wp_username: validatedFields.data.wp_username,
      wp_app_password_secret_name: encryptedPassword,
      wp_default_status: validatedFields.data.wp_default_status,
    },
  })

  revalidatePath('/dashboard/settings')
  return { success: true }
}

/**
 * 会社設定を更新
 */
export async function updateCompany(
  input: CompanyUpdateInput
): Promise<CompanyActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: '認証が必要です' }
  }

  const validatedFields = companyUpdateSchema.safeParse(input)
  if (!validatedFields.success) {
    return {
      success: false,
      error: 'バリデーションエラー',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const userId = BigInt(session.user.id)

  const existing = await prisma.company.findUnique({
    where: { user_id: userId },
  })
  if (!existing) {
    return { success: false, error: '会社設定が見つかりません' }
  }

  let encryptedPassword = existing.wp_app_password_secret_name
  if (validatedFields.data.wp_app_password) {
    // 新しいパスワードが入力された場合のみ暗号化して更新
    encryptedPassword = encryptAppPassword(validatedFields.data.wp_app_password)
  }

  await prisma.company.update({
    where: { user_id: userId },
    data: {
      company_name: validatedFields.data.company_name,
      brand_name: validatedFields.data.brand_name || null,
      about_text: validatedFields.data.about_text || null,
      site_url: validatedFields.data.site_url || null,
      wp_base_url: validatedFields.data.wp_base_url,
      wp_username: validatedFields.data.wp_username,
      wp_app_password_secret_name: encryptedPassword,
      wp_default_status: validatedFields.data.wp_default_status,
    },
  })

  revalidatePath('/dashboard/settings')
  return { success: true }
}

/**
 * アプリパスワードを暗号化
 * AES-256-GCMで暗号化してBase64文字列を返す
 */
function encryptAppPassword(password: string): string {
  return encrypt(password)
}
