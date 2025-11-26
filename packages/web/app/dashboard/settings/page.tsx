import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { getCompany } from '@/lib/company/actions'
import { CompanySettingsForm } from '@/components/company/company-settings-form'
import Link from 'next/link'

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const result = await getCompany()

  if (!result.success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="rounded-lg bg-white p-8 shadow-md">
            <p className="text-red-600">{result.error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-4">
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:underline"
          >
            ← ダッシュボードに戻る
          </Link>
        </div>
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-6 text-2xl font-bold">会社・サイト設定</h1>
          <CompanySettingsForm company={result.data ?? null} />
        </div>
      </div>
    </div>
  )
}
