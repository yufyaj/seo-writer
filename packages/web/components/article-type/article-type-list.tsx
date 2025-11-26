'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  deleteArticleType,
  toggleArticleTypeEnabled,
  type SerializedArticleType,
} from '@/lib/article-type/actions'

type Props = {
  profileId: string
  articleTypes: SerializedArticleType[]
}

export function ArticleTypeList({
  profileId,
  articleTypes: initialArticleTypes,
}: Props) {
  const [articleTypes, setArticleTypes] = useState(initialArticleTypes)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleToggleEnabled = async (id: string) => {
    setIsLoading(id)
    setError('')

    try {
      const result = await toggleArticleTypeEnabled(id, profileId)
      if (result.success && result.data) {
        setArticleTypes((prev) =>
          prev.map((t) => (t.id === id ? result.data! : t))
        )
      } else if (!result.success) {
        setError(result.error)
      }
    } catch {
      setError('エラーが発生しました')
    } finally {
      setIsLoading(null)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除してもよろしいですか？`)) {
      return
    }

    setIsLoading(id)
    setError('')

    try {
      const result = await deleteArticleType(id, profileId)
      if (result.success) {
        setArticleTypes((prev) => prev.filter((t) => t.id !== id))
      } else {
        setError(result.error)
      }
    } catch {
      setError('エラーが発生しました')
    } finally {
      setIsLoading(null)
    }
  }

  if (articleTypes.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-gray-500">記事タイプがまだありません</p>
        <Link
          href={`/dashboard/profiles/${profileId}/article-types/new`}
          className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          新しい記事タイプを作成
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                記事タイプ名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                説明
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                ステータス
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {articleTypes.map((articleType) => (
              <tr key={articleType.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <Link
                    href={`/dashboard/profiles/${profileId}/article-types/${articleType.id}/edit`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {articleType.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {articleType.description ? (
                    <span className="line-clamp-2">
                      {articleType.description}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <button
                    onClick={() => handleToggleEnabled(articleType.id)}
                    disabled={isLoading === articleType.id}
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      articleType.is_enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {articleType.is_enabled ? '有効' : '無効'}
                  </button>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/dashboard/profiles/${profileId}/article-types/${articleType.id}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      編集
                    </Link>
                    <button
                      onClick={() =>
                        handleDelete(articleType.id, articleType.name)
                      }
                      disabled={isLoading === articleType.id}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
