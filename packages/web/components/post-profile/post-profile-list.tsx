'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  deletePostProfile,
  togglePostProfileActive,
  type SerializedPostProfile,
} from '@/lib/post-profile/actions'

type Props = {
  profiles: SerializedPostProfile[]
}

export function PostProfileList({ profiles: initialProfiles }: Props) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleToggleActive = async (id: string) => {
    setIsLoading(id)
    setError('')

    try {
      const result = await togglePostProfileActive(id)
      if (result.success && result.data) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === id ? result.data! : p))
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
      const result = await deletePostProfile(id)
      if (result.success) {
        setProfiles((prev) => prev.filter((p) => p.id !== id))
      } else {
        setError(result.error)
      }
    } catch {
      setError('エラーが発生しました')
    } finally {
      setIsLoading(null)
    }
  }

  if (profiles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">プロファイルがまだありません</p>
        <Link
          href="/dashboard/profiles/new"
          className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          新しいプロファイルを作成
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
                プロファイル名
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
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <Link
                    href={`/dashboard/profiles/${profile.id}/edit`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {profile.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {profile.description ? (
                    <span className="line-clamp-2">{profile.description}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <button
                    onClick={() => handleToggleActive(profile.id)}
                    disabled={isLoading === profile.id}
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      profile.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {profile.is_active ? '有効' : '無効'}
                  </button>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/dashboard/profiles/${profile.id}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      編集
                    </Link>
                    <button
                      onClick={() => handleDelete(profile.id, profile.name)}
                      disabled={isLoading === profile.id}
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
