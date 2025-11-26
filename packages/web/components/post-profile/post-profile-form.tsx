'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createPostProfile,
  updatePostProfile,
  type SerializedPostProfile,
} from '@/lib/post-profile/actions'
import {
  createEmptyKeywordStrategy,
  type KeywordStrategy,
} from '@/lib/post-profile/validation'
import { KeywordStrategyEditor } from './keyword-strategy-editor'

type Props = {
  profile?: SerializedPostProfile
}

export function PostProfileForm({ profile }: Props) {
  const router = useRouter()
  const isEditing = !!profile

  // フォーム状態
  const [name, setName] = useState(profile?.name ?? '')
  const [description, setDescription] = useState(profile?.description ?? '')
  const [wpCategoryId, setWpCategoryId] = useState(
    profile?.wp_category_id ?? ''
  )
  const [keywordStrategy, setKeywordStrategy] = useState<KeywordStrategy>(
    profile?.keyword_strategy ?? createEmptyKeywordStrategy()
  )
  const [isActive, setIsActive] = useState(profile?.is_active ?? true)

  // UI状態
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setIsLoading(true)

    try {
      const input = {
        name,
        description,
        wp_category_id: wpCategoryId ? parseInt(wpCategoryId, 10) : null,
        keyword_strategy: keywordStrategy,
        is_active: isActive,
      }

      const result = isEditing
        ? await updatePostProfile({ ...input, id: profile.id })
        : await createPostProfile(input)

      if (result.success) {
        router.push('/dashboard/profiles')
        router.refresh()
      } else {
        setError(result.error)
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors)
        }
      }
    } catch {
      setError('予期しないエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 基本情報セクション */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">基本情報</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              プロファイル名 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              disabled={isLoading}
              placeholder="例: メインブログ"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.name[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium">
              説明
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              disabled={isLoading}
              placeholder="このプロファイルの用途や特徴を記述"
            />
            {fieldErrors.description && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.description[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="wp_category_id"
              className="block text-sm font-medium"
            >
              WordPress カテゴリID
            </label>
            <input
              id="wp_category_id"
              type="number"
              value={wpCategoryId}
              onChange={(e) => setWpCategoryId(e.target.value)}
              min="1"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              disabled={isLoading}
              placeholder="例: 5"
            />
            <p className="mt-1 text-sm text-gray-500">
              WordPressの投稿時に自動で設定されるカテゴリのID
            </p>
            {fieldErrors.wp_category_id && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.wp_category_id[0]}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
              disabled={isLoading}
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              有効
            </label>
          </div>
        </div>
      </section>

      {/* キーワード戦略セクション */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">キーワード戦略</h2>
        <KeywordStrategyEditor
          value={keywordStrategy}
          onChange={setKeywordStrategy}
          disabled={isLoading}
        />
      </section>

      {/* エラー表示 */}
      {error && (
        <div className="text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      {/* ボタン */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? '保存中...' : isEditing ? '更新する' : '作成する'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}
