'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createArticleType,
  updateArticleType,
  type SerializedArticleType,
} from '@/lib/article-type/actions'

type Props = {
  profileId: string
  articleType?: SerializedArticleType
}

export function ArticleTypeForm({ profileId, articleType }: Props) {
  const router = useRouter()
  const isEditing = !!articleType

  // フォーム状態
  const [name, setName] = useState(articleType?.name ?? '')
  const [description, setDescription] = useState(articleType?.description ?? '')
  const [promptTemplate, setPromptTemplate] = useState(
    articleType?.prompt_template ?? ''
  )
  const [isEnabled, setIsEnabled] = useState(articleType?.is_enabled ?? true)

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
      const result = isEditing
        ? await updateArticleType(
            {
              id: articleType.id,
              name,
              description,
              prompt_template: promptTemplate,
              is_enabled: isEnabled,
            },
            profileId
          )
        : await createArticleType({
            post_profile_id: profileId,
            name,
            description,
            prompt_template: promptTemplate,
            is_enabled: isEnabled,
          })

      if (result.success) {
        router.push(`/dashboard/profiles/${profileId}/article-types`)
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本情報 */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          記事タイプ名 <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          disabled={isLoading}
          placeholder="例: AIのよくある失敗5選"
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
          rows={2}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          disabled={isLoading}
          placeholder="管理画面用のメモ・説明"
        />
        {fieldErrors.description && (
          <p className="mt-1 text-sm text-red-600">
            {fieldErrors.description[0]}
          </p>
        )}
      </div>

      {/* プロンプトテンプレート */}
      <div>
        <label htmlFor="prompt_template" className="block text-sm font-medium">
          プロンプトテンプレート <span className="text-red-500">*</span>
        </label>
        <p className="mt-1 text-sm text-gray-500">
          LLMに渡すテンプレート。記事構成、見出しルール、文体、制約条件などを記述します。
        </p>
        <textarea
          id="prompt_template"
          value={promptTemplate}
          onChange={(e) => setPromptTemplate(e.target.value)}
          required
          rows={15}
          className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
          disabled={isLoading}
          placeholder={`例:
## 記事構成
1. 導入（読者の課題に共感）
2. 失敗事例1〜5（各事例の説明と対策）
3. まとめ（行動を促す）

## 制約条件
- 3000文字以上
- 専門用語には解説を入れる
- 見出しはH2, H3を使用`}
        />
        {fieldErrors.prompt_template && (
          <p className="mt-1 text-sm text-red-600">
            {fieldErrors.prompt_template[0]}
          </p>
        )}
      </div>

      {/* 有効フラグ */}
      <div className="flex items-center gap-2">
        <input
          id="is_enabled"
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => setIsEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
          disabled={isLoading}
        />
        <label htmlFor="is_enabled" className="text-sm font-medium">
          有効（記事生成の対象にする）
        </label>
      </div>

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
