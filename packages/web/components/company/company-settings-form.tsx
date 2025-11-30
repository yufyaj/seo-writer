'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createCompany,
  updateCompany,
  type SerializedCompany,
} from '@/lib/company/actions'
import { testWpConnection } from '@/lib/company/wp-connection'
import { wpStatusValues, type WpStatus } from '@/lib/company/validation'

type Props = {
  company: SerializedCompany | null
}

export function CompanySettingsForm({ company }: Props) {
  const router = useRouter()
  const isEditing = !!company

  // フォーム状態
  const [companyName, setCompanyName] = useState(company?.company_name ?? '')
  const [brandName, setBrandName] = useState(company?.brand_name ?? '')
  const [aboutText, setAboutText] = useState(company?.about_text ?? '')
  const [siteUrl, setSiteUrl] = useState(company?.site_url ?? '')
  const [wpBaseUrl, setWpBaseUrl] = useState(company?.wp_base_url ?? '')
  const [wpUsername, setWpUsername] = useState(company?.wp_username ?? '')
  const [wpAppPassword, setWpAppPassword] = useState('')
  const [wpDefaultStatus, setWpDefaultStatus] = useState<WpStatus>(
    (company?.wp_default_status as WpStatus) ?? 'draft'
  )

  // UI状態
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setIsLoading(true)

    try {
      const input = {
        company_name: companyName,
        brand_name: brandName,
        about_text: aboutText,
        site_url: siteUrl,
        wp_base_url: wpBaseUrl,
        wp_username: wpUsername,
        wp_app_password: wpAppPassword,
        wp_default_status: wpDefaultStatus,
      }

      const result = isEditing
        ? await updateCompany(input)
        : await createCompany(input)

      if (result.success) {
        router.refresh()
        setWpAppPassword('')
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

  const handleTestConnection = async () => {
    setTestResult(null)
    setIsTesting(true)

    try {
      const result = await testWpConnection(
        wpBaseUrl,
        wpUsername,
        wpAppPassword || ''
      )

      if (result.success) {
        setTestResult({
          success: true,
          message: result.siteTitle
            ? `接続成功: ${result.siteTitle}`
            : '接続成功',
        })
      } else {
        setTestResult({
          success: false,
          message: result.error,
        })
      }
    } catch {
      setTestResult({
        success: false,
        message: '接続テストに失敗しました',
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 会社情報セクション */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">会社情報</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="company_name" className="block text-sm font-medium">
              会社名 <span className="text-red-500">*</span>
            </label>
            <input
              id="company_name"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              disabled={isLoading}
            />
            {fieldErrors.company_name && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.company_name[0]}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="brand_name" className="block text-sm font-medium">
              ブランド名
            </label>
            <input
              id="brand_name"
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="about_text" className="block text-sm font-medium">
              会社紹介文
            </label>
            <textarea
              id="about_text"
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="site_url" className="block text-sm font-medium">
              自社サイトURL
            </label>
            <input
              id="site_url"
              type="url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              disabled={isLoading}
            />
            {fieldErrors.site_url && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.site_url[0]}
              </p>
            )}
          </div>

        </div>
      </section>

      {/* WordPress設定セクション */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">WordPress設定</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="wp_base_url" className="block text-sm font-medium">
              WordPress URL <span className="text-red-500">*</span>
            </label>
            <input
              id="wp_base_url"
              type="url"
              value={wpBaseUrl}
              onChange={(e) => setWpBaseUrl(e.target.value)}
              required
              placeholder="https://your-wordpress-site.com"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              disabled={isLoading}
            />
            {fieldErrors.wp_base_url && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.wp_base_url[0]}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="wp_username" className="block text-sm font-medium">
              ユーザー名 <span className="text-red-500">*</span>
            </label>
            <input
              id="wp_username"
              type="text"
              value={wpUsername}
              onChange={(e) => setWpUsername(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              disabled={isLoading}
            />
            {fieldErrors.wp_username && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.wp_username[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="wp_app_password"
              className="block text-sm font-medium"
            >
              アプリパスワード{' '}
              {!isEditing && <span className="text-red-500">*</span>}
            </label>
            <input
              id="wp_app_password"
              type="password"
              value={wpAppPassword}
              onChange={(e) => setWpAppPassword(e.target.value)}
              required={!isEditing}
              placeholder={isEditing ? '変更する場合のみ入力' : ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              disabled={isLoading}
            />
            {fieldErrors.wp_app_password && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.wp_app_password[0]}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              WordPressの「ユーザー」→「プロフィール」→「アプリケーションパスワード」から生成できます
            </p>
          </div>

          <div>
            <label
              htmlFor="wp_default_status"
              className="block text-sm font-medium"
            >
              デフォルト投稿ステータス
            </label>
            <select
              id="wp_default_status"
              value={wpDefaultStatus}
              onChange={(e) => setWpDefaultStatus(e.target.value as WpStatus)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              disabled={isLoading}
            >
              {wpStatusValues.map((status) => (
                <option key={status} value={status}>
                  {status === 'draft' && '下書き'}
                  {status === 'publish' && '公開'}
                  {status === 'pending' && 'レビュー待ち'}
                  {status === 'private' && '非公開'}
                </option>
              ))}
            </select>
          </div>

          {/* 接続テスト */}
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">接続テスト</span>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !wpBaseUrl || !wpUsername}
                className="rounded-md bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {isTesting ? 'テスト中...' : 'テスト実行'}
              </button>
            </div>
            {testResult && (
              <p
                className={`mt-2 text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}
              >
                {testResult.message}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* エラー表示 */}
      {error && (
        <div className="text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? '保存中...' : isEditing ? '更新する' : '登録する'}
      </button>
    </form>
  )
}
