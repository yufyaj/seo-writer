'use server'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma'
import { scheduleSchema, type ScheduleInput } from './validation'
import { revalidatePath } from 'next/cache'
import type { PostProfileSchedule } from '@prisma/client'

export type ScheduleActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/**
 * BigIntをstringに変換したSchedule型
 */
export type SerializedSchedule = Omit<PostProfileSchedule, 'post_profile_id'> & {
  post_profile_id: string
}

/**
 * Scheduleオブジェクトをシリアライズ可能な形式に変換
 */
function serializeSchedule(schedule: PostProfileSchedule): SerializedSchedule {
  return {
    ...schedule,
    post_profile_id: schedule.post_profile_id.toString(),
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
 * プロファイルのスケジュールを取得
 */
export async function getSchedule(
  profileId: string
): Promise<ScheduleActionResult<SerializedSchedule | null>> {
  const { valid } = await verifyProfileOwnership(profileId)
  if (!valid) {
    return { success: false, error: 'プロファイルが見つかりません' }
  }

  const schedule = await prisma.postProfileSchedule.findUnique({
    where: { post_profile_id: BigInt(profileId) },
  })

  return {
    success: true,
    data: schedule ? serializeSchedule(schedule) : null,
  }
}

/**
 * スケジュールを保存（upsert）
 */
export async function saveSchedule(
  input: ScheduleInput
): Promise<ScheduleActionResult<SerializedSchedule>> {
  const { valid } = await verifyProfileOwnership(input.post_profile_id)
  if (!valid) {
    return { success: false, error: 'プロファイルが見つかりません' }
  }

  const validatedFields = scheduleSchema.safeParse(input)
  if (!validatedFields.success) {
    return {
      success: false,
      error: 'バリデーションエラー',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const data = validatedFields.data

  const schedule = await prisma.postProfileSchedule.upsert({
    where: { post_profile_id: BigInt(data.post_profile_id) },
    create: {
      post_profile_id: BigInt(data.post_profile_id),
      schedule_type: data.schedule_type,
      daily_time: data.daily_time || null,
      weekly_day_of_week: data.weekly_day_of_week || null,
      weekly_time: data.weekly_time || null,
      cron_expression: data.cron_expression || null,
      is_enabled: data.is_enabled,
    },
    update: {
      schedule_type: data.schedule_type,
      daily_time: data.daily_time || null,
      weekly_day_of_week: data.weekly_day_of_week || null,
      weekly_time: data.weekly_time || null,
      cron_expression: data.cron_expression || null,
      is_enabled: data.is_enabled,
    },
  })

  revalidatePath(`/dashboard/profiles/${data.post_profile_id}/schedule`)
  return {
    success: true,
    data: serializeSchedule(schedule),
  }
}

/**
 * スケジュールの有効/無効を切り替え
 */
export async function toggleScheduleEnabled(
  profileId: string
): Promise<ScheduleActionResult<SerializedSchedule>> {
  const { valid } = await verifyProfileOwnership(profileId)
  if (!valid) {
    return { success: false, error: 'プロファイルが見つかりません' }
  }

  const existing = await prisma.postProfileSchedule.findUnique({
    where: { post_profile_id: BigInt(profileId) },
  })

  if (!existing) {
    return { success: false, error: 'スケジュールが見つかりません' }
  }

  const schedule = await prisma.postProfileSchedule.update({
    where: { post_profile_id: BigInt(profileId) },
    data: {
      is_enabled: !existing.is_enabled,
    },
  })

  revalidatePath(`/dashboard/profiles/${profileId}/schedule`)
  return {
    success: true,
    data: serializeSchedule(schedule),
  }
}

/**
 * スケジュールを削除
 */
export async function deleteSchedule(
  profileId: string
): Promise<ScheduleActionResult> {
  const { valid } = await verifyProfileOwnership(profileId)
  if (!valid) {
    return { success: false, error: 'プロファイルが見つかりません' }
  }

  const existing = await prisma.postProfileSchedule.findUnique({
    where: { post_profile_id: BigInt(profileId) },
  })

  if (!existing) {
    return { success: false, error: 'スケジュールが見つかりません' }
  }

  await prisma.postProfileSchedule.delete({
    where: { post_profile_id: BigInt(profileId) },
  })

  revalidatePath(`/dashboard/profiles/${profileId}/schedule`)
  return { success: true }
}
