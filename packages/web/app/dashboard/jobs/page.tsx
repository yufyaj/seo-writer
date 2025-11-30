import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { getJobs } from '@/lib/job/actions'
import Link from 'next/link'

type Props = {
  searchParams: Promise<{ page?: string }>
}

export default async function JobsPage({ searchParams }: Props) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { page: pageParam } = await searchParams
  const page = pageParam ? parseInt(pageParam, 10) : 1

  const result = await getJobs(page, 20)

  if (!result.success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-lg bg-white p-8 shadow-md">
            <p className="text-red-600">{result.error}</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-blue-600 hover:underline"
            >
              ダッシュボードに戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { jobs, total } = result.data!
  const totalPages = Math.ceil(total / 20)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-yellow-100 text-yellow-800'
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'partial_failed':
        return 'bg-orange-100 text-orange-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'running':
        return '実行中'
      case 'success':
        return '成功'
      case 'partial_failed':
        return '一部失敗'
      case 'failed':
        return '失敗'
      default:
        return status
    }
  }

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case 'manual':
        return '手動'
      case 'scheduler':
        return 'スケジューラー'
      default:
        return trigger
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4">
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:underline"
          >
            &larr; ダッシュボードに戻る
          </Link>
        </div>
        <div className="rounded-lg bg-white p-8 shadow-md">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">ジョブ履歴</h1>
            <p className="mt-1 text-sm text-gray-500">
              記事生成・投稿ジョブの実行履歴
            </p>
          </div>

          {jobs.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">ジョブ履歴がありません</p>
              <p className="mt-2 text-sm text-gray-400">
                記事タイプページから「記事生成」を実行すると履歴が表示されます
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        トリガー
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        開始日時
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        完了日時
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {jobs.map((job) => (
                      <tr key={job.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          #{job.id}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {getTriggerLabel(job.trigger_type)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(job.status)}`}
                          >
                            {getStatusLabel(job.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {new Date(job.started_at).toLocaleString('ja-JP')}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {job.finished_at
                            ? new Date(job.finished_at).toLocaleString('ja-JP')
                            : '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                          <Link
                            href={`/dashboard/jobs/${job.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            詳細
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    全 {total} 件中 {(page - 1) * 20 + 1} -{' '}
                    {Math.min(page * 20, total)} 件
                  </p>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <Link
                        href={`/dashboard/jobs?page=${page - 1}`}
                        className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                      >
                        前へ
                      </Link>
                    )}
                    {page < totalPages && (
                      <Link
                        href={`/dashboard/jobs?page=${page + 1}`}
                        className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                      >
                        次へ
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
