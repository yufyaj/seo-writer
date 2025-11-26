import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { getPostProfiles } from '@/lib/post-profile/actions'
import { PostProfileList } from '@/components/post-profile/post-profile-list'
import Link from 'next/link'

export default async function ProfilesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const result = await getPostProfiles()

  if (!result.success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-lg bg-white p-8 shadow-md">
            <p className="text-red-600">{result.error}</p>
            <Link
              href="/dashboard/settings"
              className="mt-4 inline-block text-blue-600 hover:underline"
            >
              会社設定を行う
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
            href="/dashboard"
            className="text-sm text-blue-600 hover:underline"
          >
            ← ダッシュボードに戻る
          </Link>
        </div>
        <div className="rounded-lg bg-white p-8 shadow-md">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">投稿プロファイル</h1>
            <Link
              href="/dashboard/profiles/new"
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              新規作成
            </Link>
          </div>
          <PostProfileList profiles={result.data ?? []} />
        </div>
      </div>
    </div>
  )
}
