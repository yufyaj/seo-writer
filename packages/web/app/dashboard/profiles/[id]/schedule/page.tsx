import { auth } from '@/lib/auth/auth'
import { redirect, notFound } from 'next/navigation'
import { getPostProfile } from '@/lib/post-profile/actions'
import { getSchedule } from '@/lib/schedule/actions'
import { ScheduleDisplay } from '@/components/schedule/schedule-display'
import Link from 'next/link'

type Props = {
  params: Promise<{ id: string }>
}

export default async function SchedulePage({ params }: Props) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id: profileId } = await params

  // プロファイルの存在確認
  const profileResult = await getPostProfile(profileId)
  if (!profileResult.success || !profileResult.data) {
    notFound()
  }

  const result = await getSchedule(profileId)

  if (!result.success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-lg bg-white p-8 shadow-md">
            <p className="text-red-600">{result.error}</p>
            <Link
              href="/dashboard/profiles"
              className="mt-4 inline-block text-blue-600 hover:underline"
            >
              プロファイル一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4">
          <Link
            href="/dashboard/profiles"
            className="text-sm text-blue-600 hover:underline"
          >
            ← プロファイル一覧に戻る
          </Link>
        </div>
        <div className="rounded-lg bg-white p-8 shadow-md">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">スケジュール設定</h1>
            <p className="mt-1 text-sm text-gray-500">
              プロファイル: {profileResult.data.name}
            </p>
          </div>
          <ScheduleDisplay profileId={profileId} schedule={result.data ?? null} />
        </div>
      </div>
    </div>
  )
}
