import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { logout } from '@/lib/auth/actions'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
          <p className="mt-2 text-gray-600">
            ようこそ、{session.user.email} さん
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/dashboard/settings"
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              会社・サイト設定
            </Link>
            <Link
              href="/dashboard/profiles"
              className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              投稿プロファイル
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
