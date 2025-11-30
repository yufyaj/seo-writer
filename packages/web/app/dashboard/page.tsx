import { auth } from '@/lib/auth/auth'

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="mt-2 text-gray-600">
          ようこそ、{session?.user?.email} さん
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 統計カード（将来的に追加） */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">投稿プロファイル</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">-</p>
          <p className="mt-1 text-sm text-gray-500">登録済みプロファイル数</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">今月の投稿</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">-</p>
          <p className="mt-1 text-sm text-gray-500">今月の自動投稿数</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">ジョブ実行</h3>
          <p className="mt-2 text-3xl font-bold text-purple-600">-</p>
          <p className="mt-1 text-sm text-gray-500">今月のジョブ実行回数</p>
        </div>
      </div>
    </div>
  )
}
