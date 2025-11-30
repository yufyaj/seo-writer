'use client'

import { useState } from 'react'
import type { KeywordStrategy } from '@/lib/post-profile/validation'

type Props = {
  value: KeywordStrategy
  onChange: (value: KeywordStrategy) => void
  disabled?: boolean
}

export function KeywordStrategyEditor({ value, onChange, disabled }: Props) {
  const [newLongtailKeyword, setNewLongtailKeyword] = useState('')

  const handleConceptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...value,
      strategy_concept: e.target.value,
    })
  }

  const handleMainKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      main_keyword: e.target.value,
    })
  }

  const handleAddLongtailKeyword = () => {
    const keyword = newLongtailKeyword.trim()
    if (!keyword) return

    const currentKeywords = value.longtail_keywords || []
    if (currentKeywords.includes(keyword)) {
      setNewLongtailKeyword('')
      return
    }

    onChange({
      ...value,
      longtail_keywords: [...currentKeywords, keyword],
    })
    setNewLongtailKeyword('')
  }

  const handleRemoveLongtailKeyword = (index: number) => {
    const currentKeywords = value.longtail_keywords || []
    onChange({
      ...value,
      longtail_keywords: currentKeywords.filter((_, i) => i !== index),
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddLongtailKeyword()
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

      {/* メインキーワード（単一） */}
      <div>
        <label
          htmlFor="main_keyword"
          className="block text-sm font-medium text-gray-700"
        >
          メインキーワード
        </label>
        <p className="mt-1 text-sm text-gray-500">
          検索ボリュームの多い主要キーワード（1つのみ）
        </p>
        <input
          type="text"
          id="main_keyword"
          value={value.main_keyword || ''}
          onChange={handleMainKeywordChange}
          disabled={disabled}
          className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100"
          placeholder="例: SEO対策"
        />
      </div>

      {/* ロングテールキーワード（複数） */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          ロングテールキーワード
        </label>
        <p className="mt-1 text-sm text-gray-500">
          特定のニッチな検索意図に対応するキーワード（記事生成時に2-3個をランダム選定）
        </p>

        {/* キーワードタグ */}
        <div className="mt-2 flex flex-wrap gap-2">
          {(value.longtail_keywords || []).map((keyword, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
            >
              {keyword}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveLongtailKeyword(index)}
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
              value={newLongtailKeyword}
              onChange={(e) => setNewLongtailKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="キーワードを入力してEnter"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleAddLongtailKeyword}
              className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
            >
              追加
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
