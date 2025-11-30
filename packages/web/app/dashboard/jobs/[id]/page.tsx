import { auth } from '@/lib/auth/auth'
import { redirect, notFound } from 'next/navigation'
import { getJobDetail } from '@/lib/job/actions'
import Link from 'next/link'

type Props = {
  params: Promise<{ id: string }>
}

export default async function JobDetailPage({ params }: Props) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  const result = await getJobDetail(id)

  if (!result.success) {
    if (result.error === 'ジョブが見つかりません') {
      notFound()
    }
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-lg bg-white p-8 shadow-md">
            <p className="text-red-600">{result.error}</p>
            <Link
              href="/dashboard/jobs"
              className="mt-4 inline-block text-blue-600 hover:underline"
            >
              ジョブ一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const job = result.data!

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
            href="/dashboard/jobs"
            className="text-sm text-blue-600 hover:underline"
          >
            &larr; ジョブ一覧に戻る
          </Link>
        </div>
        <div className="rounded-lg bg-white p-8 shadow-md">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">ジョブ詳細 #{job.id}</h1>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getStatusBadge(job.status)}`}
              >
                {getStatusLabel(job.status)}
              </span>
            </div>
          </div>

          <div className="mb-8 grid gap-4 rounded-lg bg-gray-50 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">トリガー</p>
                <p className="font-medium">{getTriggerLabel(job.trigger_type)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">投稿プロファイルID</p>
                <p className="font-medium">{job.post_profile_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">開始日時</p>
                <p className="font-medium">
                  {new Date(job.started_at).toLocaleString('ja-JP')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">完了日時</p>
                <p className="font-medium">
                  {job.finished_at
                    ? new Date(job.finished_at).toLocaleString('ja-JP')
                    : '-'}
                </p>
              </div>
            </div>

            {job.error_message && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <p className="text-sm font-medium text-red-800">エラー内容</p>
                <p className="mt-1 text-sm text-red-700">{job.error_message}</p>
              </div>
            )}
          </div>

          <h2 className="mb-4 text-lg font-semibold">ジョブアイテム</h2>

          {job.items.length === 0 ? (
            <p className="text-gray-500">ジョブアイテムがありません</p>
          ) : (
            <div className="space-y-4">
              {job.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium">
                      {item.title || '（タイトル未設定）'}
                    </h3>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(item.status)}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">キーワード</p>
                      <p>{item.keyword || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">記事タイプID</p>
                      <p>{item.post_profile_article_type_id}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">WordPress投稿ID</p>
                      <p>{item.wp_post_id || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">WordPress投稿URL</p>
                      {item.wp_post_url ? (
                        <a
                          href={item.wp_post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          投稿を見る
                        </a>
                      ) : (
                        <p>-</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500">WordPressメディアID</p>
                      <p>{item.wp_media_id || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">作成日時</p>
                      <p>{new Date(item.created_at).toLocaleString('ja-JP')}</p>
                    </div>
                  </div>

                  {item.error_message && (
                    <div className="mt-4 rounded-md bg-red-50 p-3">
                      <p className="text-sm font-medium text-red-800">エラー</p>
                      <p className="mt-1 text-sm text-red-700">
                        {item.error_message}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
