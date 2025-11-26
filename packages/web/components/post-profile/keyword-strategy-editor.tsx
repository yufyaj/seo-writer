'use client'

import { useState } from 'react'
import type { KeywordStrategy } from '@/lib/post-profile/validation'

type Props = {
  value: KeywordStrategy
  onChange: (value: KeywordStrategy) => void
  disabled?: boolean
}

type KeywordFieldKey = Exclude<keyof KeywordStrategy, 'strategy_concept'>

const keywordFields: { key: KeywordFieldKey; label: string; description: string }[] = [
  {
    key: 'head_middle',
    label: 'ヘッド・ミドルキーワード',
    description: '検索ボリュームの多い主要キーワード',
  },
  {
    key: 'transactional_cv',
    label: 'トランザクショナル・CV系',
    description: '購入・申込に直結するキーワード',
  },
  {
    key: 'informational_knowhow',
    label: 'インフォメーショナル・ノウハウ系',
    description: '情報収集段階のユーザー向けキーワード',
  },
  {
    key: 'business_specific',
    label: 'ビジネス固有キーワード',
    description: '自社サービス・商品固有のキーワード',
  },
]

export function KeywordStrategyEditor({ value, onChange, disabled }: Props) {
  const [newKeywords, setNewKeywords] = useState<Record<KeywordFieldKey, string>>({
    head_middle: '',
    transactional_cv: '',
    informational_knowhow: '',
    business_specific: '',
  })

  const handleConceptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...value,
      strategy_concept: e.target.value,
    })
  }

  const handleAddKeyword = (field: KeywordFieldKey) => {
    const keyword = newKeywords[field].trim()
    if (!keyword) return

    const currentKeywords = value[field] || []
    if (currentKeywords.includes(keyword)) {
      setNewKeywords((prev) => ({ ...prev, [field]: '' }))
      return
    }

    onChange({
      ...value,
      [field]: [...currentKeywords, keyword],
    })
    setNewKeywords((prev) => ({ ...prev, [field]: '' }))
  }

  const handleRemoveKeyword = (field: KeywordFieldKey, index: number) => {
    const currentKeywords = value[field] || []
    onChange({
      ...value,
      [field]: currentKeywords.filter((_, i) => i !== index),
    })
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: KeywordFieldKey
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddKeyword(field)
    }
  }

  return (
    <div className="space-y-6">
      {/* 戦略コンセプト */}
      <div>
        <label
          htmlFor="strategy_concept"
          className="block text-sm font-medium text-gray-700"
        >
          SEO戦略コンセプト
        </label>
        <p className="mt-1 text-sm text-gray-500">
          このプロファイルのSEO戦略の全体像を記述してください
        </p>
        <textarea
          id="strategy_concept"
          value={value.strategy_concept || ''}
          onChange={handleConceptChange}
          disabled={disabled}
          rows={4}
          className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100"
          placeholder="例: BtoB向けSaaS製品のリード獲得を目的とした、業界課題解決型のコンテンツ戦略"
        />
      </div>

      {/* キーワードフィールド */}
      {keywordFields.map(({ key, label, description }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          <p className="mt-1 text-sm text-gray-500">{description}</p>

          {/* キーワードタグ */}
          <div className="mt-2 flex flex-wrap gap-2">
            {(value[key] || []).map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
              >
                {keyword}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(key, index)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>

          {/* 追加フォーム */}
          {!disabled && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newKeywords[key]}
                onChange={(e) =>
                  setNewKeywords((prev) => ({ ...prev, [key]: e.target.value }))
                }
                onKeyDown={(e) => handleKeyDown(e, key)}
                placeholder="キーワードを入力してEnter"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => handleAddKeyword(key)}
                className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
              >
                追加
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
